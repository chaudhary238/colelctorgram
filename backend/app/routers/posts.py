import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete, func
from sqlalchemy.dialects.postgresql import insert as pg_insert

from app.database import get_db
from app.dependencies import get_current_user
from app.models.post import Post, PostLike, PostSave, Comment, CommentLike, PostCommunity, PollVote
from app.models.user import User
from app.models.item import Item
from app.models.listing import Listing
from app.models.community import Community, CommunityMember
from app.services.notifications import notify
from app.services.gamification import award_xp, feed_badge
from app.services.blocks import blocked_user_ids
from app.services.social import likers_preview
from app.services.ratelimit import rate_limit_user

router = APIRouter(prefix="/posts", tags=["posts"])
comments_router = APIRouter(prefix="/comments", tags=["posts"])


def _iso_fields(post: Post) -> dict:
    """ISO ("In Search Of") fields for the feed/detail card (DF-30c).

    iso_cond is the conditions joined for the single chip the ISOCard renders;
    iso_budget stays in paise (the card divides by 100, money convention).
    """
    return {
        "iso_item": post.iso_item,
        "iso_budget": post.iso_budget,
        "iso_cond": ", ".join(post.iso_conditions) if post.iso_conditions else None,
    }


class CreatePostBody(BaseModel):
    type: str  # showcase | discussion | review | poll | iso
    body: str = ""
    title: Optional[str] = None  # DF-30d optional display title
    images: list[str] = []
    tags: list[str] = []  # hashtags, e.g. ["#NewDrops"] (DF-10)
    category: Optional[str] = None
    # DF-30h — post to the feed and/or several communities. community_id kept for
    # back-compat (single-community callers); communities[] is the multi-select.
    community_id: Optional[str] = None
    communities: list[str] = []
    to_feed: bool = True
    poll_options: Optional[dict] = None
    ref_item_id: Optional[uuid.UUID] = None
    ref_listing_id: Optional[uuid.UUID] = None
    review_rating: Optional[int] = None
    # DF-30c — ISO ("In Search Of") fields (only when type == 'iso')
    iso_item: Optional[str] = None
    iso_budget: Optional[int] = None  # max budget, paise
    iso_conditions: list[str] = []


class CreateCommentBody(BaseModel):
    body: str
    parent_id: Optional[uuid.UUID] = None


@router.post("", status_code=status.HTTP_201_CREATED,
             dependencies=[Depends(rate_limit_user("post"))])  # B-68
