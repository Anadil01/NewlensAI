import os
from pathlib import Path
from dotenv import load_dotenv


BASE_DIR = Path(__file__).resolve().parent.parent.parent

ENV_PATH = BASE_DIR / "backend" / ".env"

load_dotenv(ENV_PATH)


NEWS_API_KEY = os.getenv("NEWS_API_KEY")

# NOTE: Do not raise here. Importing settings must never crash the
# whole service just because one optional source lacks a key.
# NewsAPIClient validates NEWS_API_KEY lazily when it is actually used,
# so an HN-only or summarization-only run works without a NewsAPI key.