import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { 
  FileText, 
  Plus, 
  Trash2, 
  ArrowLeft, 
  Loader2,
  Search,
  Filter,
  Edit2,
  Eye,
  Globe
} from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Topic names mapping
const TOPIC_NAMES = {
  1: { es: "Biología de Árboles", en: "Tree Biology" },
  2: { es: "Identificación de Especies", en: "Species Identification" },
  3: { es: "Diagnóstico y Tratamiento", en: "Diagnosis and Treatment" },
  4: { es: "Poda y Mantenimiento", en: "Pruning and Maintenance" },
  5: { es: "Seguridad en el Trabajo", en: "Safety Procedures" }
};

const AdminQuestions = ({ adminPassword, onBack }) => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [formData, setFormData] = useState({
    topicId: 1,
    type: 'multiple-choice',
    question: { es: '', en: '' },
    options: ['', '', '', ''],
    correctAnswer: 0,
    explanation: { es: '', en: '' },
    difficulty: 'medium'
  });
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, [selectedTopic]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      setError('');
      const params = { admin_password: adminPassword };
      if (selectedTopic) {
        params.topic_id = parseInt(selectedTopic);
      }
      
      const response = await axios.get(`${BACKEND_URL}/api/admin/questions`, { params });
      setQuestions(response.data.questions);
    } catch (error) {
      console.error('Error fetching questions:', error);
      setError('Error al cargar las preguntas');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      topicId: 1,
      type: 'multiple-choice',
      question: { es: '', en: '' },
      options: ['', '', '', ''],
      correctAnswer: 0,
      explanation: { es: '', en: '' },
      difficulty: 'medium'
    });
    setEditingQuestion(null);
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    
    if (!formData.question.es || !formData.question.en) {
      setError('La pregunta en ambos idiomas es requerida');
      return;
    }

    if (!formData.explanation.es || !formData.explanation.en) {
      setError('La explicación en ambos idiomas es requerida');
      return;
    }

    if (formData.type === 'multiple-choice') {
      if (formData.options.some(opt => !opt.trim())) {
        setError('Todas las opciones son requeridas para preguntas de opción múltiple');
        return;
      }
    }

    try {
      setFormLoading(true);
      setError('');
      setSuccess('');

      const questionData = { ...formData };
      
      // For true/false questions, set standard options
      if (formData.type === 'true-false') {
        questionData.options = ['Verdadero / True', 'Falso / False'];
      }

      await axios.post(`${BACKEND_URL}/api/admin/questions`, questionData, {
        params: { admin_password: adminPassword }
      });

      setSuccess('Pregunta creada exitosamente');
      resetForm();
      setShowAddForm(false);
      fetchQuestions();
    } catch (error) {
      console.error('Error creating question:', error);
      const errorMessage = error.response?.data?.detail || 'Error al crear la pregunta';
      setError(errorMessage);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta pregunta?')) {
      return;
    }

    try {
      setError('');
      setSuccess('');
      await axios.delete(`${BACKEND_URL}/api/admin/questions/${questionId}`, {
        params: { admin_password: adminPassword }
      });
      
      setSuccess('Pregunta eliminada exitosamente');
      fetchQuestions();
    } catch (error) {
      console.error('Error deleting question:', error);
      const errorMessage = error.response?.data?.detail || 'Error al eliminar la pregunta';
      setError(errorMessage);
    }
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({...formData, options: newOptions});
  };

  const filteredQuestions = questions.filter(question =>
    question.question.es.toLowerCase().includes(searchTerm.toLowerCase()) ||
    question.question.en.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={onBack}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver</span>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Preguntas</h1>
            <p className="text-gray-600">Administra las preguntas del banco de examenes</p>
          </div>
        </div>
        
        <Button
          onClick={() => setShowAddForm(true)}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Agregar Pregunta
        </Button>
      </div>

      {/* Messages */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-700">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <AlertDescription className="text-green-700">{success}</AlertDescription>
        </Alert>
      )}

      {/* Add/Edit Question Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plus className="w-5 h-5" />
              <span>{editingQuestion ? 'Editar Pregunta' : 'Agregar Nueva Pregunta'}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddQuestion} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="topicId">Tema</Label>
                  <select
                    id="topicId"
                    value={formData.topicId}
                    onChange={(e) => setFormData({...formData, topicId: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    {Object.entries(TOPIC_NAMES).map(([id, name]) => (
                      <option key={id} value={id}>{id}. {name.es}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="type">Tipo de Pregunta</Label>
                  <select
                    id="type"
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="multiple-choice">Opción Múltiple</option>
                    <option value="true-false">Verdadero/Falso</option>
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="difficulty">Dificultad</Label>
                  <select
                    id="difficulty"
                    value={formData.difficulty}
                    onChange={(e) => setFormData({...formData, difficulty: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="easy">Fácil</option>
                    <option value="medium">Medio</option>
                    <option value="hard">Difícil</option>
                  </select>
                </div>
              </div>

              {/* Question Text */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="questionEs">Pregunta (Español)</Label>
                  <Textarea
                    id="questionEs"
                    value={formData.question.es}
                    onChange={(e) => setFormData({
                      ...formData, 
                      question: {...formData.question, es: e.target.value}
                    })}
                    placeholder="Escribe la pregunta en español..."
                    rows={3}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="questionEn">Pregunta (English)</Label>
                  <Textarea
                    id="questionEn"
                    value={formData.question.en}
                    onChange={(e) => setFormData({
                      ...formData, 
                      question: {...formData.question, en: e.target.value}
                    })}
                    placeholder="Write the question in English..."
                    rows={3}
                    required
                  />
                </div>
              </div>

              {/* Options (only for multiple choice) */}
              {formData.type === 'multiple-choice' && (
                <div>
                  <Label>Opciones de Respuesta</Label>
                  <div className="space-y-2">
                    {formData.options.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="flex items-center">
                          <input
                            type="radio"
                            name="correctAnswer"
                            checked={formData.correctAnswer === index}
                            onChange={() => setFormData({...formData, correctAnswer: index})}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-700">Opción {index + 1}:</span>
                        </div>
                        <Input
                          value={option}
                          onChange={(e) => handleOptionChange(index, e.target.value)}
                          placeholder={`Opción ${index + 1}`}
                          required
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    Selecciona el radio button de la opción correcta
                  </p>
                </div>
              )}

              {/* Correct Answer for True/False */}
              {formData.type === 'true-false' && (
                <div>
                  <Label>Respuesta Correcta</Label>
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="correctAnswer"
                        checked={formData.correctAnswer === 0}
                        onChange={() => setFormData({...formData, correctAnswer: 0})}
                        className="mr-2"
                      />
                      Verdadero / True
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="correctAnswer"
                        checked={formData.correctAnswer === 1}
                        onChange={() => setFormData({...formData, correctAnswer: 1})}
                        className="mr-2"
                      />
                      Falso / False
                    </label>
                  </div>
                </div>
              )}

              {/* Explanation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="explanationEs">Explicación (Español)</Label>
                  <Textarea
                    id="explanationEs"
                    value={formData.explanation.es}
                    onChange={(e) => setFormData({
                      ...formData, 
                      explanation: {...formData.explanation, es: e.target.value}
                    })}
                    placeholder="Explica por qué esta es la respuesta correcta..."
                    rows={3}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="explanationEn">Explicación (English)</Label>
                  <Textarea
                    id="explanationEn"
                    value={formData.explanation.en}
                    onChange={(e) => setFormData({
                      ...formData, 
                      explanation: {...formData.explanation, en: e.target.value}
                    })}
                    placeholder="Explain why this is the correct answer..."
                    rows={3}
                    required
                  />
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button
                  type="submit"
                  disabled={formLoading}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {formLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {editingQuestion ? 'Guardando...' : 'Creando...'}
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      {editingQuestion ? 'Guardar Cambios' : 'Crear Pregunta'}
                    </>
                  )}
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false);
                    resetForm();
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Buscar preguntas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="">Todos los temas</option>
                {Object.entries(TOPIC_NAMES).map(([id, name]) => (
                  <option key={id} value={id}>{id}. {name.es}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questions List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Preguntas ({filteredQuestions.length})</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? 'No se encontraron preguntas' : 'No hay preguntas registradas'}
            </div>
          ) : (
            <div className="space-y-6">
              {filteredQuestions.map((question) => (
                <div
                  key={question.id}
                  className="border border-gray-200 rounded-lg p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <Badge className="bg-emerald-100 text-emerald-800">
                        Tema {question.topicId}
                      </Badge>
                      <Badge className={
                        question.type === 'multiple-choice' 
                          ? "bg-blue-100 text-blue-800" 
                          : "bg-purple-100 text-purple-800"
                      }>
                        {question.type === 'multiple-choice' ? 'Opción Múltiple' : 'V/F'}
                      </Badge>
                      <Badge className={
                        question.difficulty === 'easy' ? "bg-green-100 text-green-800" :
                        question.difficulty === 'medium' ? "bg-yellow-100 text-yellow-800" :
                        "bg-red-100 text-red-800"
                      }>
                        {question.difficulty === 'easy' ? 'Fácil' : 
                         question.difficulty === 'medium' ? 'Medio' : 'Difícil'}
                      </Badge>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteQuestion(question.id)}
                      className="border-red-300 text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2 flex items-center">
                        <span className="mr-2">🇪🇸</span>
                        Pregunta (Español)
                      </h3>
                      <p className="text-gray-700 mb-3">{question.question.es}</p>
                      
                      <h4 className="font-medium text-gray-900 mb-2">Explicación:</h4>
                      <p className="text-sm text-gray-600">{question.explanation.es}</p>
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2 flex items-center">
                        <span className="mr-2">🇺🇸</span>
                        Question (English)
                      </h3>
                      <p className="text-gray-700 mb-3">{question.question.en}</p>
                      
                      <h4 className="font-medium text-gray-900 mb-2">Explanation:</h4>
                      <p className="text-sm text-gray-600">{question.explanation.en}</p>
                    </div>
                  </div>
                  
                  {question.options && Array.isArray(question.options) && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Opciones:</h4>
                      <div className="space-y-1">
                        {question.options.map((option, index) => (
                          <div 
                            key={index} 
                            className={`flex items-center p-2 rounded ${
                              index === question.correctAnswer 
                                ? 'bg-green-100 border border-green-300' 
                                : 'bg-gray-50'
                            }`}
                          >
                            <span className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs mr-2">
                              {String.fromCharCode(65 + index)}
                            </span>
                            <span className={
                              index === question.correctAnswer 
                                ? 'font-medium text-green-800' 
                                : 'text-gray-700'
                            }>
                              {option}
                            </span>
                            {index === question.correctAnswer && (
                              <Badge className="ml-2 bg-green-600 text-white text-xs">
                                Correcta
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminQuestions;