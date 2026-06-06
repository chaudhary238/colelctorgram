import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.dependencies import get_current_user
from app.models.post import Post, PostLike, PostSave, Comment
from app.models.user import User

router = APIRouter(prefix="/posts", tags=["posts"])
comments_router = APIRouter(prefix="/comments", tags=["posts"])


class CreatePostBody(BaseModel):
    type: str  # showcase | discussion | review
    body: str
    images: list[str] = []
    category: Optional[str] = None
    community_id: Optional[str] = None
    ref_item_id: Optional[uuid.UUID] = None
    ref_listing_id: Optional[uuid.UUID] = None
    review_rating: Optional[int] = None


class CreateCommentBody(BaseModel):
    body: str
    parent_id: Optional[uuid.UUID] = None


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_post(
    body: CreatePostBody,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    post = Post(
        user_id=current_user.id,
        type=body.type,
        body=body.body,
        images=body.images,
        category=body.category,
        community_id=body.community_id,
        ref_item_id=body.ref_item_id,
        ref_listing_id=body.ref_listing_id,
        review_rating=body.review_rating,
    )
    db.add(post)
    await db.flush()
    return {"id": str(post.id)}


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

    return {
        "id": str(post.id),
        "user_id": str(post.user_id),
        "type": post.type,
        "body": post.body,
        "images": post.images,
        "category": post.category,
        "community_id": post.community_id,
        "likes_count": post.likes_count,
        "comments_count": post.comments_count,
        "saves_count": post.saves_count,
        "review_rating": post.review_rating,
        "created_at": post.created_at.isoformat(),
        "comments": [
            {
                "id": str(c.id),
                "user_id": str(c.user_id),
                "parent_id": str(c.parent_id) if c.parent_id else None,
                "body": c.body,
                "likes_count": c.likes_count,
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
    await db.flush()
    return {"id": str(comment.id)}


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
    post_result = await db.execute(select(Post).where(Post.id == comment.post_id))
    post = post_result.scalar_one_or_none()
    if post:
        post.comments_count = max(0, post.comments_count - 1)
    await db.delete(comment)
