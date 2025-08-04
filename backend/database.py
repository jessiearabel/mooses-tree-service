from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from typing import Optional
import os
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class Database:
    client: Optional[AsyncIOMotorClient] = None
    database: Optional[AsyncIOMotorDatabase] = None

database = Database()

async def get_database() -> AsyncIOMotorDatabase:
    return database.database

async def connect_to_mongo():
    """Create database connection"""
    logger.info("Connecting to MongoDB...")
    database.client = AsyncIOMotorClient(os.environ['MONGO_URL'])
    database.database = database.client[os.environ['DB_NAME']]
    
    # Test the connection
    try:
        await database.client.admin.command('ping')
        logger.info("Successfully connected to MongoDB!")
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        raise

async def close_mongo_connection():
    """Close database connection"""
    logger.info("Closing connection to MongoDB...")
    if database.client:
        database.client.close()

# Collection names
USERS_COLLECTION = "users"
QUESTIONS_COLLECTION = "questions"
EXAM_RESULTS_COLLECTION = "exam_results" 
EXAM_SESSIONS_COLLECTION = "exam_sessions"

# Utility functions for database operations
def serialize_doc(doc):
    """Convert MongoDB document to dict with string ID"""
    if doc:
        doc["id"] = str(doc["_id"])
        del doc["_id"]
    return doc

def serialize_docs(docs):
    """Convert list of MongoDB documents to list of dicts with string IDs"""
    return [serialize_doc(doc) for doc in docs]

async def create_indexes():
    """Create database indexes for better performance"""
    db = await get_database()
    
    # Users collection indexes
    await db[USERS_COLLECTION].create_index("username", unique=True)
    await db[USERS_COLLECTION].create_index("email", unique=True)
    
    # Questions collection indexes  
    await db[QUESTIONS_COLLECTION].create_index("topicId")
    await db[QUESTIONS_COLLECTION].create_index("type")
    await db[QUESTIONS_COLLECTION].create_index("difficulty")
    
    # Exam results collection indexes
    await db[EXAM_RESULTS_COLLECTION].create_index("userId")
    await db[EXAM_RESULTS_COLLECTION].create_index("examType")
    await db[EXAM_RESULTS_COLLECTION].create_index("completedAt")
    
    # Exam sessions collection indexes
    await db[EXAM_SESSIONS_COLLECTION].create_index("userId")
    await db[EXAM_SESSIONS_COLLECTION].create_index("startTime")
    
    logger.info("Database indexes created successfully")