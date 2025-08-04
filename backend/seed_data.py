import asyncio
from datetime import datetime, timedelta
import random
from database import get_database, USERS_COLLECTION, QUESTIONS_COLLECTION, EXAM_RESULTS_COLLECTION, connect_to_mongo, close_mongo_connection
from auth import get_password_hash
import logging

logger = logging.getLogger(__name__)

# Exam topics (matching frontend)
EXAM_TOPICS = [
    {"id": 1, "name": {"es": "Biología del Árbol", "en": "Tree Biology"}, "weight": 11},
    {"id": 2, "name": {"es": "Identificación y Selección", "en": "Identification and Selection"}, "weight": 9},
    {"id": 3, "name": {"es": "Manejo de Suelo", "en": "Soil Management"}, "weight": 7},
    {"id": 4, "name": {"es": "Instalación y Establecimiento", "en": "Installation and Establishment"}, "weight": 9},
    {"id": 5, "name": {"es": "Poda", "en": "Pruning"}, "weight": 14},
    {"id": 6, "name": {"es": "Diagnóstico y Tratamiento", "en": "Diagnosis and Treatment"}, "weight": 9},
    {"id": 7, "name": {"es": "Árboles y Construcción", "en": "Trees and Construction"}, "weight": 9},
    {"id": 8, "name": {"es": "Riesgo de Árboles", "en": "Tree Risk"}, "weight": 11},
    {"id": 9, "name": {"es": "Prácticas de Trabajo Seguras", "en": "Safe Work Practices"}, "weight": 15},
    {"id": 10, "name": {"es": "Silvicultura Urbana", "en": "Urban Forestry"}, "weight": 6}
]

async def seed_users():
    """Seed demo users"""
    db = await get_database()
    
    users = [
        {
            "username": "estudiante1",
            "email": "estudiante1@email.com",
            "password": get_password_hash("password123"),
            "name": "Juan Pérez", 
            "language": "es",
            "progress": {
                "completedQuestions": 25,
                "totalQuestions": 100,
                "averageScore": 85.0,
                "topicScores": {
                    "1": 90.0, "2": 80.0, "3": 75.0, "4": 85.0, "5": 92.0,
                    "6": 78.0, "7": 88.0, "8": 82.0, "9": 95.0, "10": 80.0
                }
            },
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        },
        {
            "username": "student2",
            "email": "student2@email.com",
            "password": get_password_hash("password123"),
            "name": "Mary Johnson",
            "language": "en",
            "progress": {
                "completedQuestions": 40,
                "totalQuestions": 100,
                "averageScore": 78.0,
                "topicScores": {
                    "1": 82.0, "2": 75.0, "3": 70.0, "4": 80.0, "5": 85.0,
                    "6": 72.0, "7": 83.0, "8": 78.0, "9": 90.0, "10": 76.0
                }
            },
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }
    ]
    
    for user in users:
        existing = await db[USERS_COLLECTION].find_one({"username": user["username"]})
        if not existing:
            await db[USERS_COLLECTION].insert_one(user)
            logger.info(f"Created user: {user['username']}")
        else:
            logger.info(f"User already exists: {user['username']}")

