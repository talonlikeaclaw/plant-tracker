from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from config import Config

engine = create_engine(Config.SQLALCHEMY_DATABASE_URI, echo=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
