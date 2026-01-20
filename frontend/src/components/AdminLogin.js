import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { Shield, Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react';
import Logo from './Logo';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const AdminLogin = ({ onAdminAccess, onBack }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!password) {
      setError('La contraseña es requerida');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await axios.post(`${BACKEND_URL}/api/admin/login`, {
        password
      });

      // If successful, grant admin access
      onAdminAccess(password);
      
    } catch (error) {
      console.error('Admin login error:', error);
      const errorMessage = error.response?.data?.detail || 'Contraseña de administrador incorrecta';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-red-600 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Moose SciVis Learning Hub
          </h1>
          <p className="text-gray-600">
            Portal de Super Administrador
          </p>
        </div>

        <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-red-800">
              Acceso de Superadministrador
            </CardTitle>
            <CardDescription className="text-gray-600">
              Ingresa la contraseña maestra para acceder
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 font-medium">
                  Contraseña de Administrador
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••••••"
                    className="border-red-200 focus:border-red-500 focus:ring-red-500 pr-10"
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
                className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-medium py-2 px-4 transition-all duration-200"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Acceder como Administrador
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium text-red-800">
                  Acceso Restringido
                </span>
              </div>
              <p className="text-xs text-red-700 mt-1">
                Este portal permite la gestión completa de usuarios y preguntas del sistema. 
                Solo personal autorizado debe tener acceso.
              </p>
            </div>
          </CardContent>
          
          <div className="p-6 pt-0">
            <Button
              variant="ghost"
              onClick={onBack}
              className="w-full text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a la Plataforma de Estudio
            </Button>
            
            <div className="flex items-center justify-center space-x-2 text-xs text-gray-500 mt-4">
              <span>Desarrollado por</span>
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
        </Card>
      </div>
    </div>
  );
};

export default AdminLogin;