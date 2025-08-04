from fastapi import APIRouter, Depends
from bson import ObjectId
import logging

from models import UserResponse, UserProgress
from auth import get_current_user
from database import get_database, USERS_COLLECTION

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/progress", response_model=UserProgress)
async def get_user_progress(
    current_user: UserResponse = Depends(get_current_user)
):
    """Get current user's progress"""
    db = await get_database()
    
    # Get fresh user data from database
    user = await db[USERS_COLLECTION].find_one({"_id": ObjectId(current_user.id)})
    
    if not user:
        # Return current user progress if not found in DB
        return current_user.progress
    
    progress_data = user.get("progress", {
        "completedQuestions": 0,
        "totalQuestions": 100,
        "averageScore": 0.0,
        "topicScores": {}
    })
    
    logger.info(f"Retrieved progress for user {current_user.username}")
    
    return UserProgress(**progress_data)