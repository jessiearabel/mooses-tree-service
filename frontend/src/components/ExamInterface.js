import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { examTopics } from '../data/mock';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  ArrowLeft, 
  ArrowRight,
  Flag,
  RotateCcw,
  Home,
  AlertTriangle,
  Loader2
} from 'lucide-react';

const ExamInterface = ({ examType, topicId, onNavigate }) => {
  const { language, API } = useAuth();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [examStarted, setExamStarted] = useState(false);
  const [examCompleted, setExamCompleted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [flaggedQuestions, setFlaggedQuestions] = useState(new Set());
  const [examQuestions, setExamQuestions] = useState([]);
  const [examId, setExamId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [startTime, setStartTime] = useState(null);

  const texts = {
    es: {
      practiceExam: "Examen de Práctica",
      fullExam: "Examen Completo",
      topicExam: "Examen por Tema",
      timeRemaining: "Tiempo Restante",
      question: "Pregunta",
      of: "de",
      next: "Siguiente",
      previous: "Anterior", 
      flag: "Marcar",
      unflag: "Desmarcar",
      submit: "Enviar Examen",
      startExam: "Comenzar Examen",
      instructions: "Instrucciones",
      examComplete: "Examen Completado",
      yourScore: "Tu Puntuación",
      correct: "Correctas",
      incorrect: "Incorrectas",
      retakeExam: "Repetir Examen",
      backToHome: "Volver al Inicio",
      reviewAnswers: "Revisar Respuestas",
      explanation: "Explicación",
      yourAnswer: "Tu respuesta",
      correctAnswer: "Respuesta correcta",
      minutes: "minutos",
      confirmSubmit: "¿Estás seguro de que quieres enviar el examen?",
      timeUp: "¡Se acabó el tiempo!",
      loading: "Cargando...",
      examInstructions: [
        "Lee cada pregunta cuidadosamente antes de responder",
        "Puedes marcar preguntas para revisarlas después",
        "Una vez enviado, no podrás cambiar tus respuestas",
        "El tiempo límite se aplicará automáticamente"
      ]
    },
    en: {
      practiceExam: "Practice Exam",
      fullExam: "Full Exam", 
      topicExam: "Topic Exam",
      timeRemaining: "Time Remaining",
      question: "Question",
      of: "of",
      next: "Next",
      previous: "Previous",
      flag: "Flag",
      unflag: "Unflag", 
      submit: "Submit Exam",
      startExam: "Start Exam",
      instructions: "Instructions",
      examComplete: "Exam Completed",
      yourScore: "Your Score",
      correct: "Correct",
      incorrect: "Incorrect",
      retakeExam: "Retake Exam",
      backToHome: "Back to Home",
      reviewAnswers: "Review Answers",
      explanation: "Explanation",
      yourAnswer: "Your answer",
      correctAnswer: "Correct answer",
      minutes: "minutes",
      confirmSubmit: "Are you sure you want to submit the exam?",
      timeUp: "Time's up!",
      loading: "Loading...",
      examInstructions: [
        "Read each question carefully before answering",
        "You can flag questions to review them later",
        "Once submitted, you cannot change your answers",
        "Time limit will be enforced automatically"
      ]
    }
  };

  const t = texts[language];

  // Initialize exam
  useEffect(() => {
    if (examStarted && !examId) {
      startExam();
    }
  }, [examStarted]);

  // Timer effect
  useEffect(() => {
    if (examStarted && !examCompleted && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setExamCompleted(true);
            handleExamSubmit(true); // Auto-submit when time is up
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [examStarted, examCompleted, timeRemaining]);

  const startExam = async () => {
    try {
      setLoading(true);
      const response = await API.post('/api/exams/start', {
        examType,
        topicId: topicId || null
      });

      setExamId(response.data.examId);
      setExamQuestions(response.data.questions);
      setTimeRemaining(response.data.duration);
      setStartTime(new Date(response.data.startTime));
      
    } catch (error) {
      console.error('Failed to start exam:', error);
      alert(language === 'es' ? 'Error al iniciar el examen' : 'Failed to start exam');
      onNavigate('dashboard');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getExamTitle = () => {
    if (examType === 'practice') return t.practiceExam;
    if (examType === 'full') return t.fullExam;
    if (examType === 'topic' && topicId) {
      const topic = examTopics.find(t => t.id === topicId);
      return `${t.topicExam}: ${topic?.name[language]}`;
    }
    return '';
  };

  const getExamConfig = () => {
    const configs = {
      practice: { questions: 8, minutes: 30 },
      full: { questions: 20, minutes: 60 },
      topic: { questions: 10, minutes: 10 }
    };
    return configs[examType] || { questions: 10, minutes: 10 };
  };

  const handleAnswerSelect = (answerIndex) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion]: answerIndex
    }));
  };

  const handleFlagToggle = () => {
    setFlaggedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(currentQuestion)) {
        newSet.delete(currentQuestion);
      } else {
        newSet.add(currentQuestion);
      }
      return newSet;
    });
  };

  const handleExamSubmit = async (autoSubmit = false) => {
    console.log('🚀 handleExamSubmit called', { autoSubmit, examId, answers, timeSpent: startTime ? Math.floor((new Date() - startTime) / 1000) : 0 });
    
    if (!autoSubmit) {
      // Use a simple confirmation without blocking
      const confirmSubmit = confirm(t.confirmSubmit);
      console.log('✅ Confirmation result:', confirmSubmit);
      if (!confirmSubmit) {
        console.log('❌ User cancelled confirmation dialog');
        return;
      }
    }

    console.log('✅ Proceeding with submission');

    try {
      setLoading(true);
      
      // Calculate time spent
      const timeSpent = startTime ? Math.floor((new Date() - startTime) / 1000) : 0;
      
      console.log('📡 Sending API request with:', { examId, answers, timeSpent });
      
      const response = await API.post('/api/exams/submit', {
        examId,
        answers,
        timeSpent
      });

      console.log('✅ API response received:', response.data);

      setExamCompleted(true);
      setShowResults(response.data);
      
    } catch (error) {
      console.error('❌ Failed to submit exam:', error);
      alert(language === 'es' ? 'Error al enviar el examen' : 'Failed to submit exam');
    } finally {
      setLoading(false);
    }
  };

  const handleRetake = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setExamStarted(false);
    setExamCompleted(false);
    setShowResults(false);
    setFlaggedQuestions(new Set());
    setExamId(null);
    setStartTime(null);
  };

  // Pre-exam instructions
  if (!examStarted) {
    const config = getExamConfig();
    
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">
              {getExamTitle()}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {config.questions}
                </div>
                <div className="text-sm text-blue-700">
                  {language === 'es' ? 'Preguntas' : 'Questions'}
                </div>
              </div>
              <div className="p-4 bg-emerald-50 rounded-lg">
                <div className="text-2xl font-bold text-emerald-600">
                  {config.minutes}
                </div>
                <div className="text-sm text-emerald-700">
                  {t.minutes}
                </div>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">70%</div>
                <div className="text-sm text-purple-700">
                  {language === 'es' ? 'Puntaje mínimo' : 'Passing score'}
                </div>
              </div>
            </div>

            <Card className="bg-yellow-50 border-yellow-200">
              <CardHeader>
                <CardTitle className="text-lg text-yellow-800 flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5" />
                  <span>{t.instructions}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-yellow-700">
                  {t.examInstructions.map((instruction, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-yellow-600 mt-1">•</span>
                      <span>{instruction}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <div className="flex justify-center space-x-4">
              <Button
                variant="outline"
                onClick={() => onNavigate('dashboard')}
                className="border-gray-300 hover:bg-gray-50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {language === 'es' ? 'Cancelar' : 'Cancel'}
              </Button>
              <Button
                onClick={() => setExamStarted(true)}
                disabled={loading}
                className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t.loading}
                  </>
                ) : (
                  <>
                    {t.startExam}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Results page
  if (examCompleted && showResults) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">
              {t.examComplete}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Score Display */}
            <div className="text-center">
              <div className={`text-6xl font-bold mb-2 ${
                showResults.score >= 85 ? 'text-emerald-600' :
                showResults.score >= 70 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {showResults.score}%
              </div>
              <div className="text-gray-600">{t.yourScore}</div>
            </div>

            {/* Results Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-emerald-50 rounded-lg">
                <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-emerald-600">
                  {showResults.correct}
                </div>
                <div className="text-sm text-emerald-700">{t.correct}</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-red-600">
                  {showResults.incorrect}
                </div>
                <div className="text-sm text-red-700">{t.incorrect}</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {showResults.total}
                </div>
                <div className="text-sm text-blue-700">
                  {language === 'es' ? 'Total' : 'Total'}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex justify-center space-x-4">
              <Button
                variant="outline"
                onClick={handleRetake}
                className="border-emerald-300 hover:bg-emerald-50"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                {t.retakeExam}
              </Button>
              <Button
                onClick={() => onNavigate('dashboard')}
                className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
              >
                <Home className="w-4 h-4 mr-2" />
                {t.backToHome}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state
  if (loading || examQuestions.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-emerald-600" />
            <p className="text-gray-600">{t.loading}</p>
          </div>
        </div>
      </div>
    );
  }

  // Main exam interface
  if (examStarted && examQuestions.length > 0) {
    const question = examQuestions[currentQuestion];
    
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header with timer and progress */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  {t.question} {currentQuestion + 1} {t.of} {examQuestions.length}
                </Badge>
                {flaggedQuestions.has(currentQuestion) && (
                  <Badge className="bg-yellow-100 text-yellow-800">
                    <Flag className="w-3 h-3 mr-1" />
                    {language === 'es' ? 'Marcada' : 'Flagged'}
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center space-x-4">
                <div className={`flex items-center space-x-2 ${
                  timeRemaining < 300 ? 'text-red-600' : 'text-gray-600'
                }`}>
                  <Clock className="w-4 h-4" />
                  <span className="font-mono text-lg font-bold">
                    {formatTime(timeRemaining)}
                  </span>
                </div>
              </div>
            </div>
            
            <Progress 
              value={((currentQuestion + 1) / examQuestions.length) * 100} 
              className="mt-3"
            />
          </CardContent>
        </Card>

        {/* Question Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">
              {question.question[language]}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {question.type === 'multiple_choice' ? (
              <div className="space-y-3">
                {question.options[language].map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(index)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                      answers[currentQuestion] === index
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                        : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-5 h-5 rounded-full border-2 ${
                        answers[currentQuestion] === index
                          ? 'border-emerald-500 bg-emerald-500'
                          : 'border-gray-300'
                      } flex items-center justify-center`}>
                        {answers[currentQuestion] === index && (
                          <div className="w-2 h-2 rounded-full bg-white" />
                        )}
                      </div>
                      <span className="font-medium">{String.fromCharCode(65 + index)}.</span>
                      <span>{option}</span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {[
                  { text: language === 'es' ? 'Verdadero' : 'True', value: 0 },
                  { text: language === 'es' ? 'Falso' : 'False', value: 1 }
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleAnswerSelect(option.value)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                      answers[currentQuestion] === option.value
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
                        : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-5 h-5 rounded-full border-2 ${
                        answers[currentQuestion] === option.value
                          ? 'border-emerald-500 bg-emerald-500'
                          : 'border-gray-300'
                      } flex items-center justify-center`}>
                        {answers[currentQuestion] === option.value && (
                          <div className="w-2 h-2 rounded-full bg-white" />
                        )}
                      </div>
                      <span>{option.text}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
                  disabled={currentQuestion === 0}
                  className="border-gray-300 hover:bg-gray-50"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t.previous}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleFlagToggle}
                  className={`${
                    flaggedQuestions.has(currentQuestion)
                      ? 'border-yellow-400 bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <Flag className="w-4 h-4 mr-2" />
                  {flaggedQuestions.has(currentQuestion) ? t.unflag : t.flag}
                </Button>
              </div>

              <div className="flex space-x-3">
                {currentQuestion === examQuestions.length - 1 ? (
                  <Button
                    onClick={() => handleExamSubmit()}
                    disabled={loading}
                    className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {language === 'es' ? 'Enviando...' : 'Submitting...'}
                      </>
                    ) : (
                      t.submit
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={() => setCurrentQuestion(prev => Math.min(examQuestions.length - 1, prev + 1))}
                    className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
                  >
                    {t.next}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
};

export default ExamInterface;