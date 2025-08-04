// Mock data para la plataforma de estudio de arborista

export const examTopics = [
  { 
    id: 1, 
    name: { es: "Biología del Árbol", en: "Tree Biology" }, 
    weight: 11,
    description: { 
      es: "Comprensión de la estructura, función y procesos de crecimiento de los árboles",
      en: "Understanding tree structure, function, and growth processes"
    }
  },
  { 
    id: 2, 
    name: { es: "Identificación y Selección", en: "Identification and Selection" }, 
    weight: 9,
    description: { 
      es: "Reconocimiento de especies de árboles y selección apropiada para sitios específicos",
      en: "Recognizing tree species and selecting appropriate trees for specific sites"
    }
  },
  { 
    id: 3, 
    name: { es: "Manejo de Suelo", en: "Soil Management" }, 
    weight: 7,
    description: { 
      es: "Comprensión de las propiedades del suelo y su impacto en la salud del árbol",
      en: "Understanding soil properties and their impact on tree health"
    }
  },
  { 
    id: 4, 
    name: { es: "Instalación y Establecimiento", en: "Installation and Establishment" }, 
    weight: 9,
    description: { 
      es: "Mejores prácticas para la plantación y establecimiento exitoso de árboles",
      en: "Best practices for planting and ensuring successful tree establishment"
    }
  },
  { 
    id: 5, 
    name: { es: "Poda", en: "Pruning" }, 
    weight: 14,
    description: { 
      es: "Técnicas y principios para la poda adecuada de árboles",
      en: "Techniques and principles for proper tree pruning"
    }
  },
  { 
    id: 6, 
    name: { es: "Diagnóstico y Tratamiento", en: "Diagnosis and Treatment" }, 
    weight: 9,
    description: { 
      es: "Identificación y manejo de plagas, enfermedades y trastornos de árboles",
      en: "Identifying and managing tree pests, diseases, and disorders"
    }
  },
  { 
    id: 7, 
    name: { es: "Árboles y Construcción", en: "Trees and Construction" }, 
    weight: 9,
    description: { 
      es: "Protección de árboles durante actividades de construcción",
      en: "Protecting trees during construction activities"
    }
  },
  { 
    id: 8, 
    name: { es: "Riesgo de Árboles", en: "Tree Risk" }, 
    weight: 11,
    description: { 
      es: "Evaluación y mitigación de peligros potenciales asociados con árboles",
      en: "Assessing and mitigating potential hazards associated with trees"
    }
  },
  { 
    id: 9, 
    name: { es: "Prácticas de Trabajo Seguras", en: "Safe Work Practices" }, 
    weight: 15,
    description: { 
      es: "Implementación de protocolos de seguridad en operaciones arborícolas",
      en: "Implementing safety protocols in arboricultural operations"
    }
  },
  { 
    id: 10, 
    name: { es: "Silvicultura Urbana", en: "Urban Forestry" }, 
    weight: 6,
    description: { 
      es: "Manejo y planificación de árboles en ambientes urbanos",
      en: "Managing and planning for trees in urban environments"
    }
  }
];

