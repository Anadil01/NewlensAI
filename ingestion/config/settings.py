import os
from pathlib import Path
from dotenv import load_dotenv


BASE_DIR = Path(__file__).resolve().parent.parent.parent

ENV_PATH = BASE_DIR / "backend" / ".env"

load_dotenv(ENV_PATH)


NEWS_API_KEY = os.getenv("NEWS_API_KEY")


if not NEWS_API_KEY:
    raise Exception(
        "NEWS_API_KEY missing"
    )