# API Contracts y Plan de Integración Backend-Frontend

## 1. DATOS MOCK A REEMPLAZAR

### Frontend Mock Data (src/data/mock.js):
- `mockUsers` → Base de datos de usuarios con autenticación JWT
- `mockQuestions` → Base de datos de preguntas por tema
- `mockExamResults` → Historial de exámenes de usuarios
- `examTopics` → Mantener como constante (estructura del examen ISA)
- `examConfigurations` → Mantener como constante (configuraciones de examen)

## 2. API ENDPOINTS REQUERIDOS

### Autenticación
```
POST /api/auth/login
Body: { username, password }
Response: { token, user: { id, username, email, name, language } }

POST /api/auth/register  
Body: { username, email, password, name, language }
Response: { message, user }

GET /api/auth/me
Headers: Authorization: Bearer <token>
Response: { user }
```

### Usuarios
```
GET /api/users/progress
Headers: Authorization: Bearer <token>
Response: { 
  completedQuestions, totalQuestions, averageScore,
  topicScores: { topicId: score }
}

PUT /api/users/language
Body: { language }
Response: { message }
```

### Preguntas
```
GET /api/questions?topicId=<id>&limit=<number>
Response: { questions: [...] }

GET /api/questions/random?examType=practice|full|topic&topicId=<id>
Response: { questions: [...], examId }
```

### Exámenes
```
POST /api/exams/start
Body: { examType, topicId?, questionIds }
Response: { examId, startTime }

POST /api/exams/submit
Body: { 
  examId, 
  answers: { questionIndex: answerIndex },
  timeSpent 
}
Response: { 
  score, correct, incorrect, total,
  results: [{ questionId, userAnswer, correctAnswer, isCorrect, explanation }]
}

GET /api/exams/history
Headers: Authorization: Bearer <token>
Response: { exams: [...] }
```

## 3. MODELOS DE BASE DE DATOS

### User Model
```javascript
{
  _id: ObjectId,
  username: String (unique),
  email: String (unique),
  password: String (hashed),
  name: String,
  language: String ('es' | 'en'),
  progress: {
    completedQuestions: Number,
    totalQuestions: Number,
    averageScore: Number,
    topicScores: Map<Number, Number>
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Question Model
```javascript
{
  _id: ObjectId,
  topicId: Number (1-10),
  type: String ('multiple_choice' | 'true_false'),
  question: {
    es: String,
    en: String
  },
  options: {
    es: [String], // solo para multiple_choice
    en: [String]
  },
  correctAnswer: Number | Boolean,
  explanation: {
    es: String,
    en: String
  },
  difficulty: String ('easy' | 'medium' | 'hard'),
  createdAt: Date
}
```

### ExamResult Model
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  examType: String ('practice' | 'full' | 'topic'),
  topicId: Number?, // null for full/practice exams
  questions: [ObjectId], // question IDs used
  answers: Map<Number, Number>, // questionIndex -> answerIndex
  score: Number,
  correctAnswers: Number,
  totalQuestions: Number,
  timeSpent: Number, // seconds
  startTime: Date,
  completedAt: Date
}
```

## 4. CAMBIOS EN FRONTEND

### AuthContext.js
- Reemplazar localStorage simulation con JWT tokens
- Usar axios interceptors para Authorization headers
- Implementar token refresh logic

### Mock Data Usage
- Remover imports de mock.js en componentes
- Implementar API calls usando axios
- Manejar loading states y error handling

### Componentes a Actualizar:
1. **Login.js**: Usar /api/auth/login
2. **Dashboard.js**: Usar /api/users/progress y /api/exams/history  
3. **ExamInterface.js**: Usar /api/questions/random y /api/exams/submit
4. **Topics.js**: Usar /api/users/progress para scores por tema
5. **Progress.js**: Usar /api/users/progress y /api/exams/history

## 5. SEGURIDAD Y VALIDACIÓN

### Backend Middleware:
- JWT authentication middleware
- Rate limiting para login attempts
- Input validation con Pydantic models
- Password hashing con bcrypt

### Frontend:
- Token storage en localStorage
- Automatic logout en token expiration
- Error handling para unauthorized requests

## 6. INICIALIZACIÓN DE DATOS

### Seed Script:
- Popular base de datos con preguntas del examen ISA
- Crear usuarios de prueba (estudiante1, student2)
- Generar resultados de exámenes ejemplo

## 7. INTEGRACIÓN STEPS

1. Implementar modelos de MongoDB
2. Crear endpoints de autenticación
3. Implementar CRUD de preguntas y exámenes
4. Actualizar AuthContext con JWT
5. Reemplazar mock calls con API calls
6. Testing de integración completa

## 8. VARIABLES DE ENTORNO

### Backend (.env):
```
JWT_SECRET=<generated-secret>
JWT_EXPIRE_HOURS=24
BCRYPT_ROUNDS=12
```

Este contrato asegura una integración limpia sin romper la funcionalidad existente del frontend.