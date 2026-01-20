import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import Logo from './Logo';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login, loading, language, toggleLanguage } = useAuth();

  const texts = {
    es: {
      title: "Iniciar Sesión",
      subtitle: "Accede a tu cuenta de estudio",
      username: "Usuario",
      password: "Contraseña",
      loginButton: "Iniciar Sesión",
      demoCredentials: "Credenciales de Demostración:",
      demoUser: "Usuario: estudiante1 | Contraseña: password123",
      demoUser2: "Usuario: student2 | Contraseña: password123",
      languageSwitch: "Switch to English"
    },
    en: {
      title: "Login",
      subtitle: "Access your study account",
      username: "Username",
      password: "Password", 
      loginButton: "Login",
      demoCredentials: "Demo Credentials:",
      demoUser: "User: estudiante1 | Password: password123",
      demoUser2: "User: student2 | Password: password123",
      languageSwitch: "Cambiar a Español"
    }
  };

  const t = texts[language];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!username || !password) {
      setError(language === 'es' ? 'Por favor complete todos los campos' : 'Please fill in all fields');
      return;
    }

    const result = await login(username, password);
    if (!result.success) {
      setError(result.error);
    }
  };

  const fillDemoCredentials = (demoUsername) => {
    setUsername(demoUsername);
    setPassword('password123');
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-white p-4 rounded-lg w-16 h-16 mx-auto mb-4 flex items-center justify-center shadow-lg">
            <Logo className="w-10 h-10" alt="Moose Study Platform Logo" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {language === 'es' ? 'Moose SciVis Learning Hub' : 'Moose SciVis Learning Hub'}
          </h1>
          <p className="text-gray-600">
            {language === 'es' ? 'Certificación de Arborista' : 'Arborist Certification'}
          </p>
        </div>

        <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">{t.title}</CardTitle>
            <CardDescription className="text-gray-600">{t.subtitle}</CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-gray-700 font-medium">
                  {t.username}
                </Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={t.username}
                  className="border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 font-medium">
                  {t.password}
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t.password}
                    className="border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="w-5 h-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-700">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-medium py-2 px-4 transition-all duration-200"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {language === 'es' ? 'Ingresando...' : 'Logging in...'}
                  </>
                ) : (
                  t.loginButton
                )}
              </Button>
            </form>

            <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
              <p className="text-sm font-medium text-gray-700 mb-2">{t.demoCredentials}</p>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => fillDemoCredentials('estudiante1')}
                  className="block text-xs text-emerald-600 hover:text-emerald-700 hover:underline"
                >
                  {t.demoUser}
                </button>
                <button
                  type="button"
                  onClick={() => fillDemoCredentials('student2')}
                  className="block text-xs text-emerald-600 hover:text-emerald-700 hover:underline"
                >
                  {t.demoUser2}
                </button>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="pt-4 space-y-4">
            <Button
              variant="ghost"
              onClick={toggleLanguage}
              className="w-full text-gray-600 hover:text-gray-800"
            >
              {t.languageSwitch}
            </Button>
            
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-3">
                {language === 'es' ? '¿No tienes una cuenta?' : "Don't have an account?"}
              </p>
              <Button
                variant="outline"
                onClick={() => window.location.href = '/register'}
                className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white border-0 mb-3"
              >
                {language === 'es' ? 'Registrarse - Prueba 5 días gratis' : 'Sign Up - 5 Days Free Trial'}
              </Button>
              
              <Button
                variant="ghost"
                onClick={() => window.location.href = '/admin'}
                className="w-full text-xs text-gray-500 hover:text-gray-700"
              >
                {language === 'es' ? 'Acceso Administrador' : 'Administrator Access'}
              </Button>
            </div>
          </CardFooter>
        </Card>
        <div className="text-center mt-8">
          <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
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

export default Login;