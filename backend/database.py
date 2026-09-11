import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base

# Vercel serverless uses /tmp; local dev uses ./agriconnect.db
DATABASE_URL = os.environ.get('DATABASE_URL', 'sqlite:///./agriconnect.db')

engine = create_engine(
    DATABASE_URL, connect_args={'check_same_thread': False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
