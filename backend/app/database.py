from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from .config import settings

SQLALCHEMY_DATABASE_URL = f"postgresql://{settings.postgres_user}:{settings.postgres_password}@{settings.postgres_host}:{settings.postgres_port}/{settings.postgres_db}"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


# def initialize_database():
#     with engine.begin() as conn:
#         conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))

#     Base.metadata.create_all(bind=engine)

#     with engine.begin() as conn:
#         current_embedding_type = conn.execute(
#             text(
#                 """
#                 SELECT format_type(a.atttypid, a.atttypmod)
#                 FROM pg_attribute a
#                 JOIN pg_class c ON c.oid = a.attrelid
#                 JOIN pg_namespace n ON n.oid = c.relnamespace
#                 WHERE c.relname = 'transcript_chunks'
#                   AND a.attname = 'embedding'
#                   AND a.attnum > 0
#                   AND NOT a.attisdropped
#                 """
#             )
#         ).scalar_one_or_none()

#         target_embedding_type = f"vector({settings.embedding_dimension})"
#         if current_embedding_type and current_embedding_type != target_embedding_type:
#             conn.execute(text("DROP INDEX IF EXISTS idx_transcript_chunks_embedding_ivfflat"))
#             conn.execute(
#                 text(
#                     f"""
#                     ALTER TABLE transcript_chunks
#                     ALTER COLUMN embedding TYPE vector({settings.embedding_dimension})
#                     USING NULL::vector({settings.embedding_dimension})
#                     """
#                 )
#             )
#             conn.execute(
#                 text(
#                     """
#                     CREATE INDEX IF NOT EXISTS idx_transcript_chunks_embedding_ivfflat
#                     ON transcript_chunks USING ivfflat (embedding vector_cosine_ops)
#                     WITH (lists = 100)
#                     """
#                 )
#             )
#         else:
#             conn.execute(
#                 text(
#                     """
#                     CREATE INDEX IF NOT EXISTS idx_transcript_chunks_embedding_ivfflat
#                     ON transcript_chunks USING ivfflat (embedding vector_cosine_ops)
#                     WITH (lists = 100)
#                     """
#                 )
#             )

# def initialize_database():
#     with engine.begin() as conn:
#         conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))

#     Base.metadata.create_all(bind=engine)

#     with engine.begin() as conn:
#         current_embedding_type = conn.execute(
#             text(
#                 """
#                 SELECT format_type(a.atttypid, a.atttypmod)
#                 FROM pg_attribute a
#                 JOIN pg_class c ON c.oid = a.attrelid
#                 JOIN pg_namespace n ON n.oid = c.relnamespace
#                 WHERE c.relname = 'transcript_chunks'
#                   AND a.attname = 'embedding'
#                   AND a.attnum > 0
#                   AND NOT a.attisdropped
#                 """
#             )
#         ).scalar_one_or_none()

#         target_embedding_type = f"vector({settings.embedding_dimension})"

#         if current_embedding_type and current_embedding_type != target_embedding_type:
#             conn.execute(text("DROP INDEX IF EXISTS idx_transcript_chunks_embedding_ivfflat"))
#             conn.execute(
#                 text(
#                     f"""
#                     ALTER TABLE transcript_chunks
#                     ALTER COLUMN embedding TYPE vector({settings.embedding_dimension})
#                     USING NULL::vector({settings.embedding_dimension})
#                     """
#                 )
#             )

#         conn.execute(
#             text(
#                 """
#                 CREATE INDEX IF NOT EXISTS idx_transcript_chunks_embedding_ivfflat
#                 ON transcript_chunks
#                 USING ivfflat (embedding vector_cosine_ops)
#                 WITH (lists = 100)
#                 """
#             )
#         )

def initialize_database():
    with engine.begin() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))

    Base.metadata.create_all(bind=engine)

    with engine.begin() as conn:
        current_embedding_type = conn.execute(
            text("""
            SELECT format_type(a.atttypid, a.atttypmod)
            FROM pg_attribute a
            JOIN pg_class c ON c.oid = a.attrelid
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE c.relname = 'transcript_chunks'
              AND a.attname = 'embedding'
              AND a.attnum > 0
              AND NOT a.attisdropped
            """)
        ).scalar_one_or_none()

        target_embedding_type = f"vector({settings.embedding_dimension})"

        if current_embedding_type and current_embedding_type != target_embedding_type:
            conn.execute(
                text(f"""
                ALTER TABLE transcript_chunks
                ALTER COLUMN embedding TYPE vector({settings.embedding_dimension})
                USING NULL::vector({settings.embedding_dimension})
                """)
            )

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
