from functools import lru_cache

from sentence_transformers import SentenceTransformer


MODEL_NAME = "all-MiniLM-L6-v2"


@lru_cache(maxsize=1)
def get_embedding_model():
    """
    Load the embedding model once per process.

    The cached model is reused for every clustering job.
    """
    return SentenceTransformer(MODEL_NAME)


def generate_embeddings(texts):
    """
    Generate semantic embeddings for a list of texts.
    """

    if not texts:
        return []

    model = get_embedding_model()

    return model.encode(
        texts,
        normalize_embeddings=True,
        show_progress_bar=False
    )