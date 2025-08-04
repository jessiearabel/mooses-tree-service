import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { examTopics } from '../data/mock';
import { 
  BookOpen, 
  Clock, 
  Target, 
  TrendingUp, 
  Award, 
  BarChart3,
  PlayCircle,
  FileText,
  Loader2,
  UserPlus
} from 'lucide-react';

const Dashboard = ({ onNavigate }) => {
  const { user, language, API } = useAuth();
  const [progress, setProgress] = useState(null);
  const [examHistory, setExamHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      // Fetch user progress
      const progressResponse = await API.get('/api/users/progress');
      setProgress(progressResponse.data);
      
      // Fetch exam history
      const historyResponse = await API.get('/api/exams/history');
      setExamHistory(historyResponse.data.exams);
      
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const texts = {
    es: {
      welcome: "Bienvenido de vuelta",
      progress: "Tu Progreso de Estudio",
      questionsCompleted: "Preguntas Completadas",
      averageScore: "Puntuación Promedio",
      timeSpent: "Tiempo de Estudio",
      quickActions: "Acciones Rápidas",
      startPractice: "Examen de Práctica",
      studyByTopic: "Estudiar por Tema",
      fullExam: "Examen Completo",
      viewProgress: "Ver Progreso Detallado",
      addStudent: "Agregar Estudiante",
      recentActivity: "Actividad Reciente",
      topicPerformance: "Rendimiento por Tema",
      examResults: "Resultados de Exámenes",
      practiceExam: "Examen de Práctica",
      topicExam: "Examen por Tema",
      score: "Puntuación",
      questions: "preguntas",
      minutes: "minutos",
      hours: "horas",
      loading: "Cargando..."
    },
    en: {
      welcome: "Welcome back",
      progress: "Your Study Progress",
      questionsCompleted: "Questions Completed",
      averageScore: "Average Score",
      timeSpent: "Study Time",
      quickActions: "Quick Actions",
      startPractice: "Practice Exam",
      studyByTopic: "Study by Topic",
      fullExam: "Full Exam",
      viewProgress: "View Detailed Progress",
      addStudent: "Add Student",
      recentActivity: "Recent Activity",
      topicPerformance: "Topic Performance", 
      examResults: "Exam Results",
      practiceExam: "Practice Exam",
      topicExam: "Topic Exam",
      score: "Score",
      questions: "questions",
      minutes: "minutes", 
      hours: "hours",
      loading: "Loading..."
    }
  };

  const t = texts[language];

  const getTopicName = (topicId) => {
    const topic = examTopics.find(t => t.id === topicId);
    return topic ? topic.name[language] : '';
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours} ${t.hours} ${minutes} ${t.minutes}`;
    }
    return `${minutes} ${t.minutes}`;
  };

  const getScoreColor = (score) => {
    if (score >= 85) return "text-emerald-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadgeColor = (score) => {
    if (score >= 85) return "bg-emerald-100 text-emerald-800";
    if (score >= 70) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-emerald-600" />
          <p className="text-gray-600">{t.loading}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-emerald-600 to-green-600 rounded-2xl text-white p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {t.welcome}, {user?.name}!
            </h1>
            <p className="text-emerald-100 text-lg">
              {t.progress}
            </p>
          </div>
          <Award className="w-16 h-16 text-emerald-200" />
        </div>
      </div>

      {/* Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">
              {t.questionsCompleted}
            </CardTitle>
            <BookOpen className="w-5 h-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">
              {progress?.completedQuestions || 0}/{progress?.totalQuestions || 100}
            </div>
            <Progress 
              value={((progress?.completedQuestions || 0) / (progress?.totalQuestions || 100)) * 100} 
              className="mt-2"
            />
            <p className="text-xs text-blue-600 mt-2">
              {Math.round(((progress?.completedQuestions || 0) / (progress?.totalQuestions || 100)) * 100)}% completado
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-700">
              {t.averageScore}
            </CardTitle>
            <Target className="w-5 h-5 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getScoreColor(progress?.averageScore || 0)}`}>
              {progress?.averageScore || 0}%
            </div>
            <Progress value={progress?.averageScore || 0} className="mt-2" />
            <p className="text-xs text-emerald-600 mt-2">
              {(progress?.averageScore || 0) >= 70 ? 
                (language === 'es' ? 'Buen rendimiento' : 'Good performance') :
                (language === 'es' ? 'Necesita mejorar' : 'Needs improvement')
              }
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">
              {t.timeSpent}
            </CardTitle>
            <Clock className="w-5 h-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">
              12.5h
            </div>
            <p className="text-xs text-purple-600 mt-2">
              {language === 'es' ? 'Esta semana' : 'This week'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <PlayCircle className="w-5 h-5 text-emerald-600" />
            <span>{t.quickActions}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button
              onClick={() => onNavigate('practice-exam')}
              className="h-auto p-4 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
            >
              <div className="text-center">
                <FileText className="w-8 h-8 mx-auto mb-2" />
                <div className="font-medium">{t.startPractice}</div>
                <div className="text-xs opacity-90">8 {t.questions}, 30 {t.minutes}</div>
              </div>
            </Button>
            
            <Button
              onClick={() => onNavigate('topics')}
              variant="outline"
              className="h-auto p-4 border-emerald-300 hover:bg-emerald-50"
            >
              <div className="text-center">
                <BookOpen className="w-8 h-8 mx-auto mb-2 text-emerald-600" />
                <div className="font-medium text-emerald-700">{t.studyByTopic}</div>
                <div className="text-xs text-emerald-600">10 {language === 'es' ? 'temas' : 'topics'}</div>
              </div>
            </Button>
            
            <Button
              onClick={() => onNavigate('full-exam')}
              variant="outline" 
              className="h-auto p-4 border-blue-300 hover:bg-blue-50"
            >
              <div className="text-center">
                <Award className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <div className="font-medium text-blue-700">{t.fullExam}</div>
                <div className="text-xs text-blue-600">20 {t.questions}, 60 {t.minutes}</div>
              </div>
            </Button>
            
            <Button
              onClick={() => onNavigate('progress')}
              variant="outline"
              className="h-auto p-4 border-purple-300 hover:bg-purple-50"
            >
              <div className="text-center">
                <BarChart3 className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                <div className="font-medium text-purple-700">{t.viewProgress}</div>
                <div className="text-xs text-purple-600">{language === 'es' ? 'Estadísticas' : 'Statistics'}</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Topic Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              <span>{t.topicPerformance}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {examTopics.slice(0, 5).map((topic) => {
              const score = progress?.topicScores?.[topic.id.toString()] || 0;
              return (
                <div key={topic.id} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      {topic.name[language]}
                    </div>
                    <Progress value={score} className="mt-1 h-2" />
                  </div>
                  <Badge className={`ml-4 ${getScoreBadgeColor(score)}`}>
                    {score}%
                  </Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-emerald-600" />
              <span>{t.recentActivity}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {examHistory.slice(0, 5).map((result) => (
                <div key={result.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">
                      {result.examType === 'practice' ? t.practiceExam : 
                       result.topicId ? `${t.topicExam}: ${getTopicName(result.topicId)}` : t.fullExam}
                    </div>
                    <div className="text-sm text-gray-600">
                      {result.correctAnswers}/{result.totalQuestions} {t.questions} • {formatTime(result.timeSpent)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(result.completedAt).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US')}
                    </div>
                  </div>
                  <Badge className={getScoreBadgeColor(result.score)}>
                    {result.score}%
                  </Badge>
                </div>
              ))}
              {examHistory.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>{language === 'es' ? 'No hay actividad reciente' : 'No recent activity'}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;