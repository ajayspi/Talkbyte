"""
Menu RAG search using OpenAI text-embedding-3-small and Supabase pgvector.
"""

from openai import AsyncOpenAI
from app.db.supabase import search_menu_by_embedding
from app.models.restaurant import MenuItem
from config import config

_client: AsyncOpenAI | None = None

def get_openai_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI(api_key=config.openai_api_key)
    return _client

async def get_embedding(text: str) -> list[float]:
    """Generate embedding for a given text."""
    client = get_openai_client()
    response = await client.embeddings.create(
        input=text,
        model="text-embedding-3-small",
        dimensions=1536
    )
    return response.data[0].embedding

async def search_menu_items(restaurant_id: str, query: str, top_k: int = 5) -> list[MenuItem]:
    """
    Search menu items using semantic similarity.
    """
    embedding = await get_embedding(query)
    items = await search_menu_by_embedding(restaurant_id, embedding, top_k)
    return items
