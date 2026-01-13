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

class UserRole(str, Enum):
    student = "student"
    admin = "admin"

class Language(str, Enum):
    es = "es"
    en = "en"

class Difficulty(str, Enum):
    easy = "easy"
    medium = "medium"
    hard = "hard"

class SubscriptionStatus(str, Enum):
    trial = "trial"
    active = "active"
    expired = "expired"
    cancelled = "cancelled"

class PaymentStatus(str, Enum):
    pending = "pending"
    completed = "completed"
    failed = "failed"
    refunded = "refunded"

# Base Models
class UserProgress(BaseModel):
    completedQuestions: int = 0
    totalQuestions: int = 100
    averageScore: float = 0.0
    topicScores: Dict[str, float] = Field(default_factory=dict)

class MultilingualText(BaseModel):
    es: str
    en: str

# Subscription Models
class Subscription(BaseModel):
    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()))
    userId: str
    status: SubscriptionStatus = SubscriptionStatus.trial
    planId: str = "monthly_10"
    trialStartDate: Optional[datetime] = None
    trialEndDate: Optional[datetime] = None
    subscriptionStartDate: Optional[datetime] = None
    subscriptionEndDate: Optional[datetime] = None
    paypalSubscriptionId: Optional[str] = None
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

class Payment(BaseModel):
    id: Optional[str] = Field(default_factory=lambda: str(uuid.uuid4()))
    userId: str
    subscriptionId: str
    paypalOrderId: Optional[str] = None
    paypalPaymentId: Optional[str] = None
    amount: float = 10.0
    currency: str = "USD"
    status: PaymentStatus = PaymentStatus.pending
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

class PaymentCreate(BaseModel):
    subscriptionId: str
    amount: float = 10.0
    currency: str = "USD"

class SubscriptionCreate(BaseModel):
    planId: str = "monthly_10"
    startTrial: bool = True

class SubscriptionResponse(BaseModel):
    id: str
    userId: str
    status: SubscriptionStatus
    planId: str
    trialStartDate: Optional[datetime] = None
    trialEndDate: Optional[datetime] = None
    subscriptionStartDate: Optional[datetime] = None
    subscriptionEndDate: Optional[datetime] = None
    daysRemaining: Optional[int] = None
    isActive: bool = False
    createdAt: datetime

# User Models
class UserBase(BaseModel):
    username: str
    email: EmailStr
    name: str
    language: Language = Language.es
    role: UserRole = UserRole.student

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

class AdminLogin(BaseModel):
    password: str

class AdminResponse(BaseModel):
    message: str = "Admin access granted"

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