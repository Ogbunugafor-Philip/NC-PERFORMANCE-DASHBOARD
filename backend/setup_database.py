import subprocess

from dotenv import dotenv_values


def quote_identifier(value: str) -> str:
    return '"' + value.replace('"', '""') + '"'


def quote_literal(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def main() -> None:
    env = dotenv_values("../.env")
    db_user = env["DB_USER"]
    db_password = env["DB_PASSWORD"]
    db_name = env["DB_NAME"]

    sql = f"""
SELECT format('CREATE ROLE %I LOGIN PASSWORD %L', {quote_literal(db_user)}, {quote_literal(db_password)})
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = {quote_literal(db_user)}) \\gexec
ALTER ROLE {quote_identifier(db_user)} WITH LOGIN PASSWORD {quote_literal(db_password)};
SELECT format('CREATE DATABASE %I OWNER %I', {quote_literal(db_name)}, {quote_literal(db_user)})
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = {quote_literal(db_name)}) \\gexec
ALTER DATABASE {quote_identifier(db_name)} OWNER TO {quote_identifier(db_user)};
"""
    subprocess.run(
        ["sudo", "-u", "postgres", "psql", "-v", "ON_ERROR_STOP=1"],
        input=sql,
        text=True,
        check=True,
    )


if __name__ == "__main__":
    main()
