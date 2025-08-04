from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
import random
import logging

from models import QuestionResponse, QuestionsResponse, ExamType, UserResponse
from auth import get_current_user
from database import get_database, QUESTIONS_COLLECTION, serialize_doc, serialize_docs

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("", response_model=QuestionsResponse)
async def get_questions(
    topicId: Optional[int] = Query(None, ge=1, le=10),
    limit: int = Query(20, ge=1, le=100),
    difficulty: Optional[str] = Query(None),
    current_user: UserResponse = Depends(get_current_user)
):
    """Get questions filtered by topic, difficulty, and limit"""
    db = await get_database()
    
    # Build filter query
    filter_query = {}
    if topicId:
        filter_query["topicId"] = topicId
    if difficulty:
        filter_query["difficulty"] = difficulty
    
    # Get questions
    questions_cursor = db[QUESTIONS_COLLECTION].find(filter_query).limit(limit)
    questions = await questions_cursor.to_list(length=limit)
    
    # Get total count
    total = await db[QUESTIONS_COLLECTION].count_documents(filter_query)
    
    # Convert to response format
    questions_response = [
        QuestionResponse(**serialize_doc(q)) 
        for q in questions
    ]
    
    logger.info(f"Retrieved {len(questions_response)} questions for user {current_user.username}")
    return QuestionsResponse(questions=questions_response, total=total)

@router.get("/random", response_model=QuestionsResponse)
async def get_random_questions(
    examType: ExamType,
    topicId: Optional[int] = Query(None, ge=1, le=10),
    current_user: UserResponse = Depends(get_current_user)
):
    """Get random questions for exam based on type and topic"""
    db = await get_database()
    
    # Determine number of questions based on exam type
    question_count = {
        ExamType.practice: 8,  # Reduced for demo
        ExamType.full: 20,     # Reduced for demo  
        ExamType.topic: 10
    }
    
    limit = question_count.get(examType, 10)
    
    # Build aggregation pipeline
    match_stage = {}
    if examType == ExamType.topic and topicId:
        match_stage["topicId"] = topicId
    elif examType == ExamType.full:
        # For full exam, we want questions from all topics
        pass
    elif examType == ExamType.practice:
        # For practice, get random questions from multiple topics
        pass
    
    pipeline = []
    if match_stage:
        pipeline.append({"$match": match_stage})
    
    pipeline.extend([
        {"$sample": {"size": limit * 2}},  # Get more than needed for better randomization
        {"$limit": limit}
    ])
    
    # Execute aggregation
    questions_cursor = db[QUESTIONS_COLLECTION].aggregate(pipeline)
    questions = await questions_cursor.to_list(length=limit)
    
    if len(questions) < limit:
        logger.warning(f"Only found {len(questions)} questions, requested {limit}")
        # If we don't have enough questions, get what we can
        if not questions:
            raise HTTPException(
                status_code=404,
                detail="No questions found for the specified criteria"
            )
    
    # Convert to response format
    questions_response = [
        QuestionResponse(**serialize_doc(q)) 
        for q in questions
    ]
    
    # Shuffle the questions one more time
    random.shuffle(questions_response)
    
    logger.info(f"Retrieved {len(questions_response)} random questions for {examType} exam")
    return QuestionsResponse(questions=questions_response, total=len(questions_response))

@router.get("/topics/{topicId}", response_model=QuestionsResponse)
async def get_questions_by_topic(
    topicId: int,
    limit: int = Query(10, ge=1, le=50),
    current_user: UserResponse = Depends(get_current_user)
):
    """Get questions for a specific topic"""
    if topicId < 1 or topicId > 10:
        raise HTTPException(
            status_code=400,
            detail="Topic ID must be between 1 and 10"
        )
    
    return await get_questions(topicId=topicId, limit=limit, current_user=current_user)