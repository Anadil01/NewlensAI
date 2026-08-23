from persistence.database import get_connection


def main():
    connection = get_connection()

    try:
        cursor = connection.cursor()
        cursor.execute("SELECT NOW();")

        result = cursor.fetchone()

        print("PostgreSQL connected successfully")
        print("Database time:", result[0])

    finally:
        connection.close()


if __name__ == "__main__":
    main()