async def create_post(
    body: CreatePostBody,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # DF-30h — resolve the target communities (multi-select, with single-community
    # back-compat). Each gets a per-community published/pending status (DF-27).
    target_ids: list[str] = list(dict.fromkeys(body.communities or ([body.community_id] if body.community_id else [])))
    primary_id = target_ids[0] if target_ids else None

    # Per-community mod-approval gate: a post awaits review in any approval-mode
    # community where the author isn't a founder/mod.
    community_status: dict[str, str] = {}
    for cid in target_ids:
        community = (
            await db.execute(select(Community).where(Community.id == cid))
        ).scalar_one_or_none()
        cstatus = "published"
        if community and community.post_mode == "approval":
            is_mod = (
                await db.execute(
                    select(CommunityMember).where(
                        CommunityMember.community_id == cid,
                        CommunityMember.user_id == current_user.id,
                        CommunityMember.role.in_(["founder", "mod"]),
                    )
                )
            ).scalar_one_or_none() is not None
            if not is_mod:
                cstatus = "pending"
        community_status[cid] = cstatus

    # DF-30c — ISO posts carry the wanted item + budget/condition; body holds the
    # optional extra details (may be empty, which the NOT NULL body tolerates).
    is_iso = body.type == "iso"
    iso_conditions = [c for c in body.iso_conditions if c and c.lower() != "any"] or None

    # Overall post.status: the global feed gate. Published unless the post is
    # NOT on the feed and every target community is still pending review.
    if body.to_feed:
        post_status = "published"
    elif community_status and all(s == "pending" for s in community_status.values()):
        post_status = "pending"
    else:
        post_status = "published"

    post = Post(
        user_id=current_user.id,
        type=body.type,
        title=(body.title or None),
        body=body.body or "",
        images=body.images,
        category=body.category,
        tags=[t if t.startswith("#") else f"#{t}" for t in body.tags],
        community_id=primary_id,
        to_feed=body.to_feed,
        poll_options=body.poll_options,
        ref_item_id=body.ref_item_id,
        ref_listing_id=body.ref_listing_id,
        review_rating=body.review_rating,
        iso_item=(body.iso_item or None) if is_iso else None,
        iso_budget=body.iso_budget if is_iso else None,
        iso_conditions=iso_conditions if is_iso else None,
        status=post_status,
    )
    db.add(post)
    await db.flush()

    for cid, cstatus in community_status.items():
        db.add(PostCommunity(post_id=post.id, community_id=cid, status=cstatus))
    await db.flush()

    # XP (dedup'd on post id): showcase/poll/ISO posts all earn the +25 showcase
    # award (v6 DV6-04); reviews earn +15.
    if body.type in ("showcase", "poll", "iso"):
        await award_xp(db, current_user, "showcase", ref_id=str(post.id), ref_type="post")
    elif body.type == "review":
        await award_xp(db, current_user, "review", ref_id=str(post.id), ref_type="post")

    return {"id": str(post.id), "status": post_status}


@router.get("/{post_id}")
async def get_post(
    post_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Post).where(Post.id == post_id))
    post = result.scalar_one_or_none()
    if not post or post.status == "removed":  # B-70 — taken down by moderation
        raise HTTPException(status_code=404, detail="Post not found")

    comments_result = await db.execute(
        select(Comment)
        .where(Comment.post_id == post_id, Comment.is_removed == False)  # noqa: E712 — B-70
        .order_by(Comment.created_at)
    )
    comments = comments_result.scalars().all()

    # B-69: hide comments by users in a block relationship with the viewer — and any
    # replies under a hidden comment (they'd be orphans in the threaded UI).
    blocked = await blocked_user_ids(db, current_user.id)
    if blocked:
        hidden_ids: set = set()
        kept = []
        for c in comments:  # created_at order ⇒ parents precede replies
            if c.user_id in blocked or (c.parent_id and c.parent_id in hidden_ids):
                hidden_ids.add(c.id)
            else:
                kept.append(c)
        comments = kept

    # Batch-load comment authors so the UI can show handle / name / avatar
    commenter_ids = list({c.user_id for c in comments})
    authors_by_id: dict = {}
    if commenter_ids:
        authors_result = await db.execute(select(User).where(User.id.in_(commenter_ids)))
        authors_by_id = {u.id: u for u in authors_result.scalars().all()}

    # Viewer's per-comment like state (DF-29b rich comment thread)
    liked_comment_ids: set = set()
    if comments:
        cl_result = await db.execute(
            select(CommentLike.comment_id).where(
                CommentLike.user_id == current_user.id,
                CommentLike.comment_id.in_([c.id for c in comments]),
            )
        )
        liked_comment_ids = set(cl_result.scalars().all())

    # Post author (the detail endpoint must carry the byline, not just comments)
    author = (await db.execute(select(User).where(User.id == post.user_id))).scalar_one_or_none()

    # Viewer's like / save state
    liked = (await db.execute(
        select(PostLike).where(PostLike.post_id == post_id, PostLike.user_id == current_user.id)
    )).scalar_one_or_none() is not None
    saved = (await db.execute(
        select(PostSave).where(PostSave.post_id == post_id, PostSave.user_id == current_user.id)
    )).scalar_one_or_none() is not None

    # Viewer's poll vote (locked once cast) — None if unvoted or not a poll
    my_poll_vote = None
    if post.type == "poll":
        my_poll_vote = (await db.execute(
            select(PollVote.option_index).where(
                PollVote.post_id == post_id, PollVote.user_id == current_user.id
            )
        )).scalar_one_or_none()

    # Referenced item / listing (the "showcasing" chip)
    ref = None
    if post.ref_item_id:
        ri = (await db.execute(select(Item).where(Item.id == post.ref_item_id))).scalar_one_or_none()
        if ri:
            ref = {"kind": "item", "id": str(ri.id), "sku": ri.sku,
                   "title": ri.custom_title or ri.sku or "Item"}
    elif post.ref_listing_id:
        rl = (await db.execute(select(Listing).where(Listing.id == post.ref_listing_id))).scalar_one_or_none()
        if rl:
            ref = {"kind": "listing", "id": str(rl.id), "sku": rl.sku,
                   "title": rl.sku or "Listing", "price": rl.price}

    # DF-30h — every community this post was published to
    community_ids = (await db.execute(
        select(PostCommunity.community_id).where(
            PostCommunity.post_id == post_id, PostCommunity.status == "published"
        )
    )).scalars().all()

    return {
        "id": str(post.id),
        "user_id": str(post.user_id),
        "handle": author.handle if author else None,
        "name": author.name if author else None,
        "avatar_url": author.avatar_url if author else None,
        # Rewards badge (v3 §3): First Start badge if any, else the rank badge.
        # None for staff — they show the Official tag instead (QA 2026-08-04 §4).
        "badge": feed_badge(author) if author else None,
        "is_official": bool(author is not None and author.is_admin),
        # QA §5 — up to 3 recent likers for the social-proof strip.
        "likers": (await likers_preview(db, [post.id])).get(post.id, []),
        "type": post.type,
        "title": post.title,
        "body": post.body,
        "images": post.images,
        **_iso_fields(post),
        "community_ids": list(community_ids),
        "category": post.category,
        "tags": post.tags or [],
        "community_id": post.community_id,
        "likes_count": post.likes_count,
        "comments_count": post.comments_count,
        "saves_count": post.saves_count,
        "review_rating": post.review_rating,
        "poll_options": post.poll_options,
        "my_poll_vote": my_poll_vote,
        "is_liked": liked,
        "is_saved": saved,
        "ref": ref,
        "created_at": post.created_at.isoformat(),
        "comments": [
            {
                "id": str(c.id),
                "user_id": str(c.user_id),
                "handle": authors_by_id[c.user_id].handle if c.user_id in authors_by_id else None,
                "name": authors_by_id[c.user_id].name if c.user_id in authors_by_id else None,
                "avatar_url": authors_by_id[c.user_id].avatar_url if c.user_id in authors_by_id else None,
                "parent_id": str(c.parent_id) if c.parent_id else None,
                "body": c.body,
                "likes_count": c.likes_count,
                "is_liked": c.id in liked_comment_ids,
                "is_mine": c.user_id == current_user.id,
                "created_at": c.created_at.isoformat(),
            }
            for c in comments
        ],
    }


