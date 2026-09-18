"""
Menu RAG search using OpenAI text-embedding-3-small and Supabase pgvector.
"""

from openai import AsyncOpenAI
from app.db.supabase import search_menu_by_embedding, get_platform_secret
from app.models.restaurant import MenuItem

_client: AsyncOpenAI | None = None

async def get_openai_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        key = await get_platform_secret("OPENAI_API_KEY")
        _client = AsyncOpenAI(api_key=key)
    return _client

async def get_embedding(text: str) -> list[float]:
    """Generate embedding for a given text."""
    client = await get_openai_client()
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
