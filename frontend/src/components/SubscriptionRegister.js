import React, { useState } from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { 
  CreditCard, 
  Clock, 
  CheckCircle, 
  ArrowLeft,
  Gift,
  Shield,
  Star,
  Users
} from 'lucide-react';
import Logo from './Logo';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const SubscriptionRegister = ({ onBack }) => {
  const [step, setStep] = useState(1); // 1: register, 2: trial, 3: payment
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    language: 'es'
  });
  const [userToken, setUserToken] = useState('');
  const [paymentData, setPaymentData] = useState(null);

  const texts = {
    es: {
      title: "Registrarse en Moose",
      subtitle: "Únete a miles de estudiantes preparándose para el examen de arborista",
      step1Title: "Crear tu cuenta",
      step2Title: "¡Prueba gratuita de 5 días!",
      step3Title: "Completar suscripción",
      name: "Nombre completo",
      email: "Correo electrónico",
      username: "Nombre de usuario",
      password: "Contraseña",
      confirmPassword: "Confirmar contraseña",
      language: "Idioma preferido",
      spanish: "Español",
      english: "English",
      createAccount: "Crear cuenta",
      startTrial: "Iniciar prueba gratuita",
      monthlyPrice: "$10 USD/mes",
      trialFeatures: [
        "Acceso completo por 5 días",
        "Más de 100 preguntas de práctica",
        "Exámenes simulados cronometrados",
        "Seguimiento de progreso detallado",
        "Contenido bilingüe (ES/EN)"
      ],
      paymentFeatures: [
        "Acceso ilimitado después del periodo de prueba",
        "Nuevas preguntas agregadas regularmente",
        "Soporte técnico prioritario",
        "Certificados de finalización",
        "Sin compromisos - cancela en cualquier momento"
      ],
      back: "Volver",
      processing: "Procesando...",
      payWithPayPal: "Pagar con PayPal"
    },
    en: {
      title: "Join Moose",
      subtitle: "Join thousands of students preparing for the arborist certification exam",
      step1Title: "Create your account",
      step2Title: "5-day free trial!",
      step3Title: "Complete subscription",
      name: "Full name",
      email: "Email address",
      username: "Username",
      password: "Password",
      confirmPassword: "Confirm password",
      language: "Preferred language",
      spanish: "Español",
      english: "English",
      createAccount: "Create account",
      startTrial: "Start free trial",
      monthlyPrice: "$10 USD/month",
      trialFeatures: [
        "Full access for 5 days",
        "Over 100 practice questions",
        "Timed mock exams",
        "Detailed progress tracking",
        "Bilingual content (ES/EN)"
      ],
      paymentFeatures: [
        "Unlimited access after trial period",
        "New questions added regularly",
        "Priority technical support",
        "Completion certificates",
        "No commitment - cancel anytime"
      ],
      back: "Back",
      processing: "Processing...",
      payWithPayPal: "Pay with PayPal"
    }
  };

  const [language, setLanguage] = useState('es');
  const t = texts[language];

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (!formData.name || !formData.email || !formData.username || !formData.password) {
      setError(language === 'es' ? 'Todos los campos son requeridos' : 'All fields are required');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError(language === 'es' ? 'Las contraseñas no coinciden' : 'Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      // Register user
      const registerResponse = await axios.post(`${BACKEND_URL}/api/auth/register`, {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        name: formData.name,
        language: formData.language
      });

      // Login to get token
      const loginResponse = await axios.post(`${BACKEND_URL}/api/auth/login`, {
        username: formData.username,
        password: formData.password
      });

      setUserToken(loginResponse.data.access_token);
      setStep(2);
    } catch (error) {
      setError(error.response?.data?.detail || (language === 'es' ? 'Error al crear la cuenta' : 'Error creating account'));
    } finally {
      setLoading(false);
    }
  };

  const handleStartTrial = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${BACKEND_URL}/api/subscriptions/subscribe`, {
        planId: "monthly_10",
        startTrial: true
      }, {
        headers: { Authorization: `Bearer ${userToken}` }
      });

      setSuccess(language === 'es' ? '¡Prueba gratuita iniciada!' : 'Free trial started!');
      
      // Redirect to platform after 2 seconds
      setTimeout(() => {
        localStorage.setItem('arborist_token', userToken);
        window.location.href = '/';
      }, 2000);

    } catch (error) {
      setError(error.response?.data?.detail || (language === 'es' ? 'Error al iniciar la prueba' : 'Error starting trial'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePayment = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${BACKEND_URL}/api/subscriptions/create-payment`, {}, {
        headers: { Authorization: `Bearer ${userToken}` }
      });

      setPaymentData(response.data);
      window.open(response.data.approvalUrl, '_blank');
    } catch (error) {
      setError(error.response?.data?.detail || (language === 'es' ? 'Error al crear el pago' : 'Error creating payment'));
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">{t.step1Title}</CardTitle>
        <CardDescription>{t.subtitle}</CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <Label htmlFor="name">{t.name}</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>

          <div>
            <Label htmlFor="email">{t.email}</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
            />
          </div>

          <div>
            <Label htmlFor="username">{t.username}</Label>
            <Input
              id="username"
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              required
            />
          </div>

          <div>
            <Label htmlFor="password">{t.password}</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required
            />
          </div>

          <div>
            <Label htmlFor="confirmPassword">{t.confirmPassword}</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
              required
            />
          </div>

          <div>
            <Label htmlFor="language">{t.language}</Label>
            <select
              id="language"
              value={formData.language}
              onChange={(e) => {
                setFormData({...formData, language: e.target.value});
                setLanguage(e.target.value);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="es">{t.spanish}</option>
              <option value="en">{t.english}</option>
            </select>
          </div>

          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-700">{error}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700"
          >
            {loading ? t.processing : t.createAccount}
          </Button>
        </form>
      </CardContent>
    </Card>
  );

  const renderStep2 = () => (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader className="text-center">
        <div className="bg-emerald-100 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <Gift className="w-8 h-8 text-emerald-600" />
        </div>
        <CardTitle className="text-2xl font-bold text-emerald-800">{t.step2Title}</CardTitle>
        <CardDescription>
          {language === 'es' ? 
            'Explora todas las funciones sin costo durante 5 días completos' :
            'Explore all features at no cost for 5 full days'
          }
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <Badge className="bg-emerald-600 text-white">{language === 'es' ? 'GRATIS' : 'FREE'}</Badge>
            <div className="flex items-center text-emerald-600">
              <Clock className="w-4 h-4 mr-1" />
              <span className="font-semibold">5 {language === 'es' ? 'días' : 'days'}</span>
            </div>
          </div>
          
          <ul className="space-y-2">
            {t.trialFeatures.map((feature, index) => (
              <li key={index} className="flex items-center text-sm">
                <CheckCircle className="w-4 h-4 text-emerald-600 mr-2 flex-shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="text-center text-sm text-gray-600">
          {language === 'es' ? 
            'Después del período de prueba: ' :
            'After trial period: '
          }
          <span className="font-semibold text-emerald-600">{t.monthlyPrice}</span>
        </div>

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

        <Button
          onClick={handleStartTrial}
          disabled={loading || success}
          className="w-full bg-emerald-600 hover:bg-emerald-700"
        >
          {loading ? t.processing : t.startTrial}
        </Button>

        <Button
          variant="outline"
          onClick={() => setStep(3)}
          className="w-full"
        >
          {language === 'es' ? 'O pagar ahora' : 'Or pay now'}
        </Button>
      </CardContent>
    </Card>
  );

  const renderStep3 = () => (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader className="text-center">
        <div className="bg-blue-100 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <CreditCard className="w-8 h-8 text-blue-600" />
        </div>
        <CardTitle className="text-2xl font-bold">{t.step3Title}</CardTitle>
        <CardDescription>
          {t.monthlyPrice} - {language === 'es' ? 'Acceso completo' : 'Full access'}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
          <ul className="space-y-2">
            {t.paymentFeatures.map((feature, index) => (
              <li key={index} className="flex items-center text-sm">
                <Star className="w-4 h-4 text-blue-600 mr-2 flex-shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}

        <Button
          onClick={handleCreatePayment}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          <CreditCard className="w-4 h-4 mr-2" />
          {loading ? t.processing : t.payWithPayPal}
        </Button>

        <Button
          variant="outline"
          onClick={() => setStep(2)}
          className="w-full"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t.back}
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center px-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="bg-white p-4 rounded-lg w-16 h-16 mx-auto mb-4 flex items-center justify-center shadow-lg">
            <Logo className="w-10 h-10" alt="Moose Study Platform Logo" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.title}</h1>
          <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-1" />
              <span>{language === 'es' ? '5000+ estudiantes' : '5000+ students'}</span>
            </div>
            <div className="flex items-center">
              <Shield className="w-4 h-4 mr-1" />
              <span>{language === 'es' ? 'Pago seguro' : 'Secure payment'}</span>
            </div>
          </div>
        </div>

        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}

        <div className="text-center mt-8">
          <Button variant="ghost" onClick={onBack} className="text-gray-600 hover:text-gray-800">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {language === 'es' ? 'Volver al login' : 'Back to login'}
          </Button>
          
          <div className="flex items-center justify-center space-x-2 text-xs text-gray-500 mt-4">
            <span>
              {language === 'es' ? 'Desarrollado por' : 'Developed by'}
            </span>
            <a 
              href="https://scivis-innovations.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="font-semibold text-blue-600 hover:text-blue-800 transition-colors"
            >
              Scivis Innovations
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionRegister;