import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { examTopics } from '../data/mock';
import { BookOpen, Play, Clock, Target, TrendingUp, Loader2 } from 'lucide-react';

const Topics = ({ onNavigate }) => {
  const { user, language, API } = useAuth();
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProgress();
  }, []);

  const fetchProgress = async () => {
    try {
      const response = await API.get('/api/users/progress');
      setProgress(response.data);
    } catch (error) {
      console.error('Failed to fetch progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const texts = {
    es: {
      title: "Estudiar por Tema",
      subtitle: "Selecciona un tema específico para practicar",
      weight: "Peso en examen",
      progress: "Tu progreso",
      startPractice: "Practicar Tema",
      questions: "preguntas",
      backToDashboard: "Volver al Panel",
      performance: "Rendimiento",
      notStarted: "No iniciado",
      needsWork: "Necesita trabajo",
      good: "Bien",
      excellent: "Excelente",
      loading: "Cargando..."
    },
    en: {
      title: "Study by Topic", 
      subtitle: "Select a specific topic to practice",
      weight: "Exam weight",
      progress: "Your progress",
      startPractice: "Practice Topic",
      questions: "questions",
      backToDashboard: "Back to Dashboard",
      performance: "Performance",
      notStarted: "Not started",
      needsWork: "Needs work",
      good: "Good",
      excellent: "Excellent",
      loading: "Loading..."
    }
  };

  const t = texts[language];

  const getPerformanceLevel = (score) => {
    if (score === 0) return { text: t.notStarted, color: "bg-gray-100 text-gray-800" };
    if (score < 60) return { text: t.needsWork, color: "bg-red-100 text-red-800" };
    if (score < 85) return { text: t.good, color: "bg-yellow-100 text-yellow-800" };
    return { text: t.excellent, color: "bg-emerald-100 text-emerald-800" };
  };

  const getProgressColor = (score) => {
    if (score >= 85) return "bg-emerald-500";
    if (score >= 70) return "bg-yellow-500";
    if (score >= 60) return "bg-orange-500";
    return "bg-red-500";
  };

  const handleTopicStart = (topicId) => {
    onNavigate('topic-exam', { topicId });
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
          {t.backToDashboard}
        </Button>
      </div>

      {/* Topics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {examTopics.map((topic) => {
          const userScore = progress?.topicScores?.[topic.id.toString()] || 0;
          const performance = getPerformanceLevel(userScore);
          
          return (
            <Card 
              key={topic.id}
              className="hover:shadow-lg transition-all duration-200 group hover:scale-105"
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">
                      {topic.name[language]}
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-600 mt-2 line-clamp-3">
                      {topic.description[language]}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    {topic.weight}%
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-4">
                  {/* Progress Section */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">{t.progress}</span>
                      <span className={`text-sm font-bold ${userScore >= 85 ? 'text-emerald-600' : 
                                                            userScore >= 70 ? 'text-yellow-600' : 
                                                            userScore > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                        {userScore}%
                      </span>
                    </div>
                    <div className="relative">
                      <Progress value={userScore} className="h-2" />
                      <div 
                        className={`absolute top-0 left-0 h-2 rounded-full transition-all duration-300 ${getProgressColor(userScore)}`}
                        style={{ width: `${userScore}%` }}
                      />
                    </div>
                  </div>

                  {/* Performance Badge */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">{t.performance}:</span>
                    </div>
                    <Badge className={performance.color}>
                      {performance.text}
                    </Badge>
                  </div>

                  {/* Exam Info */}
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <BookOpen className="w-4 h-4" />
                        <span>10 {t.questions}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>10 min</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <Button 
                    onClick={() => handleTopicStart(topic.id)}
                    className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-medium transition-all duration-200"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {t.startPractice}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Study Tips */}
      <Card className="bg-gradient-to-r from-blue-50 to-emerald-50 border-emerald-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-emerald-800">
            <Target className="w-5 h-5" />
            <span>{language === 'es' ? 'Consejos de Estudio' : 'Study Tips'}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-emerald-700">
            <div>
              <h4 className="font-semibold mb-2">
                {language === 'es' ? 'Estrategia Recomendada:' : 'Recommended Strategy:'}
              </h4>
              <ul className="space-y-1">
                <li>• {language === 'es' ? 'Enfócate en temas con mayor peso' : 'Focus on topics with higher weight'}</li>
                <li>• {language === 'es' ? 'Practica temas débiles más frecuentemente' : 'Practice weak topics more frequently'}</li>
                <li>• {language === 'es' ? 'Revisa explicaciones después de cada pregunta' : 'Review explanations after each question'}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">
                {language === 'es' ? 'Meta de Puntuación:' : 'Score Target:'}
              </h4>
              <ul className="space-y-1">
                <li>• {language === 'es' ? 'Objetivo mínimo: 70%' : 'Minimum target: 70%'}</li>
                <li>• {language === 'es' ? 'Objetivo ideal: 85%+' : 'Ideal target: 85%+'}</li>
                <li>• {language === 'es' ? 'Tiempo promedio: 1 min/pregunta' : 'Average time: 1 min/question'}</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Topics;