import os
from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, inspect


def test_migration_upgrade_on_clean_test_database():
    """
    Verifies that Alembic migration scripts run successfully from scratch
    on a test database and create all required tables.
    """
    test_db_url = "postgresql+psycopg2://auditgenai:auditgenai_dev_password@localhost:5432/auditgenai_test_db"
    os.environ["ALEMBIC_DATABASE_URL"] = test_db_url

    try:
        # Base path to backend
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        ini_path = os.path.join(base_dir, "alembic.ini")

        alembic_cfg = Config(ini_path)
        alembic_cfg.set_main_option("sqlalchemy.url", test_db_url)
        alembic_cfg.set_main_option("script_location", os.path.join(base_dir, "alembic"))

        # Execute upgrade head
        command.upgrade(alembic_cfg, "head")

        engine = create_engine(test_db_url)
        inspector = inspect(engine)
        tables = inspector.get_table_names()

        required_tables = {
            "users",
            "roles",
            "user_roles",
            "societies",
            "society_memberships",
            "buildings",
            "flats",
            "residents",
            "flat_residents",
            "alembic_version",
        }
        assert required_tables.issubset(set(tables)), f"Missing tables in test database: {required_tables - set(tables)}"
    finally:
        os.environ.pop("ALEMBIC_DATABASE_URL", None)
