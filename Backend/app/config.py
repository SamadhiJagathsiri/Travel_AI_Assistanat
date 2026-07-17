from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Travel AI Assistant"
    VERSION: str = "1.0.0"

    COHERE_API_KEY: str = ""
    COHERE_MODEL: str = "command-r-plus-08-2024"

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    )


settings = Settings()