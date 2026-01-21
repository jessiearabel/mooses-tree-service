from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Union
import uuid
from datetime import datetime, timedelta
from bson import ObjectId
import logging

from models import (
    ExamStart, ExamStartResponse, ExamSubmit, ExamSubmitResponse, 
    ExamResultResponse, ExamHistoryResponse, QuestionResponse, 
    QuestionResult, UserResponse, ExamType
)
from auth import get_current_user
from database import (
    get_database, QUESTIONS_COLLECTION, EXAM_RESULTS_COLLECTION, 
    EXAM_SESSIONS_COLLECTION, USERS_COLLECTION, serialize_doc, serialize_docs
)

logger = logging.getLogger(__name__)
router = APIRouter()

# Exam configurations
EXAM_CONFIGS = {
    ExamType.practice: {"duration": 1800, "questions": 8},    # 30 min, 8 questions
    ExamType.full: {"duration": 3600, "questions": 20},      # 60 min, 20 questions  
    ExamType.topic: {"duration": 600, "questions": 10}       # 10 min, 10 questions
}

@router.post("/start", response_model=ExamStartResponse)
async def start_exam(
    exam_data: ExamStart,
    current_user: UserResponse = Depends(get_current_user)
):
    """Start a new exam session"""
    db = await get_database()
    
    # Get exam configuration
    config = EXAM_CONFIGS.get(exam_data.examType)
    if not config:
        raise HTTPException(
            status_code=400,
            detail="Invalid exam type"
        )
    
    # Build question query
    match_stage = {}
    if exam_data.examType == ExamType.topic:
        if not exam_data.topicId:
            raise HTTPException(
                status_code=400,
                detail="Topic ID is required for topic exams"
            )
        match_stage["topicId"] = exam_data.topicId
    
    # Get random questions
    pipeline = []
    if match_stage:
        pipeline.append({"$match": match_stage})
    
    pipeline.extend([
        {"$sample": {"size": config["questions"] * 2}},  # Get more for better randomization
        {"$limit": config["questions"]}
    ])
    
    questions_cursor = db[QUESTIONS_COLLECTION].aggregate(pipeline)
    questions = await questions_cursor.to_list(length=config["questions"])
    
    if len(questions) < config["questions"]:
        logger.warning(f"Only found {len(questions)} questions, requested {config['questions']}")
        if not questions:
            raise HTTPException(
                status_code=404,
                detail="No questions found for the specified criteria"
            )
    
    # Create exam session
    exam_id = str(uuid.uuid4())
    start_time = datetime.utcnow()
    
    session_data = {
        "examId": exam_id,
        "userId": ObjectId(current_user.id),
        "examType": exam_data.examType,
        "topicId": exam_data.topicId,
        "questionIds": [q["_id"] for q in questions],
        "startTime": start_time,
        "duration": config["duration"],
        "isCompleted": False,
        "createdAt": start_time
    }
    
    await db[EXAM_SESSIONS_COLLECTION].insert_one(session_data)
    
    # Convert questions to response format
    questions_response = [
        QuestionResponse(**serialize_doc(q)) 
        for q in questions
    ]
    
    logger.info(f"Started {exam_data.examType} exam for user {current_user.username}")
    
    return ExamStartResponse(
        examId=exam_id,
        questions=questions_response,
        startTime=start_time,
        duration=config["duration"]
    )

