import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Alert, AlertDescription } from './ui/alert';
import { ArrowLeft, UserPlus, Loader2, CheckCircle, XCircle } from 'lucide-react';

const AddStudent = ({ onNavigate }) => {
  const { language, API } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    language: 'es'
  });

  const texts = {
    es: {
      title: "Agregar Nuevo Estudiante",
      subtitle: "Registra un nuevo estudiante en la plataforma",
      username: "Usuario",
      email: "Correo Electrónico",
      password: "Contraseña",
      confirmPassword: "Confirmar Contraseña",
      fullName: "Nombre Completo",
      preferredLanguage: "Idioma Preferido",
      spanish: "Español",
      english: "Inglés",
      addStudent: "Agregar Estudiante",
      cancel: "Cancelar",
      backToDashboard: "Volver al Panel",
      required: "Este campo es requerido",
      emailInvalid: "Formato de correo inválido",
      passwordMismatch: "Las contraseñas no coinciden",
      passwordLength: "La contraseña debe tener al menos 6 caracteres",
      success: "¡Estudiante agregado exitosamente!",
      successMessage: "El nuevo estudiante ha sido registrado y puede iniciar sesión con sus credenciales.",
      addAnother: "Agregar Otro Estudiante",
      usernameRequirements: "Solo letras, números y guiones bajos. Mínimo 3 caracteres.",
      passwordRequirements: "Mínimo 6 caracteres. Se recomienda incluir letras y números."
    },
    en: {
      title: "Add New Student",
      subtitle: "Register a new student on the platform",
      username: "Username",
      email: "Email Address",
      password: "Password",
      confirmPassword: "Confirm Password",
      fullName: "Full Name",
      preferredLanguage: "Preferred Language",
      spanish: "Spanish",
      english: "English",
      addStudent: "Add Student",
      cancel: "Cancel",
      backToDashboard: "Back to Dashboard",
      required: "This field is required",
      emailInvalid: "Invalid email format",
      passwordMismatch: "Passwords do not match",
      passwordLength: "Password must be at least 6 characters",
      success: "Student added successfully!",
      successMessage: "The new student has been registered and can log in with their credentials.",
      addAnother: "Add Another Student",
      usernameRequirements: "Only letters, numbers and underscores. Minimum 3 characters.",
      passwordRequirements: "Minimum 6 characters. We recommend including letters and numbers."
    }
  };

  const t = texts[language];

  const handleInputChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const validateForm = () => {
    if (!formData.username || formData.username.length < 3) {
      setError(t.required + ' - Usuario (mínimo 3 caracteres)');
      return false;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      setError(t.usernameRequirements);
      return false;
    }

    if (!formData.email) {
      setError(t.required + ' - Email');
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError(t.emailInvalid);
      return false;
    }

    if (!formData.password || formData.password.length < 6) {
      setError(t.passwordLength);
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError(t.passwordMismatch);
      return false;
    }

    if (!formData.name || formData.name.length < 2) {
      setError(t.required + ' - Nombre completo');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setLoading(true);
      setError('');

      const response = await API.post('/api/auth/register', {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        name: formData.name,
        language: formData.language
      });

      setSuccess(true);
      
      // Reset form
      setFormData({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        name: '',
        language: 'es'
      });

    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.detail || 
        (language === 'es' ? 'Error al registrar estudiante' : 'Error registering student');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAnother = () => {
    setSuccess(false);
    setError('');
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button 
            variant="outline"
            onClick={() => onNavigate('dashboard')}
            className="border-emerald-300 hover:bg-emerald-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t.backToDashboard}
          </Button>
        </div>

        <Card className="border-emerald-200">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-emerald-800">
              {t.success}
            </CardTitle>
            <CardDescription className="text-emerald-700">
              {t.successMessage}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={handleAddAnother}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                {t.addAnother}
              </Button>
              <Button
                variant="outline"
                onClick={() => onNavigate('dashboard')}
                className="border-emerald-300 hover:bg-emerald-50"
              >
                {t.backToDashboard}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
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

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <UserPlus className="w-5 h-5 text-emerald-600" />
            <span>{t.title}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <XCircle className="w-4 h-4 text-red-600" />
                <AlertDescription className="text-red-700">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-gray-700 font-medium">
                  {t.username} *
                </Label>
                <Input
                  id="username"
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  placeholder="usuario123"
                  className="border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
                />
                <p className="text-xs text-gray-500">{t.usernameRequirements}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-medium">
                  {t.email} *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="estudiante@email.com"
                  className="border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-700 font-medium">
                {t.fullName} *
              </Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Juan Pérez"
                className="border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 font-medium">
                  {t.password} *
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="••••••••"
                  className="border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
                />
                <p className="text-xs text-gray-500">{t.passwordRequirements}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">
                  {t.confirmPassword} *
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  placeholder="••••••••"
                  className="border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700 font-medium">
                {t.preferredLanguage}
              </Label>
              <Select
                value={formData.language}
                onValueChange={(value) => handleInputChange('language', value)}
              >
                <SelectTrigger className="border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="es">{t.spanish}</SelectItem>
                  <SelectItem value="en">{t.english}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {language === 'es' ? 'Agregando...' : 'Adding...'}
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    {t.addStudent}
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onNavigate('dashboard')}
                className="border-gray-300 hover:bg-gray-50"
              >
                {t.cancel}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddStudent;