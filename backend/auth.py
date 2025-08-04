from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext
import os
import logging

from models import TokenData, UserResponse
from database import get_database, USERS_COLLECTION, serialize_doc

logger = logging.getLogger(__name__)

# Security
security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
SECRET_KEY = os.getenv("JWT_SECRET", "your-secret-key-here")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = int(os.getenv("JWT_EXPIRE_HOURS", "24"))

def verify_password(plain_password, hashed_password):
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    """Hash a password"""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_user_by_username(username: str):
    """Get user by username from database"""
    db = await get_database()
    user = await db[USERS_COLLECTION].find_one({"username": username})
    return serialize_doc(user) if user else None

async def authenticate_user(username: str, password: str):
    """Authenticate user with username and password"""
    user = await get_user_by_username(username)
    if not user:
        return False
    if not verify_password(password, user["password"]):
        return False
    return user

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current user from JWT token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError as e:
        logger.error(f"JWT Error: {e}")
        raise credentials_exception
    
    user = await get_user_by_username(token_data.username)
    if user is None:
        raise credentials_exception
        
    # Remove password from response
    user.pop("password", None)
    return UserResponse(**user)