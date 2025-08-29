from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from bson import ObjectId
import logging
import os
from pathlib import Path
from dotenv import load_dotenv

from models import (
    AdminLogin, AdminResponse, UserCreate, UserResponse, QuestionCreate, 
    QuestionResponse, QuestionsResponse, MessageResponse, UserRole
)
from auth import get_password_hash
from database import (
    get_database, USERS_COLLECTION, QUESTIONS_COLLECTION, 
    serialize_doc, serialize_docs
)
from datetime import datetime

# Load environment variables
ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / '.env')

logger = logging.getLogger(__name__)
router = APIRouter()

# Admin password from environment variable
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")

async def verify_admin_password(password: str) -> bool:
    """Verify admin password"""
    return password == ADMIN_PASSWORD

# Admin Authentication Endpoints
@router.post("/login", response_model=AdminResponse)
async def admin_login(admin_data: AdminLogin):
    """Admin login with password"""
    if not await verify_admin_password(admin_data.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin password"
        )
    
    logger.info("Admin login successful")
    return AdminResponse()

# User Management Endpoints
@router.get("/users", response_model=List[UserResponse])
async def get_all_users(admin_password: str):
    """Get all users (admin only)"""
    if not await verify_admin_password(admin_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin password"
        )
    
    db = await get_database()
    users_cursor = db[USERS_COLLECTION].find({})
    users = await users_cursor.to_list(length=1000)
    
    # Remove passwords from response
    for user in users:
        user.pop("password", None)
    
    users_response = [UserResponse(**serialize_doc(user)) for user in users]
    
    logger.info(f"Retrieved {len(users_response)} users for admin")
    return users_response

@router.post("/users", response_model=MessageResponse)
async def create_user(user_data: UserCreate, admin_password: str):
    """Create new user (admin only)"""
    if not await verify_admin_password(admin_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin password"
        )
    
    db = await get_database()
    
    # Check if username already exists
    existing_user = await db[USERS_COLLECTION].find_one({"username": user_data.username})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already exists"
        )
    
    # Check if email already exists
    existing_email = await db[USERS_COLLECTION].find_one({"email": user_data.email})
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already exists"
        )
    
    # Create user
    hashed_password = get_password_hash(user_data.password)
    user_dict = {
        "username": user_data.username,
        "email": user_data.email,
        "password": hashed_password,
        "name": user_data.name,
        "language": user_data.language,
        "role": UserRole.student,  # Default role
        "progress": {
            "completedQuestions": 0,
            "totalQuestions": 100,
            "averageScore": 0.0,
            "topicScores": {}
        },
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    }
    
    result = await db[USERS_COLLECTION].insert_one(user_dict)
    logger.info(f"Admin created new user: {user_data.username}")
    
    return MessageResponse(message="User created successfully")

@router.delete("/users/{user_id}", response_model=MessageResponse)
async def delete_user(user_id: str, admin_password: str):
    """Delete user (admin only)"""
    if not await verify_admin_password(admin_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin password"
        )
    
    db = await get_database()
    
    # Check if user exists
    user = await db[USERS_COLLECTION].find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Delete user
    result = await db[USERS_COLLECTION].delete_one({"_id": ObjectId(user_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    logger.info(f"Admin deleted user: {user['username']}")
    return MessageResponse(message="User deleted successfully")

# Question Management Endpoints
@router.get("/questions", response_model=QuestionsResponse)
async def get_all_questions(admin_password: str, topic_id: int = None):
    """Get all questions (admin only)"""
    if not await verify_admin_password(admin_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin password"
        )
    
    db = await get_database()
    
    # Build query
    query = {}
    if topic_id:
        query["topicId"] = topic_id
    
    questions_cursor = db[QUESTIONS_COLLECTION].find(query)
    questions = await questions_cursor.to_list(length=1000)
    
    total = await db[QUESTIONS_COLLECTION].count_documents(query)
    
    questions_response = [QuestionResponse(**serialize_doc(q)) for q in questions]
    
    logger.info(f"Retrieved {len(questions_response)} questions for admin")
    return QuestionsResponse(questions=questions_response, total=total)

@router.post("/questions", response_model=MessageResponse)
async def create_question(question_data: QuestionCreate, admin_password: str):
    """Create new question (admin only)"""
    if not await verify_admin_password(admin_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin password"
        )
    
    db = await get_database()
    
    # Create question document
    question_dict = {
        "topicId": question_data.topicId,
        "type": question_data.type,
        "question": question_data.question.dict(),
        "correctAnswer": question_data.correctAnswer,
        "explanation": question_data.explanation.dict(),
        "difficulty": question_data.difficulty,
        "createdAt": datetime.utcnow()
    }
    
    # Add options for multiple choice questions
    if question_data.options:
        question_dict["options"] = question_data.options
    
    result = await db[QUESTIONS_COLLECTION].insert_one(question_dict)
    logger.info(f"Admin created new question for topic {question_data.topicId}")
    
    return MessageResponse(message="Question created successfully")

@router.delete("/questions/{question_id}", response_model=MessageResponse)
async def delete_question(question_id: str, admin_password: str):
    """Delete question (admin only)"""
    if not await verify_admin_password(admin_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin password"
        )
    
    db = await get_database()
    
    # Check if question exists
    question = await db[QUESTIONS_COLLECTION].find_one({"_id": ObjectId(question_id)})
    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )
    
    # Delete question
    result = await db[QUESTIONS_COLLECTION].delete_one({"_id": ObjectId(question_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )
    
    logger.info(f"Admin deleted question: {question_id}")
    return MessageResponse(message="Question deleted successfully")

@router.get("/stats")
async def get_admin_stats(admin_password: str):
    """Get platform statistics (admin only)"""
    if not await verify_admin_password(admin_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin password"
        )
    
    db = await get_database()
    
    # Get statistics
    total_users = await db[USERS_COLLECTION].count_documents({})
    total_questions = await db[QUESTIONS_COLLECTION].count_documents({})
    
    # Questions by topic
    topics_pipeline = [
        {"$group": {"_id": "$topicId", "count": {"$sum": 1}}},
        {"$sort": {"_id": 1}}
    ]
    topics_cursor = db[QUESTIONS_COLLECTION].aggregate(topics_pipeline)
    topics_stats = await topics_cursor.to_list(length=20)
    
    stats = {
        "totalUsers": total_users,
        "totalQuestions": total_questions,
        "questionsByTopic": {str(topic["_id"]): topic["count"] for topic in topics_stats}
    }
    
    logger.info("Admin retrieved platform stats")
    return stats