async def seed_questions():
    """Seed exam questions"""
    db = await get_database()
    
    questions = [
        # Tree Biology Questions
        {
            "topicId": 1,
            "type": "multiple_choice",
            "question": {
                "es": "¿Cuál es la función principal del cambium en un árbol?",
                "en": "What is the primary function of the cambium in a tree?"
            },
            "options": {
                "es": [
                    "Transporte de agua y nutrientes",
                    "Crecimiento en diámetro del tronco",
                    "Fotosíntesis",
                    "Almacenamiento de alimentos"
                ],
                "en": [
                    "Transport of water and nutrients",
                    "Growth in trunk diameter",
                    "Photosynthesis",
                    "Food storage"
                ]
            },
            "correctAnswer": 1,
            "explanation": {
                "es": "El cambium es responsable del crecimiento secundario, aumentando el diámetro del tronco y ramas.",
                "en": "The cambium is responsible for secondary growth, increasing the diameter of the trunk and branches."
            },
            "difficulty": "medium",
            "createdAt": datetime.utcnow()
        },
        {
            "topicId": 1,
            "type": "true_false",
            "question": {
                "es": "Las raíces de los árboles típicamente se extienden mucho más allá de la copa del árbol.",
                "en": "Tree roots typically extend much further than the tree's canopy."
            },
            "correctAnswer": True,
            "explanation": {
                "es": "Las raíces pueden extenderse 2-3 veces más allá del diámetro de la copa para buscar agua y nutrientes.",
                "en": "Roots can extend 2-3 times beyond the canopy diameter to search for water and nutrients."
            },
            "difficulty": "easy",
            "createdAt": datetime.utcnow()
        },
        # Pruning Questions
        {
            "topicId": 5,
            "type": "multiple_choice",
            "question": {
                "es": "¿Cuál es la práctica correcta al realizar un corte de poda?",
                "en": "What is the correct practice when making a pruning cut?"
            },
            "options": {
                "es": [
                    "Cortar al ras del tronco",
                    "Cortar justo fuera del collar de la rama",
                    "Dejar un muñón de 6 pulgadas",
                    "Cortar en ángulo de 45 grados"
                ],
                "en": [
                    "Cut flush with the trunk",
                    "Cut just outside the branch collar",
                    "Leave a 6-inch stub",
                    "Cut at a 45-degree angle"
                ]
            },
            "correctAnswer": 1,
            "explanation": {
                "es": "El corte debe hacerse justo fuera del collar de la rama para promover una cicatrización adecuada.",
                "en": "The cut should be made just outside the branch collar to promote proper healing."
            },
            "difficulty": "medium",
            "createdAt": datetime.utcnow()
        },
        {
            "topicId": 5,
            "type": "true_false",
            "question": {
                "es": "Es recomendable aplicar selladores de heridas después de la poda.",
                "en": "It is recommended to apply wound sealers after pruning."
            },
            "correctAnswer": False,
            "explanation": {
                "es": "Los selladores de heridas pueden interferir con el proceso natural de cicatrización del árbol.",
                "en": "Wound sealers can interfere with the tree's natural healing process."
            },
            "difficulty": "medium",
            "createdAt": datetime.utcnow()
        },
        # Safe Work Practices
        {
            "topicId": 9,
            "type": "multiple_choice",
            "question": {
                "es": "¿Cuál es la distancia mínima segura de las líneas eléctricas al trabajar con árboles?",
                "en": "What is the minimum safe distance from power lines when working with trees?"
            },
            "options": {
                "es": [
                    "3 pies (0.9 m)",
                    "6 pies (1.8 m)", 
                    "10 pies (3.0 m)",
                    "15 pies (4.6 m)"
                ],
                "en": [
                    "3 feet (0.9 m)",
                    "6 feet (1.8 m)",
                    "10 feet (3.0 m)", 
                    "15 feet (4.6 m)"
                ]
            },
            "correctAnswer": 2,
            "explanation": {
                "es": "La distancia mínima segura es de 10 pies para líneas eléctricas estándar.",
                "en": "The minimum safe distance is 10 feet for standard power lines."
            },
            "difficulty": "easy",
            "createdAt": datetime.utcnow()
        },
        {
            "topicId": 9,
            "type": "true_false",
            "question": {
                "es": "Se requiere equipo de protección personal (EPP) en todas las operaciones de arboricultura.",
                "en": "Personal protective equipment (PPE) is required in all arboriculture operations."
            },
            "correctAnswer": True,
            "explanation": {
                "es": "El EPP es esencial para prevenir lesiones en todas las actividades arborícolas.",
                "en": "PPE is essential to prevent injuries in all arboricultural activities."
            },
            "difficulty": "easy",
            "createdAt": datetime.utcnow()
        },
        # Tree Risk Assessment
        {
            "topicId": 8,
            "type": "multiple_choice",
            "question": {
                "es": "¿Qué factor NO es típicamente considerado en una evaluación de riesgo de árboles?",
                "en": "Which factor is NOT typically considered in a tree risk assessment?"
            },
            "options": {
                "es": [
                    "Condición del árbol",
                    "Probabilidad de falla",
                    "Valor estético",
                    "Probabilidad de impacto"
                ],
                "en": [
                    "Tree condition",
                    "Likelihood of failure",
                    "Aesthetic value",
                    "Likelihood of impact"
                ]
            },
            "correctAnswer": 2,
            "explanation": {
                "es": "El valor estético no es un factor principal en la evaluación de riesgo de seguridad.",
                "en": "Aesthetic value is not a primary factor in safety risk assessment."
            },
            "difficulty": "medium",
            "createdAt": datetime.utcnow()
        },
        {
            "topicId": 8,
            "type": "true_false",
            "question": {
                "es": "Los árboles muertos siempre deben ser removidos inmediatamente.",
                "en": "Dead trees should always be removed immediately."
            },
            "correctAnswer": False,
            "explanation": {
                "es": "Los árboles muertos solo necesitan remoción si presentan un riesgo de seguridad significativo.",
                "en": "Dead trees only need removal if they present a significant safety risk."
            },
            "difficulty": "hard",
            "createdAt": datetime.utcnow()
        },
        # Soil Management
        {
            "topicId": 3,
            "type": "multiple_choice",
            "question": {
                "es": "¿Qué tipo de suelo proporciona típicamente las mejores condiciones para el crecimiento de raíces?",
                "en": "Which soil type typically provides the best conditions for root growth?"
            },
            "options": {
                "es": [
                    "Arcilla",
                    "Arena",
                    "Franco",
                    "Grava"
                ],
                "en": [
                    "Clay",
                    "Sandy",
                    "Loam",
                    "Gravel"
                ]
            },
            "correctAnswer": 2,
            "explanation": {
                "es": "El suelo franco ofrece el equilibrio ideal entre drenaje, retención de agua y nutrientes.",
                "en": "Loam soil provides the ideal balance of drainage, water retention, and nutrients."
            },
            "difficulty": "medium",
            "createdAt": datetime.utcnow()
        },
        {
            "topicId": 3,
            "type": "true_false", 
            "question": {
                "es": "La fertilización excesiva de los árboles puede aumentar la susceptibilidad a plagas y enfermedades.",
                "en": "Excessive fertilization of trees can increase susceptibility to pests and diseases."
            },
            "correctAnswer": True,
            "explanation": {
                "es": "La fertilización excesiva puede promover crecimiento rápido y débil, haciendo los árboles más vulnerables.",
                "en": "Over-fertilization can promote rapid, weak growth making trees more vulnerable."
            },
            "difficulty": "medium",
            "createdAt": datetime.utcnow()
        }
    ]
    
    for question in questions:
        existing = await db[QUESTIONS_COLLECTION].find_one({
            "topicId": question["topicId"],
            "question.en": question["question"]["en"]
        })
        if not existing:
            await db[QUESTIONS_COLLECTION].insert_one(question)
            logger.info(f"Created question for topic {question['topicId']}")

