import os
import psycopg2
from dotenv import load_dotenv

load_dotenv(
    os.path.join(
        os.path.dirname(__file__),
        "../../backend/.env"
    )
)


def get_connection():
    database_url = os.getenv("DATABASE_URL")

    if not database_url:
        raise ValueError(
            "DATABASE_URL is not configured"
        )

    return psycopg2.connect(database_url)