@router.post("/submit", response_model=ExamSubmitResponse)
async def submit_exam(
    exam_data: ExamSubmit,
    current_user: UserResponse = Depends(get_current_user)
):
    """Submit exam answers and calculate results"""
    db = await get_database()
    
    # Get exam session
    session = await db[EXAM_SESSIONS_COLLECTION].find_one({
        "examId": exam_data.examId,
        "userId": ObjectId(current_user.id),
        "isCompleted": False
    })
    
    if not session:
        raise HTTPException(
            status_code=404,
            detail="Exam session not found or already completed"
        )
    
    # Check if exam time has expired
    elapsed_time = datetime.utcnow() - session["startTime"]
    if elapsed_time.total_seconds() > session["duration"]:
        logger.warning(f"Exam {exam_data.examId} submitted after time limit")
    
    # Get questions used in exam
    question_ids = session["questionIds"]
    questions_cursor = db[QUESTIONS_COLLECTION].find({"_id": {"$in": question_ids}})
    questions = await questions_cursor.to_list(length=len(question_ids))
    
    # Create question lookup by ID for preserving order
    question_lookup = {str(q["_id"]): serialize_doc(q) for q in questions}
    ordered_questions = [question_lookup[str(qid)] for qid in question_ids if str(qid) in question_lookup]
    
    # Calculate results
    results = []
    correct_count = 0
    
    for i, question in enumerate(ordered_questions):
        question_index = str(i)
        user_answer = exam_data.answers.get(question_index)
        correct_answer = question["correctAnswer"]
        
        is_correct = False
        if user_answer is not None:  # Only check if user provided an answer
            if question["type"] == "multiple_choice":
                is_correct = (user_answer == correct_answer)
            elif question["type"] == "true_false":
                # For true/false, frontend sends 0 for true, 1 for false
                user_bool = user_answer == 0 if isinstance(user_answer, int) else user_answer
                is_correct = (user_bool == correct_answer)
        
        if is_correct:
            correct_count += 1
        
        # Handle None values for userAnswer - convert to appropriate default
        display_user_answer = user_answer
        if user_answer is None:
            # Use -1 as "no answer" indicator for multiple choice, False for true/false
            if question["type"] == "multiple_choice":
                display_user_answer = -1
            else:  # true_false
                display_user_answer = False
        
        results.append(QuestionResult(
            questionId=question["id"],
            userAnswer=display_user_answer,
            correctAnswer=correct_answer,
            isCorrect=is_correct,
            explanation=question["explanation"]
        ))
    
    # Calculate score
    total_questions = len(ordered_questions)
    score = round((correct_count / total_questions) * 100) if total_questions > 0 else 0
    
    # Save exam result
    exam_result = {
        "userId": ObjectId(current_user.id),
        "examType": session["examType"],
        "topicId": session.get("topicId"),
        "score": score,
        "correctAnswers": correct_count,
        "totalQuestions": total_questions,
        "timeSpent": exam_data.timeSpent,
        "answers": exam_data.answers,
        "questionIds": question_ids,
        "completedAt": datetime.utcnow(),
        "createdAt": datetime.utcnow()
    }
    
    await db[EXAM_RESULTS_COLLECTION].insert_one(exam_result)
    
    # Mark session as completed
    await db[EXAM_SESSIONS_COLLECTION].update_one(
        {"examId": exam_data.examId},
        {"$set": {"isCompleted": True, "completedAt": datetime.utcnow()}}
    )
    
    # Update user progress
    await update_user_progress(current_user.id, session["examType"], session.get("topicId"), score)
    
    logger.info(f"Exam {exam_data.examId} submitted by {current_user.username} - Score: {score}%")
    
    return ExamSubmitResponse(
        score=score,
        correct=correct_count,
        incorrect=total_questions - correct_count,
        total=total_questions,
        results=results
    )

@router.get("/history", response_model=ExamHistoryResponse)
async def get_exam_history(
    current_user: UserResponse = Depends(get_current_user)
):
    """Get user's exam history"""
    db = await get_database()
    
    # Get exam results for current user
    results_cursor = db[EXAM_RESULTS_COLLECTION].find(
        {"userId": ObjectId(current_user.id)}
    ).sort("completedAt", -1).limit(50)
    
    results = await results_cursor.to_list(length=50)
    
    # Convert to response format
    exam_results = [
        ExamResultResponse(**serialize_doc(result))
        for result in results
    ]
    
    total = await db[EXAM_RESULTS_COLLECTION].count_documents(
        {"userId": ObjectId(current_user.id)}
    )
    
    logger.info(f"Retrieved {len(exam_results)} exam results for user {current_user.username}")
    
    return ExamHistoryResponse(exams=exam_results, total=total)

async def update_user_progress(user_id: str, exam_type: str, topic_id: int, score: int):
    """Update user's progress based on exam results"""
    db = await get_database()
    
    # Get current user data
    user = await db[USERS_COLLECTION].find_one({"_id": ObjectId(user_id)})
    if not user:
        return
    
    progress = user.get("progress", {
        "completedQuestions": 0,
        "totalQuestions": 100,
        "averageScore": 0.0,
        "topicScores": {}
    })
    
    # Update topic score if it's a topic exam
    if exam_type == "topic" and topic_id:
        topic_key = str(topic_id)
        current_topic_score = progress["topicScores"].get(topic_key, 0)
        # Use the better score
        new_topic_score = max(current_topic_score, score)
        progress["topicScores"][topic_key] = new_topic_score
    
    # Update overall progress
    questions_added = {
        "practice": 8,
        "full": 20,
        "topic": 10
    }.get(exam_type, 0)
    
    progress["completedQuestions"] += questions_added
    
    # Recalculate average score based on recent exam results (last 100 exams)
    all_results = await db[EXAM_RESULTS_COLLECTION].find(
        {"userId": ObjectId(user_id)}
    ).sort("completedAt", -1).limit(100).to_list(length=100)
    
    if all_results:
        total_score = sum(result["score"] for result in all_results)
        progress["averageScore"] = round(total_score / len(all_results), 1)
    
    # Update user in database
    await db[USERS_COLLECTION].update_one(
        {"_id": ObjectId(user_id)},
        {
            "$set": {
                "progress": progress,
                "updatedAt": datetime.utcnow()
            }
        }
    )
    
    logger.info(f"Updated progress for user {user_id}")