async def seed_exam_results():
    """Seed sample exam results"""
    db = await get_database()
    
    # Get user IDs
    users = await db[USERS_COLLECTION].find({}).to_list(None)
    user_ids = [user["_id"] for user in users]
    
    if not user_ids:
        logger.warning("No users found, skipping exam results seeding")
        return
    
    # Create sample exam results
    exam_results = []
    for user_id in user_ids:
        # Practice exam result
        exam_results.append({
            "userId": user_id,
            "examType": "practice",
            "topicId": None,
            "score": random.randint(70, 95),
            "correctAnswers": random.randint(35, 48),
            "totalQuestions": 50,
            "timeSpent": random.randint(1200, 1800),  # 20-30 minutes
            "completedAt": datetime.utcnow() - timedelta(days=random.randint(1, 7)),
            "createdAt": datetime.utcnow()
        })
        
        # Topic exam result
        exam_results.append({
            "userId": user_id,
            "examType": "topic",
            "topicId": random.randint(1, 10),
            "score": random.randint(60, 100),
            "correctAnswers": random.randint(6, 10),
            "totalQuestions": 10,
            "timeSpent": random.randint(300, 600),  # 5-10 minutes
            "completedAt": datetime.utcnow() - timedelta(days=random.randint(1, 3)),
            "createdAt": datetime.utcnow()
        })
    
    for result in exam_results:
        await db[EXAM_RESULTS_COLLECTION].insert_one(result)
        logger.info(f"Created exam result for user {result['userId']}")

async def seed_database():
    """Main seeding function"""
    logger.info("Starting database seeding...")
    
    try:
        await connect_to_mongo()
        await seed_users()
        await seed_questions()
        await seed_exam_results()
        logger.info("Database seeding completed successfully!")
        
    except Exception as e:
        logger.error(f"Error seeding database: {e}")
        raise
    finally:
        await close_mongo_connection()

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(seed_database())