class EditPostBody(BaseModel):
    """B-73 (PO-06) — owner content edits. Explicit allow-list, no blind setattr.

    Deliberately NOT editable: type (cards render per-type), community targets
    (routing has its own mod-approval flow), poll_options (votes are locked to
    option indices), ref_item_id/ref_listing_id (provenance chips).
    """
    body: Optional[str] = None
    title: Optional[str] = None
    images: Optional[list[str]] = None
    tags: Optional[list[str]] = None
    category: Optional[str] = None
    review_rating: Optional[int] = None
    iso_item: Optional[str] = None
    iso_budget: Optional[int] = None
    iso_conditions: Optional[list[str]] = None


@router.patch("/{post_id}")
async def edit_post(
    post_id: uuid.UUID,
    body: EditPostBody,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Post).where(Post.id == post_id))
    post = result.scalar_one_or_none()
    if not post or post.status == "removed":
        raise HTTPException(status_code=404, detail="Post not found")
    if post.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your post")

    fields = body.model_dump(exclude_unset=True)
    # Photo-required types keep their invariant from create (ISO/review need ≥1 photo)
    if "images" in fields and post.type in ("iso", "review") and not fields["images"]:
        raise HTTPException(status_code=422, detail=f"A {post.type} post needs at least one photo")
    if "review_rating" in fields and fields["review_rating"] is not None \
            and not (1 <= fields["review_rating"] <= 5):
        raise HTTPException(status_code=422, detail="review_rating must be 1–5")
    for key, value in fields.items():
        setattr(post, key, value)
    await db.flush()
    return {"id": str(post.id), "updated_at": post.updated_at.isoformat()}


