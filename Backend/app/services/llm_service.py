import cohere

from app.config import settings


class LLMService:
    MAX_RESPONSE_TOKENS = 700

    def __init__(self):
        if not settings.COHERE_API_KEY:
            raise RuntimeError("COHERE_API_KEY is not set")

        self.client = cohere.Client(settings.COHERE_API_KEY)

    def generate_response(self, prompt: str) -> str:
        try:
            response = self.client.chat(
                model=settings.COHERE_MODEL,
                message=prompt,
                temperature=0.2,
                max_tokens=self.MAX_RESPONSE_TOKENS,
            )

            return response.text

        except Exception as e:
            raise RuntimeError(f"Cohere API Error: {e}")


llm_service = LLMService()
