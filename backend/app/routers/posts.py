import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.dependencies import get_current_user
from app.models.post import Post, PostLike, PostSave, Comment, CommentLike, PostCommunity
from app.models.user import User
from app.models.item import Item
from app.models.listing import Listing
from app.models.community import Community, CommunityMember
from app.services.notifications import notify

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


@router.post("", status_code=status.HTTP_201_CREATED)
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

    return {"id": str(post.id), "status": post_status}


@router.get("/{post_id}")
async def get_post(
    post_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Post).where(Post.id == post_id))
    post = result.scalar_one_or_none()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    comments_result = await db.execute(
        select(Comment).where(Comment.post_id == post_id).order_by(Comment.created_at)
    )
    comments = comments_result.scalars().all()

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
        "tier": author.tier if author else "verified",
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

    existing = await db.execute(
        select(PostLike).where(PostLike.user_id == current_user.id, PostLike.post_id == post_id)
    )
    like = existing.scalar_one_or_none()
    if like:
        await db.delete(like)
        post.likes_count = max(0, post.likes_count - 1)
    else:
        db.add(PostLike(user_id=current_user.id, post_id=post_id))
        post.likes_count += 1
        if post.user_id != current_user.id:
            notify(
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

    existing = await db.execute(
        select(PostSave).where(PostSave.user_id == current_user.id, PostSave.post_id == post_id)
    )
    save = existing.scalar_one_or_none()
    if save:
        await db.delete(save)
        post.saves_count = max(0, post.saves_count - 1)
    else:
        db.add(PostSave(user_id=current_user.id, post_id=post_id))
        post.saves_count += 1


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
    post.comments_count += 1
    if post.user_id != current_user.id:
        snippet = body.body if len(body.body) <= 80 else body.body[:80] + "…"
        notify(
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
    existing = await db.execute(
        select(CommentLike).where(
            CommentLike.user_id == current_user.id,
            CommentLike.comment_id == comment_id,
        )
    )
    like = existing.scalar_one_or_none()
    if like:
        await db.delete(like)
        comment.likes_count = max(0, comment.likes_count - 1)
    else:
        db.add(CommentLike(user_id=current_user.id, comment_id=comment_id))
        comment.likes_count += 1


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

    post_result = await db.execute(select(Post).where(Post.id == comment.post_id))
    post = post_result.scalar_one_or_none()
    if post:
        post.comments_count = max(0, post.comments_count - (1 + len(replies)))
    for r in replies:
        await db.delete(r)
    await db.delete(comment)
