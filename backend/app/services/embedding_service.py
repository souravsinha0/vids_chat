from typing import Iterable

import httpx
from sqlalchemy.orm import Session

from .. import models
from ..config import settings


def chunk_text(text: str, chunk_size=500, overlap=100):
    words = text.split()
    chunks = []
    for i in range(0, len(words), chunk_size - overlap):
        chunk = " ".join(words[i:i + chunk_size])
        chunks.append(chunk)
    return chunks


def _embeddings_endpoint() -> str:
    base_url = settings.nim_embedder_url.rstrip("/")
    if base_url.endswith("/embeddings"):
        return base_url
    if base_url.endswith("/v1"):
        return f"{base_url}/embeddings"
    return f"{base_url}/v1/embeddings"


def _request_embeddings(inputs: Iterable[str], input_type: str) -> list[list[float]]:
    endpoint = _embeddings_endpoint()
    payload = {
        "input": list(inputs),
        "model": settings.nim_embedding_model,
        "input_type": input_type,
    }

    if not payload["input"]:
        return []

    response = httpx.post(
        endpoint,
        json=payload,
        headers={
            "Accept": "application/json",
            "Content-Type": "application/json",
        },
        timeout=120,
    )
    try:
        response.raise_for_status()
    except httpx.HTTPStatusError as exc:
        raise RuntimeError(
            f"NIM embedding request failed: {exc.response.status_code} for {endpoint}. "
            f"Model={settings.nim_embedding_model}, input_type={input_type}, "
            f"response={exc.response.text}"
        ) from exc

    data = response.json().get("data", [])
    ordered_data = sorted(data, key=lambda item: item.get("index", 0))
    embeddings = [item["embedding"] for item in ordered_data]

    for embedding in embeddings:
        if len(embedding) != settings.embedding_dimension:
            raise ValueError(
                f"Unexpected embedding dimension {len(embedding)}; "
                f"expected {settings.embedding_dimension}"
            )

    return embeddings


def generate_embeddings(chunks):
    return _request_embeddings(chunks, input_type="passage")


def generate_query_embedding(text: str) -> list[float]:
    embeddings = _request_embeddings([text], input_type="query")
    if not embeddings:
        raise ValueError("NIM embedder returned no query embedding")
    return embeddings[0]


def chunk_and_embed(db: Session, video_id: int, transcript: str):
    chunks = chunk_text(transcript)
    embeddings = generate_embeddings(chunks)

    db.query(models.TranscriptChunk).filter(
        models.TranscriptChunk.video_id == video_id
    ).delete(synchronize_session=False)

    for idx, (chunk, emb) in enumerate(zip(chunks, embeddings)):
        db_chunk = models.TranscriptChunk(
            video_id=video_id,
            chunk_index=idx,
            content=chunk,
            embedding=emb
        )
        db.add(db_chunk)
    db.commit()
