from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import JSONResponse
from typing import List
import pandas as pd
import io
import json
import uuid
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

async def get_admin_access(admin_password: str):
    """Verify admin access and raise exception if invalid"""
    if not await verify_admin_password(admin_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin password"
        )

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
async def create_question(question_data: dict, admin_password: str):
    """Create new question (admin only) - accepts flexible format from frontend"""
    if not await verify_admin_password(admin_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin password"
        )
    
    try:
        db = await get_database()
        
        # Normalize type field (convert "multiple-choice" to "multiple_choice")
        question_type = question_data.get("type", "multiple_choice")
        if question_type == "multiple-choice":
            question_type = "multiple_choice"
        elif question_type == "true-false":
            question_type = "true_false"
        
        # Handle question text - can be dict or MultilingualText object
        question_text = question_data.get("question", {})
        if isinstance(question_text, dict):
            question_es = question_text.get("es", "")
            question_en = question_text.get("en", "")
        else:
            question_es = str(question_text)
            question_en = str(question_text)
        
        # Handle explanation - can be dict or MultilingualText object
        explanation = question_data.get("explanation", {})
        if isinstance(explanation, dict):
            explanation_es = explanation.get("es", "")
            explanation_en = explanation.get("en", "")
        else:
            explanation_es = str(explanation)
            explanation_en = str(explanation)
        
        # Handle options - can be list or dict
        options = question_data.get("options", [])
        if isinstance(options, list):
            # Convert list to dict format expected by the system
            options_dict = {"es": options, "en": options}
        elif isinstance(options, dict):
            options_dict = options
        else:
            options_dict = {"es": [], "en": []}
        
        # Create question document
        question_dict = {
            "topicId": int(question_data.get("topicId", 1)),
            "type": question_type,
            "question": {"es": question_es, "en": question_en},
            "correctAnswer": int(question_data.get("correctAnswer", 0)),
            "explanation": {"es": explanation_es, "en": explanation_en},
            "difficulty": question_data.get("difficulty", "medium"),
            "createdAt": datetime.utcnow()
        }
        
        # Add options for multiple choice questions
        if question_type == "multiple_choice" and options_dict:
            question_dict["options"] = options_dict
        elif question_type == "true_false":
            question_dict["options"] = {"es": ["Verdadero", "Falso"], "en": ["True", "False"]}
        
        result = await db[QUESTIONS_COLLECTION].insert_one(question_dict)
        logger.info(f"Admin created new question for topic {question_dict['topicId']}")
        
        return MessageResponse(message="Question created successfully")
    
    except Exception as e:
        logger.error(f"Error creating question: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating question: {str(e)}"
        )

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
    """Get admin statistics"""
    await get_admin_access(admin_password)
    
    try:
        db = await get_database()
        
        # Count users
        user_count = await db[USERS_COLLECTION].count_documents({})
        
        # Count questions
        question_count = await db[QUESTIONS_COLLECTION].count_documents({})
        
        # Count questions by topic
        questions_by_topic = {}
        for topic_id in range(1, 6):
            count = await db[QUESTIONS_COLLECTION].count_documents({"topicId": topic_id})
            questions_by_topic[f"topic_{topic_id}"] = count
        
        return {
            "users": user_count,
            "questions": question_count,
            "questions_by_topic": questions_by_topic
        }
    
    except Exception as e:
        logger.error(f"Error getting admin stats: {e}")
        raise HTTPException(status_code=500, detail="Error retrieving statistics")

