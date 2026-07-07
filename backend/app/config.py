from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # App
    app_env: str = "development"
    app_debug: bool = True
    frontend_url: str = "http://localhost:3000"

    # Database
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/collectohub"
    sync_database_url: str = "postgresql://postgres:postgres@localhost:5432/collectohub"

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # JWT
    secret_key: str = "change-me-in-production"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 30

    # OAuth
    google_client_id: str = ""
    google_client_secret: str = ""
    apple_client_id: str = ""  # Apple "Services ID" (DF-37a); social buttons stay hidden until set
    oauth_redirect_uri: str = "http://localhost:8000/auth/google/callback"

    # Object storage (S3-compatible: Cloudflare R2, Backblaze B2, Supabase, AWS S3…)
    r2_account_id: str = ""
    r2_access_key_id: str = ""
    r2_secret_access_key: str = ""
    r2_bucket: str = "collectohub-media"
    r2_public_url: str = "https://cdn.collectohub.com"
    # When set, overrides the R2-derived endpoint (e.g. Backblaze B2:
    # https://s3.us-west-004.backblazeb2.com). Leave blank to use R2.
    s3_endpoint_url: str = ""
    # R2 uses "auto"; B2/S3 need a real region (e.g. "us-west-004", "us-east-1").
    s3_region: str = "auto"

    # Local media fallback (used when object storage is not configured, e.g. local dev).
    # Absolute base URL the browser can reach this backend at, for upload + serving.
    media_local_base_url: str = "http://localhost:8000"

    @property
    def r2_configured(self) -> bool:
        # Configured = creds + a target (an explicit S3 endpoint, or an R2 account id
        # we can derive the R2 endpoint from).
        has_creds = bool(self.r2_access_key_id and self.r2_secret_access_key)
        has_target = bool(self.s3_endpoint_url or self.r2_account_id)
        return has_creds and has_target

    # Email (Resend — B-71). Unset key = emails are logged, not sent (local dev).
    resend_api_key: str = ""
    # Until a domain is verified in Resend, only `onboarding@resend.dev` works as
    # sender and it only delivers to the Resend account owner's email.
    email_from: str = "Scorred <onboarding@resend.dev>"

    # Expo Push
    expo_push_url: str = "https://exp.host/--/api/v2/push/send"

    # Observability
    sentry_dsn: str = ""

    @property
    def cors_origins(self) -> list[str]:
        if self.app_env == "production":
            return [self.frontend_url]
        return [self.frontend_url, "http://localhost:3000", "http://127.0.0.1:3000"]

    @model_validator(mode="after")
    def _guard_production(self):
        """Fail fast rather than boot a production process with insecure defaults."""
        if self.app_env != "production":
            return self
        problems: list[str] = []
        if self.secret_key in (
            "",
            "change-me-in-production",
            "change-me-in-production-use-openssl-rand-hex-32",
        ):
            problems.append("SECRET_KEY must be a strong random value (openssl rand -hex 32)")
        if "postgres:postgres@localhost" in self.database_url:
            problems.append("DATABASE_URL still points at the local dev default")
        if not self.r2_configured:
            problems.append(
                "Object storage creds required: R2_ACCESS_KEY_ID + R2_SECRET_ACCESS_KEY "
                "plus either S3_ENDPOINT_URL (B2/S3) or R2_ACCOUNT_ID (R2)"
            )
        if problems:
            raise ValueError(
                "Refusing to start in production with invalid config:\n  - "
                + "\n  - ".join(problems)
            )
        return self


settings = Settings()
