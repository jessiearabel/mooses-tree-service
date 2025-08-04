from pydantic import BaseModel, Field, EmailStr
from typing import List, Dict, Optional, Union
from datetime import datetime
from enum import Enum
import uuid

class ExamType(str, Enum):
    practice = "practice"
    full = "full" 
    topic = "topic"

class QuestionType(str, Enum):
    multiple_choice = "multiple_choice"
    true_false = "true_false"

class Language(str, Enum):
    es = "es"
    en = "en"

class Difficulty(str, Enum):
    easy = "easy"
    medium = "medium"
    hard = "hard"

# Base Models
class UserProgress(BaseModel):
    completedQuestions: int = 0
    totalQuestions: int = 100
    averageScore: float = 0.0
    topicScores: Dict[str, float] = Field(default_factory=dict)

class MultilingualText(BaseModel):
    es: str
    en: str

# User Models
class UserBase(BaseModel):
    username: str
    email: EmailStr
    name: str
    language: Language = Language.es

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(UserBase):
    id: str
    progress: UserProgress
    createdAt: datetime
    
class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    language: Optional[Language] = None

class LanguageUpdate(BaseModel):
    language: Language

# Question Models
class QuestionBase(BaseModel):
    topicId: int = Field(..., ge=1, le=10)
    type: QuestionType
    question: MultilingualText
    correctAnswer: Union[int, bool]
    explanation: MultilingualText
    difficulty: Difficulty = Difficulty.medium

class QuestionMultipleChoice(QuestionBase):
    type: QuestionType = QuestionType.multiple_choice
    options: Dict[str, List[str]]  # {"es": [...], "en": [...]}
    correctAnswer: int = Field(..., ge=0, le=3)

class QuestionTrueFalse(QuestionBase):
    type: QuestionType = QuestionType.true_false
    correctAnswer: bool

class QuestionCreate(BaseModel):
    topicId: int = Field(..., ge=1, le=10)
    type: QuestionType
    question: MultilingualText
    options: Optional[Dict[str, List[str]]] = None
    correctAnswer: Union[int, bool]
    explanation: MultilingualText
    difficulty: Difficulty = Difficulty.medium

class QuestionResponse(BaseModel):
    id: str
    topicId: int
    type: QuestionType
    question: MultilingualText
    options: Optional[Dict[str, List[str]]] = None
    correctAnswer: Union[int, bool]
    explanation: MultilingualText
    difficulty: Difficulty
    createdAt: datetime

# Exam Models
class ExamStart(BaseModel):
    examType: ExamType
    topicId: Optional[int] = None

class ExamStartResponse(BaseModel):
    examId: str
    questions: List[QuestionResponse]
    startTime: datetime
    duration: int  # in seconds

class Answer(BaseModel):
    questionIndex: int
    answerIndex: Union[int, bool]

class ExamSubmit(BaseModel):
    examId: str
    answers: Dict[str, Union[int, bool]]  # questionIndex -> answerIndex
    timeSpent: int  # in seconds

class QuestionResult(BaseModel):
    questionId: str
    userAnswer: Union[int, bool]
    correctAnswer: Union[int, bool]
    isCorrect: bool
    explanation: MultilingualText

class ExamSubmitResponse(BaseModel):
    score: int
    correct: int
    incorrect: int
    total: int
    results: List[QuestionResult]

class ExamResultResponse(BaseModel):
    id: str
    examType: ExamType
    topicId: Optional[int] = None
    score: int
    correctAnswers: int
    totalQuestions: int
    timeSpent: int
    completedAt: datetime

# Auth Models
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class TokenData(BaseModel):
    username: Optional[str] = None

# API Response Models
class MessageResponse(BaseModel):
    message: str

class QuestionsResponse(BaseModel):
    questions: List[QuestionResponse]
    total: int

class ExamHistoryResponse(BaseModel):
    exams: List[ExamResultResponse]
    total: int