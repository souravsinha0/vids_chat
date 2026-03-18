from sentence_transformers import SentenceTransformer
from sqlalchemy.orm import Session
from .. import models
import textwrap

model = SentenceTransformer('all-MiniLM-L6-v2')

def chunk_text(text: str, chunk_size=500, overlap=100):
    words = text.split()
    chunks = []
    for i in range(0, len(words), chunk_size - overlap):
        chunk = " ".join(words[i:i + chunk_size])
        chunks.append(chunk)
    return chunks

def generate_embeddings(chunks):
    return model.encode(chunks).tolist()

def chunk_and_embed(db: Session, video_id: int, transcript: str):
    chunks = chunk_text(transcript)
    embeddings = generate_embeddings(chunks)
    
    for idx, (chunk, emb) in enumerate(zip(chunks, embeddings)):
        db_chunk = models.TranscriptChunk(
            video_id=video_id,
            chunk_index=idx,
            content=chunk,
            embedding=emb
        )
        db.add(db_chunk)
    db.commit()