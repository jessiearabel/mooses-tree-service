from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
import logging

from models import UserCreate, UserLogin, UserResponse, Token, MessageResponse, LanguageUpdate
from auth import (
    authenticate_user, 
    create_access_token, 
    get_current_user, 
    get_password_hash,
    ACCESS_TOKEN_EXPIRE_HOURS
)
from database import get_database, USERS_COLLECTION, serialize_doc
from datetime import datetime

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/login", response_model=Token)
async def login(user_credentials: UserLogin):
    """Authenticate user and return JWT token"""
    user = await authenticate_user(user_credentials.username, user_credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    access_token = create_access_token(
        data={"sub": user["username"]}, expires_delta=access_token_expires
    )
    
    # Remove password from user data
    user.pop("password", None)
    user_response = UserResponse(**user)
    
    return Token(access_token=access_token, user=user_response)

@router.post("/register", response_model=MessageResponse)
async def register(user_data: UserCreate):
    """Register new user"""
    db = await get_database()
    
    # Check if username already exists
    existing_user = await db[USERS_COLLECTION].find_one({"username": user_data.username})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    # Check if email already exists
    existing_email = await db[USERS_COLLECTION].find_one({"email": user_data.email})
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user
    hashed_password = get_password_hash(user_data.password)
    user_dict = {
        "username": user_data.username,
        "email": user_data.email,
        "password": hashed_password,
        "name": user_data.name,
        "language": user_data.language,
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
    logger.info(f"New user registered: {user_data.username}")
    
    return MessageResponse(message="User registered successfully")

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: UserResponse = Depends(get_current_user)):
    """Get current user information"""
    return current_user

@router.put("/language", response_model=MessageResponse)
async def update_language(
    language_data: LanguageUpdate,
    current_user: UserResponse = Depends(get_current_user)
):
    """Update user's language preference"""
    db = await get_database()
    
    result = await db[USERS_COLLECTION].update_one(
        {"username": current_user.username},
        {
            "$set": {
                "language": language_data.language,
                "updatedAt": datetime.utcnow()
            }
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    logger.info(f"Updated language for user {current_user.username} to {language_data.language}")
    return MessageResponse(message="Language updated successfully")