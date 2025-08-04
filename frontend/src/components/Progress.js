import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { examTopics, mockExamResults } from '../data/mock';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Target, 
  Award,
  Calendar,
  CheckCircle,
  XCircle,
  ArrowLeft
} from 'lucide-react';

const ProgressPage = ({ onNavigate }) => {
  const { user, language } = useAuth();

  const texts = {
    es: {
      title: "Progreso Detallado",
      subtitle: "Analiza tu rendimiento y progreso de estudio",
      overallProgress: "Progreso General",
      questionsCompleted: "Preguntas Completadas",
      averageScore: "Puntuación Promedio",
      studyTime: "Tiempo de Estudio",
      topicBreakdown: "Desglose por Tema",
      recentExams: "Exámenes Recientes",
      weakTopics: "Temas a Reforzar",
      strongTopics: "Temas Dominados",
      recommendations: "Recomendaciones",
      backToDashboard: "Volver al Panel",
      score: "Puntuación",
      questions: "preguntas",
      correct: "Correctas",
      incorrect: "Incorrectas",
      practiceExam: "Examen de Práctica",
      topicExam: "Examen por Tema",
      fullExam: "Examen Completo",
      minutes: "min",
      hours: "h",
      days: "días",
      needsImprovement: "Necesita mejora",
      good: "Bien",
      excellent: "Excelente",
      recommendations_list: [
        "Enfócate en los temas con puntuación inferior al 70%",
        "Practica más preguntas de 'Prácticas de Trabajo Seguras'",
        "Revisa conceptos de 'Biología del Árbol'",
        "Toma un examen de práctica completo semanalmente"
      ]
    },
    en: {
      title: "Detailed Progress",
      subtitle: "Analyze your performance and study progress",
      overallProgress: "Overall Progress",
      questionsCompleted: "Questions Completed",
      averageScore: "Average Score",
      studyTime: "Study Time",
      topicBreakdown: "Topic Breakdown",
      recentExams: "Recent Exams",
      weakTopics: "Topics to Strengthen", 
      strongTopics: "Mastered Topics",
      recommendations: "Recommendations",
      backToDashboard: "Back to Dashboard",
      score: "Score",
      questions: "questions",
      correct: "Correct",
      incorrect: "Incorrect",
      practiceExam: "Practice Exam",
      topicExam: "Topic Exam",
      fullExam: "Full Exam",
      minutes: "min",
      hours: "h",
      days: "days",
      needsImprovement: "Needs improvement",
      good: "Good",
      excellent: "Excellent",
      recommendations_list: [
        "Focus on topics with scores below 70%",
        "Practice more 'Safe Work Practices' questions",
        "Review 'Tree Biology' concepts",
        "Take a full practice exam weekly"
      ]
    }
  };

  const t = texts[language];

  const getTopicName = (topicId) => {
    const topic = examTopics.find(t => t.id === topicId);
    return topic ? topic.name[language] : '';
  };

  const getPerformanceLevel = (score) => {
    if (score >= 85) return { text: t.excellent, color: "bg-emerald-100 text-emerald-800" };
    if (score >= 70) return { text: t.good, color: "bg-yellow-100 text-yellow-800" };
    return { text: t.needsImprovement, color: "bg-red-100 text-red-800" };
  };

  const getScoreColor = (score) => {
    if (score >= 85) return "text-emerald-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
  };

  const formatExamDate = (date) => {
    return date.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const weakTopics = examTopics
    .filter(topic => (user.progress.topicScores[topic.id] || 0) < 70)
    .sort((a, b) => (user.progress.topicScores[a.id] || 0) - (user.progress.topicScores[b.id] || 0));

  const strongTopics = examTopics
    .filter(topic => (user.progress.topicScores[topic.id] || 0) >= 85)
    .sort((a, b) => (user.progress.topicScores[b.id] || 0) - (user.progress.topicScores[a.id] || 0));

  const userExamResults = mockExamResults.filter(result => result.userId === user.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t.title}</h1>
          <p className="text-gray-600 mt-1">{t.subtitle}</p>
        </div>
        <Button 
          variant="outline"
          onClick={() => onNavigate('dashboard')}
          className="border-emerald-300 hover:bg-emerald-50"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t.backToDashboard}
        </Button>
      </div>

      {/* Overall Progress Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">
              {t.questionsCompleted}
            </CardTitle>
            <CheckCircle className="w-5 h-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">
              {user.progress.completedQuestions}
            </div>
            <div className="text-xs text-blue-600">
              {language === 'es' ? 'de' : 'of'} {user.progress.totalQuestions} {t.questions}
            </div>
            <Progress 
              value={(user.progress.completedQuestions / user.progress.totalQuestions) * 100} 
              className="mt-2 h-2"
            />
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
            <div className={`text-2xl font-bold ${getScoreColor(user.progress.averageScore)}`}>
              {user.progress.averageScore}%
            </div>
            <div className="text-xs text-emerald-600">
              {language === 'es' ? 'Meta: 85%' : 'Target: 85%'}
            </div>
            <Progress value={user.progress.averageScore} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">
              {t.studyTime}
            </CardTitle>
            <Clock className="w-5 h-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">
              24.5{t.hours}
            </div>
            <div className="text-xs text-purple-600">
              {language === 'es' ? 'Total acumulado' : 'Total accumulated'}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">
              {language === 'es' ? 'Exámenes Tomados' : 'Exams Taken'}
            </CardTitle>
            <Award className="w-5 h-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">
              {userExamResults.length}
            </div>
            <div className="text-xs text-orange-600">
              {language === 'es' ? 'Último: hace 2 días' : 'Last: 2 days ago'}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Topic Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-emerald-600" />
              <span>{t.topicBreakdown}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {examTopics.map((topic) => {
              const score = user.progress.topicScores[topic.id] || 0;
              const performance = getPerformanceLevel(score);
              return (
                <div key={topic.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 text-sm">
                        {topic.name[language]}
                      </div>
                      <div className="text-xs text-gray-500">
                        {language === 'es' ? 'Peso' : 'Weight'}: {topic.weight}%
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={performance.color}>
                        {score}%
                      </Badge>
                    </div>
                  </div>
                  <Progress value={score} className="h-2" />
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Recent Exams */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-emerald-600" />
              <span>{t.recentExams}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {userExamResults.slice(0, 6).map((result) => (
                <div key={result.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {result.examType === 'practice' ? t.practiceExam : 
                       result.topicId ? `${t.topicExam}: ${getTopicName(result.topicId)}` : t.fullExam}
                    </div>
                    <div className="text-sm text-gray-600">
                      {result.correctAnswers}/{result.totalQuestions} {t.correct} • {Math.floor(result.timeSpent / 60)} {t.minutes}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatExamDate(result.completedAt)}
                    </div>
                  </div>
                  <Badge className={`${getScoreColor(result.score) === 'text-emerald-600' ? 'bg-emerald-100 text-emerald-800' : 
                                     getScoreColor(result.score) === 'text-yellow-600' ? 'bg-yellow-100 text-yellow-800' : 
                                     'bg-red-100 text-red-800'}`}>
                    {result.score}%
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weak Topics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-red-700">
              <XCircle className="w-5 h-5" />
              <span>{t.weakTopics}</span>
            </CardTitle>
            <CardDescription>
              {language === 'es' 
                ? 'Temas que requieren más atención y práctica'
                : 'Topics that need more attention and practice'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {weakTopics.length > 0 ? (
              <div className="space-y-3">
                {weakTopics.slice(0, 5).map((topic) => {
                  const score = user.progress.topicScores[topic.id] || 0;
                  return (
                    <div key={topic.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-red-900">
                          {topic.name[language]}
                        </div>
                        <div className="text-sm text-red-700">
                          {language === 'es' ? 'Peso del examen' : 'Exam weight'}: {topic.weight}%
                        </div>
                      </div>
                      <Badge className="bg-red-100 text-red-800">
                        {score}%
                      </Badge>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-2 text-emerald-500" />
                <p>{language === 'es' ? '¡Excelente! No tienes temas débiles' : 'Excellent! No weak topics'}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-emerald-700">
              <TrendingUp className="w-5 h-5" />
              <span>{t.recommendations}</span>
            </CardTitle>
            <CardDescription>
              {language === 'es' 
                ? 'Sugerencias personalizadas para mejorar tu rendimiento'
                : 'Personalized suggestions to improve your performance'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {t.recommendations_list.map((recommendation, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-emerald-50 rounded-lg">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white text-sm flex items-center justify-center font-bold mt-0.5">
                    {index + 1}
                  </div>
                  <div className="flex-1 text-sm text-emerald-800">
                    {recommendation}
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="mt-4 pt-4 border-t border-emerald-200">
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={() => onNavigate('topics')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {language === 'es' ? 'Practicar por Tema' : 'Practice by Topic'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onNavigate('practice-exam')}
                  className="border-emerald-300 hover:bg-emerald-50"
                >
                  {language === 'es' ? 'Examen de Práctica' : 'Practice Exam'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProgressPage;