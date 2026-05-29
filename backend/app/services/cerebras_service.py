import logging

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

_BASE_URL = "https://api.cerebras.ai/v1"


class CerebrasService:
    def __init__(self) -> None:
        self.enabled = settings.CEREBRAS_ENABLED
        self.api_key = settings.CEREBRAS_API_KEY
        self.model = settings.CEREBRAS_MODEL
        self.timeout = settings.CEREBRAS_TIMEOUT_SECONDS

    def _headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

    async def generate(self, prompt: str, max_tokens: int = 500) -> str | None:
        if not self.enabled or not self.api_key:
            return None
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{_BASE_URL}/chat/completions",
                    headers=self._headers(),
                    json={
                        "model": self.model,
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": 0.7,
                        "max_tokens": max_tokens,
                    },
                )
            if response.status_code == 429:
                logger.warning("Cerebras rate limited — using fallback")
                return None
            if response.status_code != 200:
                logger.warning("Cerebras API error %s — using fallback", response.status_code)
                return None
            data = response.json()
            return data["choices"][0]["message"]["content"].strip()
        except httpx.TimeoutException:
            logger.warning("Cerebras timeout after %ss — using fallback", self.timeout)
            return None
        except httpx.ConnectError:
            logger.warning("Cerebras connection error — using fallback")
            return None
        except Exception as exc:
            logger.warning("Cerebras invalid response — using fallback: %s", exc)
            return None

    async def is_available(self) -> bool:
        if not self.enabled or not self.api_key:
            return False
        try:
            async with httpx.AsyncClient(timeout=5) as client:
                response = await client.get(
                    f"{_BASE_URL}/models",
                    headers=self._headers(),
                )
            return response.status_code == 200
        except Exception:
            return False
