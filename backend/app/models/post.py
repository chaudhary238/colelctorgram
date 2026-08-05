import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    UUID, Boolean, DateTime, Integer, SmallInteger, String, Text,
    ForeignKey, Index, ARRAY,
)
from sqlalchemy.dialects.postgresql import JSONB, ARRAY as PG_ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def _now():
    return datetime.now(timezone.utc)


class Post(Base):
    __tablename__ = "posts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    type: Mapped[str] = mapped_column(String(16), nullable=False)  # showcase | discussion | review | poll | iso
    title: Mapped[str | None] = mapped_column(Text, nullable=True)  # DF-30d optional display title
    body: Mapped[str] = mapped_column(Text, nullable=False)
    images: Mapped[list[str]] = mapped_column(ARRAY(Text), default=list)

    ref_item_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("items.id"), nullable=True)
    ref_listing_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("listings.id"), nullable=True)
    community_id: Mapped[str | None] = mapped_column(Text, ForeignKey("communities.id"), nullable=True)
    category: Mapped[str | None] = mapped_column(Text, nullable=True)
    # hashtag filter (DF-10), e.g. ["#NewDrops"] — pg ARRAY so .contains() works (GIN-indexed)
    tags: Mapped[list[str]] = mapped_column(PG_ARRAY(Text), default=list)

    likes_count: Mapped[int] = mapped_column(Integer, default=0)
    comments_count: Mapped[int] = mapped_column(Integer, default=0)
    saves_count: Mapped[int] = mapped_column(Integer, default=0)

    review_rating: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)
    poll_options: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    # DF-30c — ISO ("In Search Of" / Wanted) post type. Set only when type='iso'.
    iso_item: Mapped[str | None] = mapped_column(Text, nullable=True)
    iso_budget: Mapped[int | None] = mapped_column(Integer, nullable=True)  # max budget, paise
    # Single acceptable condition, or NULL for "Any" (migration c7e1b4a9d302). Was a
    # TEXT[] that every read path collapsed to one string — the composer is a single
    # select, so the list shape was redundant.
    iso_condition: Mapped[str | None] = mapped_column(String(16), nullable=True)

    # DF-30h — multi-community posting. community_id stays the PRIMARY community;
    # post_communities holds every target. to_feed gates the global feed.
    to_feed: Mapped[bool] = mapped_column(Boolean, default=True, server_default="true")

    # NOTE: `is_admin_post` was dropped in c7e1b4a9d302. "Is this the platform talking?"
    # is answered by the author's `is_admin` at serialisation time (`is_official`), which
    # also covers an admin's ordinary post — something the stored flag never did.
    is_pinned: Mapped[bool] = mapped_column(Boolean, default=False)
    # DF-27 — community post approval: published | pending (awaiting mod review)
    # B-70 — "removed" = admin takedown (reason in removed_reason)
    status: Mapped[str] = mapped_column(String(16), default="published")
    removed_reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now)

    comments: Mapped[list["Comment"]] = relationship("Comment", back_populates="post", lazy="select")

    __table_args__ = (
        Index("idx_posts_user", "user_id"),
        Index("idx_posts_community", "community_id"),
        Index("idx_posts_category", "category"),
        Index("idx_posts_created", "created_at"),
        Index("idx_posts_type", "type"),
    )


class PostCommunity(Base):
    """DF-30h — a post's target communities (one row per community it's posted to).

    status mirrors the per-community mod-approval gate (published | pending), so a
    post can be live in one community while awaiting review in another.
    """
    __tablename__ = "post_communities"

    post_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("posts.id", ondelete="CASCADE"), primary_key=True)
    community_id: Mapped[str] = mapped_column(Text, ForeignKey("communities.id", ondelete="CASCADE"), primary_key=True)
    status: Mapped[str] = mapped_column(String(16), default="published", server_default="published")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)

    __table_args__ = (
        Index("idx_post_communities_community", "community_id", "status"),
    )


class PostLike(Base):
    __tablename__ = "post_likes"

    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    post_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("posts.id", ondelete="CASCADE"), primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)


class PostSave(Base):
    __tablename__ = "post_saves"

    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    post_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("posts.id", ondelete="CASCADE"), primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)


class PollVote(Base):
    """One vote per user per poll post (post.type == 'poll').

    Votes are locked: once a user has a row here, they cannot switch options.
    option_index points into the poll_options dict's insertion-ordered keys.
    """
    __tablename__ = "poll_votes"

    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    post_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("posts.id", ondelete="CASCADE"), primary_key=True)
    option_index: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)


class Comment(Base):
    __tablename__ = "comments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    post_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    parent_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("comments.id"), nullable=True)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    likes_count: Mapped[int] = mapped_column(Integer, default=0)
    # B-70 — admin takedown (soft; body preserved for the audit trail)
    is_removed: Mapped[bool] = mapped_column(Boolean, default=False, server_default="false")
    removed_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now, onupdate=_now)

    post: Mapped["Post"] = relationship("Post", back_populates="comments")

    __table_args__ = (
        Index("idx_comments_post", "post_id", "created_at"),
        Index("idx_comments_parent", "parent_id"),
    )


class CommentLike(Base):
    __tablename__ = "comment_likes"

    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    comment_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("comments.id", ondelete="CASCADE"), primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_now)
