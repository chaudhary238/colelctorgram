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
    oauth_redirect_uri: str = "http://localhost:8000/auth/google/callback"

    # R2
    r2_account_id: str = ""
    r2_access_key_id: str = ""
    r2_secret_access_key: str = ""
    r2_bucket: str = "collectohub-media"
    r2_public_url: str = "https://cdn.collectohub.com"

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
        if not (self.r2_account_id and self.r2_access_key_id and self.r2_secret_access_key):
            problems.append("R2 credentials (account id, access key, secret) are required")
        if problems:
            raise ValueError(
                "Refusing to start in production with invalid config:\n  - "
                + "\n  - ".join(problems)
            )
        return self


settings = Settings()
