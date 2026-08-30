import os
from dotenv import load_dotenv

load_dotenv(
    os.path.join(
        os.path.dirname(__file__),
        "../../backend/.env"
    )
)


def get_connection():
    # Database access is only needed by persistence operations. Keeping the
    # driver import here lets pure clustering code run in lightweight workers
    # and tests without a PostgreSQL client installed.
    import psycopg2

    database_url = os.getenv("DATABASE_URL")

    if not database_url:
        raise ValueError(
            "DATABASE_URL is not configured"
        )

    return psycopg2.connect(database_url)
