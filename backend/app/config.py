class BaseSettings:
    def __init__(self, **kwargs):
        for key, value in kwargs.items():
            setattr(self, key, value)


class Settings(BaseSettings):
    app_name: str = "My FastAPI App"
    debug: bool = False
    database_url: str
    env_file = ".env"
    gemini_api_key: str
    tavility_api_key: str
    smtp_server: str
    smtp_port: int
    smtp_username: str
    smtp_password: str
    smtp_from_email: str

settings = Settings()