from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy.engine import URL


PROJECT_ROOT = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(PROJECT_ROOT / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    APP_NAME: str = "NC Performance Dashboard"
    APP_ENV: str = "development"
    DEBUG: bool = False
    FRONTEND_URL: str = "http://localhost:3000"
    CORS_ORIGINS: str | None = None

    DATABASE_URL: str
    DB_HOST: str | None = None
    DB_PORT: int | None = None
    DB_NAME: str | None = None
    DB_USER: str | None = None
    DB_PASSWORD: str | None = None

    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    BCRYPT_ROUNDS: int = 12

    TEMP_PASSWORD_LENGTH: int = 10
    TEMP_PASSWORD_EXPIRES_HOURS: int = 24

    SMTP_HOST: str
    SMTP_PORT: int = 587
    SMTP_USE_TLS: bool = True
    SMTP_USERNAME: str | None = None
    SMTP_PASSWORD: str | None = None
    EMAIL_FROM_NAME: str = "NC Performance Dashboard"
    EMAIL_FROM_ADDRESS: str = Field(default="no-reply@example.com")

    ADMIN_DAO_CODE: str | None = None
    ADMIN_EMAIL: str | None = None
    ADMIN_DEFAULT_PASSWORD: str | None = None

    @property
    def allowed_origins(self) -> list[str]:
        origins: list[str] = []
        if self.CORS_ORIGINS:
            origins.extend(
                origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()
            )
        if self.FRONTEND_URL and self.FRONTEND_URL not in origins:
            origins.append(self.FRONTEND_URL)
        return origins or ["*"]

    @property
    def sqlalchemy_database_url(self) -> URL | str:
        if all([self.DB_HOST, self.DB_PORT, self.DB_NAME, self.DB_USER, self.DB_PASSWORD]):
            return URL.create(
                drivername="postgresql+psycopg2",
                username=self.DB_USER,
                password=self.DB_PASSWORD,
                host=self.DB_HOST,
                port=self.DB_PORT,
                database=self.DB_NAME,
            )
        return self.DATABASE_URL

    @property
    def alembic_database_url(self) -> str:
        database_url = self.sqlalchemy_database_url
        if isinstance(database_url, URL):
            return database_url.render_as_string(hide_password=False)
        return database_url


settings = Settings()
