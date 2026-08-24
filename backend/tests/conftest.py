import pytest

from app.database import Base, engine


@pytest.fixture(scope="session", autouse=True)
def setup_database():
    # Ensure SQLAlchemy models are created for tests
    Base.metadata.create_all(bind=engine)
    yield