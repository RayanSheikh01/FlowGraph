from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "FlowGraph"
    debug: bool = False

    google_api_key: str | None = None
    tavily_api_key: str | None = None

    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 465
    smtp_user: str | None = None
    smtp_pass: str | None = None
    smtp_from: str | None = None


settings = Settings()
