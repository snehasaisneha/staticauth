"""Simple SQL migration runner for StaticAuth."""

import argparse
import asyncio
import re
from pathlib import Path

import aiosqlite

from staticauth.config import get_settings


MIGRATIONS_DIR = Path(__file__).parent / "migrations"


def get_db_path() -> str | None:
    """Extract database path from settings URL."""
    settings = get_settings()
    db_url = settings.database_url

    if db_url.startswith("sqlite+aiosqlite:///"):
        db_path = db_url.replace("sqlite+aiosqlite:///", "")
    elif db_url.startswith("sqlite:///"):
        db_path = db_url.replace("sqlite:///", "")
    else:
        print(f"Unsupported database URL: {db_url}")
        print("Migrations only support SQLite. For PostgreSQL, use psql.")
        return None

    if db_path.startswith("./"):
        db_path = db_path[2:]

    return db_path


async def get_applied_migrations(db: aiosqlite.Connection) -> set[str]:
    """Get list of already applied migrations."""
    try:
        cursor = await db.execute("SELECT name FROM _migrations")
        rows = await cursor.fetchall()
        return {row[0] for row in rows}
    except aiosqlite.OperationalError:
        # Table doesn't exist yet
        return set()


async def apply_migration(db: aiosqlite.Connection, name: str, sql: str) -> None:
    """Apply a single migration."""
    print(f"Applying migration: {name}")
    await db.executescript(sql)
    await db.execute("INSERT INTO _migrations (name) VALUES (?)", (name,))
    await db.commit()
    print(f"  Applied: {name}")


async def run_migrations(target_number: int | None = None) -> None:
    """Run migrations.

    Args:
        target_number: If provided, run only this specific migration number.
                      If None, run all pending migrations.
    """
    db_path = get_db_path()
    if not db_path:
        return

    print(f"Running migrations on: {db_path}")

    async with aiosqlite.connect(db_path) as db:
        applied = await get_applied_migrations(db)

        # Get all migration files sorted by name
        migration_files = sorted(MIGRATIONS_DIR.glob("*.sql"))

        if not migration_files:
            print("No migration files found.")
            return

        # If targeting a specific migration number
        if target_number is not None:
            prefix = f"{target_number:03d}_"
            matches = [f for f in migration_files if f.name.startswith(prefix)]
            if not matches:
                print(f"No migration found with number {target_number}")
                return
            migration_file = matches[0]
            if migration_file.name in applied:
                print(f"Migration {migration_file.name} already applied.")
                return
            sql = migration_file.read_text()
            await apply_migration(db, migration_file.name, sql)
            print("\nApplied 1 migration.")
            return

        # Run all pending migrations
        pending = [f for f in migration_files if f.name not in applied]

        if not pending:
            print("All migrations already applied.")
            return

        for migration_file in pending:
            sql = migration_file.read_text()
            await apply_migration(db, migration_file.name, sql)

        print(f"\nApplied {len(pending)} migration(s).")


async def show_status() -> None:
    """Show migration status."""
    db_path = get_db_path()
    if not db_path:
        return

    migration_files = sorted(MIGRATIONS_DIR.glob("*.sql"))

    if not Path(db_path).exists():
        print(f"Database does not exist: {db_path}")
        print("\nPending migrations:")
        for f in migration_files:
            print(f"  - {f.name}")
        return

    async with aiosqlite.connect(db_path) as db:
        applied = await get_applied_migrations(db)

        print("Migration status:")
        for f in migration_files:
            status = "✓" if f.name in applied else "○"
            print(f"  {status} {f.name}")


def run_all() -> None:
    """Entry point for `uv run all-migrations`."""
    asyncio.run(run_migrations())


def run_single() -> None:
    """Entry point for `uv run migrations --n <number>`."""
    parser = argparse.ArgumentParser(description="Run a specific migration")
    parser.add_argument(
        "--n",
        type=int,
        required=True,
        help="Migration number to run (e.g., 1 for 001_init.sql)",
    )
    args = parser.parse_args()
    asyncio.run(run_migrations(target_number=args.n))


def main() -> None:
    """Main entry point for `python -m staticauth.db.migrate`."""
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == "status":
        asyncio.run(show_status())
    else:
        asyncio.run(run_migrations())


if __name__ == "__main__":
    main()
