from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
import os
from pathlib import Path
from dotenv import load_dotenv

from database import connect_to_mongo, close_mongo_connection, create_indexes
from routers import auth, questions, exams, users, admin, subscriptions

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Lifespan event handler
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting up arborist platform backend...")
    await connect_to_mongo()
    await create_indexes()
    logger.info("Backend startup completed")
    
    yield
    
    # Shutdown
    logger.info("Shutting down backend...")
    await close_mongo_connection()
    logger.info("Backend shutdown completed")

# Create FastAPI app
app = FastAPI(
    title="Arborist Study Platform API",
    description="API for Louisiana Arborist Certification Exam Study Platform",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers with /api prefix
app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
app.include_router(questions.router, prefix="/api/questions", tags=["questions"])
app.include_router(exams.router, prefix="/api/exams", tags=["exams"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])

# Health check endpoint
@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "arborist-backend"}

# Root endpoint
@app.get("/api")
async def root():
    """Root endpoint"""
    return {"message": "Arborist Study Platform API", "version": "1.0.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)