export const mockQuestions = [
  // Tree Biology Questions
  {
    id: 1,
    topicId: 1,
    type: "multiple_choice",
    question: {
      es: "¿Cuál es la función principal del cambium en un árbol?",
      en: "What is the primary function of the cambium in a tree?"
    },
    options: {
      es: [
        "Transporte de agua y nutrientes",
        "Crecimiento en diámetro del tronco",
        "Fotosíntesis",
        "Almacenamiento de alimentos"
      ],
      en: [
        "Transport of water and nutrients",
        "Growth in trunk diameter",
        "Photosynthesis",
        "Food storage"
      ]
    },
    correctAnswer: 1,
    explanation: {
      es: "El cambium es responsable del crecimiento secundario, aumentando el diámetro del tronco y ramas.",
      en: "The cambium is responsible for secondary growth, increasing the diameter of the trunk and branches."
    }
  },
  {
    id: 2,
    topicId: 1,
    type: "true_false",
    question: {
      es: "Las raíces de los árboles típicamente se extienden mucho más allá de la copa del árbol.",
      en: "Tree roots typically extend much further than the tree's canopy."
    },
    correctAnswer: true,
    explanation: {
      es: "Las raíces pueden extenderse 2-3 veces más allá del diámetro de la copa para buscar agua y nutrientes.",
      en: "Roots can extend 2-3 times beyond the canopy diameter to search for water and nutrients."
    }
  },
  // Pruning Questions
  {
    id: 3,
    topicId: 5,
    type: "multiple_choice",
    question: {
      es: "¿Cuál es la práctica correcta al realizar un corte de poda?",
      en: "What is the correct practice when making a pruning cut?"
    },
    options: {
      es: [
        "Cortar al ras del tronco",
        "Cortar justo fuera del collar de la rama",
        "Dejar un muñón de 6 pulgadas",
        "Cortar en ángulo de 45 grados"
      ],
      en: [
        "Cut flush with the trunk",
        "Cut just outside the branch collar",
        "Leave a 6-inch stub",
        "Cut at a 45-degree angle"
      ]
    },
    correctAnswer: 1,
    explanation: {
      es: "El corte debe hacerse justo fuera del collar de la rama para promover una cicatrización adecuada.",
      en: "The cut should be made just outside the branch collar to promote proper healing."
    }
  },
  {
    id: 4,
    topicId: 5,
    type: "true_false",
    question: {
      es: "Es recomendable aplicar selladores de heridas después de la poda.",
      en: "It is recommended to apply wound sealers after pruning."
    },
    correctAnswer: false,
    explanation: {
      es: "Los selladores de heridas pueden interferir con el proceso natural de cicatrización del árbol.",
      en: "Wound sealers can interfere with the tree's natural healing process."
    }
  },
  // Safe Work Practices
  {
    id: 5,
    topicId: 9,
    type: "multiple_choice",
    question: {
      es: "¿Cuál es la distancia mínima segura de las líneas eléctricas al trabajar con árboles?",
      en: "What is the minimum safe distance from power lines when working with trees?"
    },
    options: {
      es: [
        "3 pies (0.9 m)",
        "6 pies (1.8 m)", 
        "10 pies (3.0 m)",
        "15 pies (4.6 m)"
      ],
      en: [
        "3 feet (0.9 m)",
        "6 feet (1.8 m)",
        "10 feet (3.0 m)", 
        "15 feet (4.6 m)"
      ]
    },
    correctAnswer: 2,
    explanation: {
      es: "La distancia mínima segura es de 10 pies para líneas eléctricas estándar.",
      en: "The minimum safe distance is 10 feet for standard power lines."
    }
  },
  {
    id: 6,
    topicId: 9,
    type: "true_false",
    question: {
      es: "Se requiere equipo de protección personal (EPP) en todas las operaciones de arboricultura.",
      en: "Personal protective equipment (PPE) is required in all arboriculture operations."
    },
    correctAnswer: true,
    explanation: {
      es: "El EPP es esencial para prevenir lesiones en todas las actividades arborícolas.",
      en: "PPE is essential to prevent injuries in all arboricultural activities."
    }
  },
  // Tree Risk Assessment
  {
    id: 7,
    topicId: 8,
    type: "multiple_choice",
    question: {
      es: "¿Qué factor NO es típicamente considerado en una evaluación de riesgo de árboles?",
      en: "Which factor is NOT typically considered in a tree risk assessment?"
    },
    options: {
      es: [
        "Condición del árbol",
        "Probabilidad de falla",
        "Valor estético",
        "Probabilidad de impacto"
      ],
      en: [
        "Tree condition",
        "Likelihood of failure",
        "Aesthetic value",
        "Likelihood of impact"
      ]
    },
    correctAnswer: 2,
    explanation: {
      es: "El valor estético no es un factor principal en la evaluación de riesgo de seguridad.",
      en: "Aesthetic value is not a primary factor in safety risk assessment."
    }
  },
  {
    id: 8,
    topicId: 8,
    type: "true_false",
    question: {
      es: "Los árboles muertos siempre deben ser removidos inmediatamente.",
      en: "Dead trees should always be removed immediately."
    },
    correctAnswer: false,
    explanation: {
      es: "Los árboles muertos solo necesitan remoción si presentan un riesgo de seguridad significativo.",
      en: "Dead trees only need removal if they present a significant safety risk."
    }
  }
];

export const mockUsers = [
  {
    id: 1,
    username: "estudiante1",
    email: "estudiante1@email.com",
    name: "Juan Pérez",
    language: "es",
    progress: {
      completedQuestions: 25,
      totalQuestions: 100,
      averageScore: 85,
      topicScores: {
        1: 90, 2: 80, 3: 75, 4: 85, 5: 92, 
        6: 78, 7: 88, 8: 82, 9: 95, 10: 80
      }
    }
  },
  {
    id: 2,
    username: "student2",
    email: "student2@email.com", 
    name: "Mary Johnson",
    language: "en",
    progress: {
      completedQuestions: 40,
      totalQuestions: 100,
      averageScore: 78,
      topicScores: {
        1: 82, 2: 75, 3: 70, 4: 80, 5: 85,
        6: 72, 7: 83, 8: 78, 9: 90, 10: 76
      }
    }
  }
];

export const mockExamResults = [
  {
    id: 1,
    userId: 1,
    examType: "practice",
    topicId: null, // null means full exam
    score: 82,
    totalQuestions: 50,
    correctAnswers: 41,
    timeSpent: 3600, // in seconds
    completedAt: new Date("2024-12-10T10:30:00"),
    questions: [1, 2, 3, 4, 5] // question IDs answered
  },
  {
    id: 2,
    userId: 1,
    examType: "topic",
    topicId: 5, // Pruning topic
    score: 92,
    totalQuestions: 10,
    correctAnswers: 9,
    timeSpent: 600,
    completedAt: new Date("2024-12-09T14:20:00"),
    questions: [3, 4]
  }
];

// Configuraciones de examen
export const examConfigurations = {
  fullExam: {
    duration: 3600, // 60 minutes
    totalQuestions: 100,
    questionDistribution: {
      1: 11, 2: 9, 3: 7, 4: 9, 5: 14,
      6: 9, 7: 9, 8: 11, 9: 15, 10: 6
    }
  },
  practiceExam: {
    duration: 1800, // 30 minutes
    totalQuestions: 50,
    questionDistribution: {
      1: 6, 2: 5, 3: 4, 4: 5, 5: 7,
      6: 5, 7: 5, 8: 6, 9: 8, 10: 3
    }
  },
  topicExam: {
    duration: 600, // 10 minutes per topic
    totalQuestions: 10
  }
};