from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    SECRET_KEY: str = "change-this-to-a-long-random-secret-key"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    DATABASE_URL: str = "sqlite:///./truck_app.db"
    NOTIFIER_WEBHOOK_URL: str | None = None
    WORKDAY_START_HOUR: int = 8
    WORKDAY_END_HOUR: int = 18
    IDLE_ALERT_MINUTES: int = 30
    ALERT_DEDUPE_SECONDS: int = 60
    OPENWEATHER_API_KEY: str | None = None
    # SMTP / email settings (optional)
    SMTP_HOST: str | None = None
    SMTP_PORT: int | None = None
    SMTP_USER: str | None = None
    SMTP_PASSWORD: str | None = None
    MAIL_FROM: str | None = None

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