@router.post("/questions/bulk-import")
async def bulk_import_questions(
    admin_password: str,
    file: UploadFile = File(...)
):
    """Import questions in bulk from Excel/CSV file"""
    await get_admin_access(admin_password)
    
    # Validate file type
    allowed_extensions = ['.xlsx', '.xls', '.csv']
    file_extension = None
    for ext in allowed_extensions:
        if file.filename.lower().endswith(ext):
            file_extension = ext
            break
    
    if not file_extension:
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Please upload Excel (.xlsx, .xls) or CSV (.csv) file"
        )
    
    try:
        # Read file content
        contents = await file.read()
        
        # Parse file based on extension
        if file_extension == '.csv':
            df = pd.read_csv(io.StringIO(contents.decode('utf-8')))
        else:  # Excel files
            df = pd.read_excel(io.BytesIO(contents))
        
        # Validate required columns
        required_columns = [
            'topic_id', 'type', 'question_es', 'question_en', 
            'options', 'correct_answer', 'explanation_es', 'explanation_en', 'difficulty'
        ]
        
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            raise HTTPException(
                status_code=400,
                detail=f"Missing required columns: {missing_columns}"
            )
        
        # Process questions
        db = await get_database()
        imported_questions = []
        errors = []
        
        for index, row in df.iterrows():
            try:
                # Parse options (expect JSON string or comma-separated)
                options_str = str(row['options']).strip()
                if options_str.startswith('[') and options_str.endswith(']'):
                    # JSON format
                    options = json.loads(options_str)
                else:
                    # Comma-separated format
                    options = [opt.strip() for opt in options_str.split(',')]
                
                # Create question document
                question_doc = {
                    "id": str(uuid.uuid4()),
                    "topicId": int(row['topic_id']),
                    "type": str(row['type']).lower().replace(' ', '_'),
                    "question": {
                        "es": str(row['question_es']).strip(),
                        "en": str(row['question_en']).strip()
                    },
                    "options": options,
                    "correctAnswer": int(row['correct_answer']),
                    "explanation": {
                        "es": str(row['explanation_es']).strip(),
                        "en": str(row['explanation_en']).strip()
                    },
                    "difficulty": str(row['difficulty']).lower(),
                    "createdAt": datetime.utcnow(),
                    "updatedAt": datetime.utcnow()
                }
                
                # Validate question
                if not (1 <= question_doc["topicId"] <= 5):
                    errors.append(f"Row {index + 2}: Topic ID must be between 1-5")
                    continue
                
                if question_doc["type"] not in ["multiple_choice", "true_false"]:
                    errors.append(f"Row {index + 2}: Type must be 'multiple_choice' or 'true_false'")
                    continue
                
                if question_doc["difficulty"] not in ["easy", "medium", "hard"]:
                    errors.append(f"Row {index + 2}: Difficulty must be 'easy', 'medium', or 'hard'")
                    continue
                
                if question_doc["type"] == "multiple_choice" and len(options) < 2:
                    errors.append(f"Row {index + 2}: Multiple choice questions need at least 2 options")
                    continue
                
                if not (0 <= question_doc["correctAnswer"] < len(options)):
                    errors.append(f"Row {index + 2}: Correct answer index out of range")
                    continue
                
                # Insert into database
                result = await db[QUESTIONS_COLLECTION].insert_one(question_doc)
                
                if result.inserted_id:
                    imported_questions.append({
                        "row": index + 2,
                        "id": question_doc["id"],
                        "topic": question_doc["topicId"],
                        "question_es": question_doc["question"]["es"][:50] + "..."
                    })
                
            except Exception as e:
                errors.append(f"Row {index + 2}: {str(e)}")
        
        return {
            "message": "Bulk import completed",
            "imported_count": len(imported_questions),
            "error_count": len(errors),
            "imported_questions": imported_questions,
            "errors": errors[:10]  # Limit errors to first 10
        }
    
    except pd.errors.EmptyDataError:
        raise HTTPException(status_code=400, detail="File is empty or invalid")
    except Exception as e:
        logger.error(f"Bulk import error: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")

@router.get("/questions/template")
async def download_import_template(admin_password: str):
    """Download template file for bulk import"""
    await get_admin_access(admin_password)
    
    # Create sample data
    template_data = {
        'topic_id': [1, 1, 2],
        'type': ['multiple_choice', 'true_false', 'multiple_choice'],
        'question_es': [
            '¿Cuál es la función principal de la corteza en los árboles?',
            'La poda debe realizarse siempre en invierno',
            '¿Qué herramienta es más segura para cortar ramas altas?'
        ],
        'question_en': [
            'What is the main function of bark in trees?',
            'Pruning should always be done in winter',
            'Which tool is safest for cutting high branches?'
        ],
        'options': [
            '["Protección", "Fotosíntesis", "Transporte de agua", "Almacenamiento"]',
            '["Verdadero", "Falso"]',
            '["Motosierra", "Sierra de pértiga", "Hacha", "Tijeras de podar"]'
        ],
        'correct_answer': [0, 1, 1],
        'explanation_es': [
            'La corteza protege el árbol de daños externos y patógenos',
            'La poda puede realizarse en diferentes épocas según el tipo de árbol',
            'La sierra de pértiga permite mantener distancia de seguridad'
        ],
        'explanation_en': [
            'Bark protects the tree from external damage and pathogens',
            'Pruning can be done at different times depending on tree type',
            'Pole saw allows maintaining safe distance'
        ],
        'difficulty': ['medium', 'easy', 'medium']
    }
    
    # Create DataFrame and convert to CSV
    df = pd.DataFrame(template_data)
    csv_buffer = io.StringIO()
    df.to_csv(csv_buffer, index=False)
    csv_content = csv_buffer.getvalue()
    
    return JSONResponse(
        content={"csv_content": csv_content},
        headers={"Content-Disposition": "attachment; filename=questions_template.csv"}
    )