@router.delete("/{post_id}", status_code=204)
async def delete_post(
    post_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Post).where(Post.id == post_id))
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if post.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not your post")
    await db.delete(post)


@router.post("/{post_id}/like", status_code=204)
async def toggle_like(
    post_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    post_result = await db.execute(select(Post).where(Post.id == post_id))
    post = post_result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    # B-75/B-76: row-first toggle — delete/insert decide the winner, counters move
    # atomically in SQL only when a row actually changed (double-click can't 500
    # on the unique key or double-count).
    removed = await db.execute(
        delete(PostLike).where(PostLike.user_id == current_user.id, PostLike.post_id == post_id)
    )
    if removed.rowcount:
        await db.execute(
            update(Post).where(Post.id == post_id)
            .values(likes_count=func.greatest(Post.likes_count - 1, 0))
        )
    else:
        inserted = await db.execute(
            pg_insert(PostLike).values(user_id=current_user.id, post_id=post_id)
            .on_conflict_do_nothing()
        )
        if not inserted.rowcount:
            return  # concurrent request already liked — nothing to count
        await db.execute(
            update(Post).where(Post.id == post_id).values(likes_count=Post.likes_count + 1)
        )
        if post.user_id != current_user.id:
            await award_xp(db, current_user, "like", ref_id=str(post.id), ref_type="post")
            await notify(
                db,
                user_id=post.user_id,
                actor_id=current_user.id,
                kind="like",
                title="New like",
                body="liked your post.",
                ref_type="post",
                ref_id=str(post.id),
            )


@router.post("/{post_id}/save", status_code=204)
async def toggle_save(
    post_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    post_result = await db.execute(select(Post).where(Post.id == post_id))
    post = post_result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    # B-75/B-76 — same race-safe toggle shape as /like
    removed = await db.execute(
        delete(PostSave).where(PostSave.user_id == current_user.id, PostSave.post_id == post_id)
    )
    if removed.rowcount:
        await db.execute(
            update(Post).where(Post.id == post_id)
            .values(saves_count=func.greatest(Post.saves_count - 1, 0))
        )
    else:
        inserted = await db.execute(
            pg_insert(PostSave).values(user_id=current_user.id, post_id=post_id)
            .on_conflict_do_nothing()
        )
        if inserted.rowcount:
            await db.execute(
                update(Post).where(Post.id == post_id).values(saves_count=Post.saves_count + 1)
            )


class PollVoteBody(BaseModel):
    option_index: int


@router.post("/{post_id}/poll-vote")
async def vote_poll(
    post_id: uuid.UUID,
    body: PollVoteBody,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Cast a one-time, locked vote on a poll post.

    Returns the (updated) tallies plus the viewer's option so the client can
    reconcile. Voting is idempotent: a second call never changes the counts and
    never lets the user switch options — it just echoes their existing choice.
    """
    post = (await db.execute(select(Post).where(Post.id == post_id))).scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if post.type != "poll" or not post.poll_options:
        raise HTTPException(status_code=400, detail="Post is not a poll")

    labels = list(post.poll_options.keys())
    if not (0 <= body.option_index < len(labels)):
        raise HTTPException(status_code=400, detail="Invalid poll option")

    existing = (await db.execute(
        select(PollVote).where(PollVote.post_id == post_id, PollVote.user_id == current_user.id)
    )).scalar_one_or_none()

    if existing is None:
        # First vote: record it and bump the chosen option's tally. Reassign the
        # dict so SQLAlchemy tracks the JSONB mutation.
        opts = dict(post.poll_options)
        label = labels[body.option_index]
        opts[label] = int(opts.get(label) or 0) + 1
        post.poll_options = opts
        db.add(PollVote(user_id=current_user.id, post_id=post_id, option_index=body.option_index))
        my_vote = body.option_index
    else:
        my_vote = existing.option_index

    return {"poll_options": post.poll_options, "my_poll_vote": my_vote}


@router.post("/{post_id}/comments", status_code=201)
async def add_comment(
    post_id: uuid.UUID,
    body: CreateCommentBody,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    post_result = await db.execute(select(Post).where(Post.id == post_id))
    post = post_result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    comment = Comment(
        post_id=post_id,
        user_id=current_user.id,
        parent_id=body.parent_id,
        body=body.body,
    )
    db.add(comment)
    # B-75 — atomic increment (no read-modify-write on the ORM instance)
    await db.execute(
        update(Post).where(Post.id == post_id).values(comments_count=Post.comments_count + 1)
    )
    if post.user_id != current_user.id:
        snippet = body.body if len(body.body) <= 80 else body.body[:80] + "…"
        await notify(
            db,
            user_id=post.user_id,
            actor_id=current_user.id,
            kind="comment",
            title="New comment",
            body=f"commented: {snippet}",
            ref_type="post",
            ref_id=str(post.id),
        )
    await db.flush()
    # XP: +5 per comment, dedup'd on comment id; not for self-comments (GM-05).
    if post.user_id != current_user.id:
        await award_xp(db, current_user, "comment", ref_id=str(comment.id), ref_type="comment")
    return {
        "id": str(comment.id),
        "user_id": str(comment.user_id),
        "handle": current_user.handle,
        "name": current_user.name,
        "avatar_url": current_user.avatar_url,
        "parent_id": str(comment.parent_id) if comment.parent_id else None,
        "body": comment.body,
        "likes_count": 0,
        "is_liked": False,
        "is_mine": True,
        "created_at": comment.created_at.isoformat(),
    }


class EditCommentBody(BaseModel):
    body: str


@comments_router.patch("/{comment_id}")
async def edit_comment(
    comment_id: uuid.UUID,
    body: EditCommentBody,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Comment).where(Comment.id == comment_id))
    comment = result.scalar_one_or_none()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    if comment.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your comment")
    text = body.body.strip()
    if not text:
        raise HTTPException(status_code=422, detail="Comment cannot be empty")
    comment.body = text
    await db.flush()
    return {"id": str(comment.id), "body": comment.body}


@comments_router.post("/{comment_id}/like", status_code=204)
async def toggle_comment_like(
    comment_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Comment).where(Comment.id == comment_id))
    comment = result.scalar_one_or_none()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    # B-75/B-76 — same race-safe toggle shape as post /like
    removed = await db.execute(
        delete(CommentLike).where(
            CommentLike.user_id == current_user.id,
            CommentLike.comment_id == comment_id,
        )
    )
    if removed.rowcount:
        await db.execute(
            update(Comment).where(Comment.id == comment_id)
            .values(likes_count=func.greatest(Comment.likes_count - 1, 0))
        )
    else:
        inserted = await db.execute(
            pg_insert(CommentLike).values(user_id=current_user.id, comment_id=comment_id)
            .on_conflict_do_nothing()
        )
        if inserted.rowcount:
            await db.execute(
                update(Comment).where(Comment.id == comment_id)
                .values(likes_count=Comment.likes_count + 1)
            )


@comments_router.delete("/{comment_id}", status_code=204)
async def delete_comment(
    comment_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Comment).where(Comment.id == comment_id))
    comment = result.scalar_one_or_none()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    if comment.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not your comment")
    # Replies reference this comment via parent_id (no DB cascade), so a parent
    # with replies must take its children down with it — otherwise the delete
    # rolls back on the FK. DF-29b's threaded view makes this reachable.
    replies_result = await db.execute(select(Comment).where(Comment.parent_id == comment_id))
    replies = replies_result.scalars().all()

    # B-75 — atomic decrement (was a read-modify-write on the ORM instance)
    await db.execute(
        update(Post).where(Post.id == comment.post_id)
        .values(comments_count=func.greatest(Post.comments_count - (1 + len(replies)), 0))
    )
    for r in replies:
        await db.delete(r)
    await db.delete(comment)
