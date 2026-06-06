# Phase 1: full-text search is handled in routers/search.py via PostgreSQL ILIKE + pg_trgm.
# Phase 2: upgrade path is pgvector (vector similarity) for semantic catalogue/item search.
#   - Enable extension:  CREATE EXTENSION IF NOT EXISTS vector;
#   - Add embedding column to catalogue: embedding vector(1536)
#   - Use pgvector ANN index (ivfflat or hnsw) on that column
#   - Generate embeddings via lightweight model (e.g. sentence-transformers) at ingest time
