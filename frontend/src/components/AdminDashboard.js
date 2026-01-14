import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Shield, 
  Users, 
  FileText, 
  BarChart3, 
  UserPlus,
  MessageSquarePlus,
  Settings,
  LogOut,
  Upload,
  Loader2,
  Activity
} from 'lucide-react';
import AdminUsers from './AdminUsers';
import AdminQuestions from './AdminQuestions';
import BulkImportQuestions from './BulkImportQuestions';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const AdminDashboard = ({ adminPassword, onLogout }) => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/admin/stats`, {
        params: { admin_password: adminPassword }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'users':
        return <AdminUsers adminPassword={adminPassword} onBack={() => setCurrentView('dashboard')} />;
      case 'questions':
        return <AdminQuestions adminPassword={adminPassword} onBack={() => setCurrentView('dashboard')} />;
      case 'bulk-import':
        return <BulkImportQuestions adminPassword={adminPassword} onBack={() => setCurrentView('dashboard')} />;
      default:
        return renderDashboard();
    }
  };

  const renderDashboard = () => (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-2xl text-white p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Portal de Administración
            </h1>
            <p className="text-red-100 text-lg">
              Gestión completa de la Plataforma Moose
            </p>
          </div>
          <Shield className="w-16 h-16 text-red-200" />
        </div>
      </div>

      {/* Stats Cards */}
      {loading ? (
        <div className="flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-red-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">
                Total de Usuarios
              </CardTitle>
              <Users className="w-5 h-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">
                {stats?.totalUsers || 0}
              </div>
              <p className="text-xs text-blue-600 mt-2">
                Estudiantes registrados
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-emerald-700">
                Total de Preguntas
              </CardTitle>
              <FileText className="w-5 h-5 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-900">
                {stats?.totalQuestions || 0}
              </div>
              <p className="text-xs text-emerald-600 mt-2">
                En la base de datos
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-700">
                Estado del Sistema
              </CardTitle>
              <Activity className="w-5 h-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900">
                Activo
              </div>
              <p className="text-xs text-purple-600 mt-2">
                Funcionando correctamente
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Questions by Topic */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-red-600" />
              <span>Preguntas por Tema</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {Object.entries(stats.questionsByTopic).map(([topicId, count]) => (
                <div key={topicId} className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-lg font-bold text-gray-900">{count}</div>
                  <div className="text-xs text-gray-600">Tema {topicId}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Management Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-red-600" />
            <span>Gestión del Sistema</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={() => setCurrentView('users')}
              className="h-auto p-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
            >
              <div className="text-center">
                <Users className="w-8 h-8 mx-auto mb-2" />
                <div className="font-medium">Gestionar Usuarios</div>
                <div className="text-xs opacity-90">
                  Agregar, eliminar y ver usuarios
                </div>
              </div>
            </Button>
            
            <Button
              onClick={() => setCurrentView('questions')}
              className="h-auto p-6 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800"
            >
              <div className="text-center">
                <FileText className="w-8 h-8 mx-auto mb-2" />
                <div className="font-medium">Gestionar Preguntas</div>
                <div className="text-xs opacity-90">
                  Agregar, eliminar y editar preguntas
                </div>
              </div>
            </Button>

            <Button
              onClick={() => setCurrentView('bulk-import')}
              className="h-auto p-6 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
            >
              <div className="text-center">
                <Upload className="w-8 h-8 mx-auto mb-2" />
                <div className="font-medium">Importación Masiva</div>
                <div className="text-xs opacity-90">
                  Importar múltiples preguntas
                </div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
      <header className="bg-white/80 backdrop-blur-sm border-b border-red-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-red-600 to-red-700 p-2 rounded-lg">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Portal de Administración</h1>
                <p className="text-sm text-red-700">Plataforma Moose</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge className="bg-red-100 text-red-800">
                Superadministrador
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={onLogout}
                className="flex items-center space-x-2 border-red-300 hover:bg-red-50 text-red-700"
              >
                <LogOut className="w-4 h-4" />
                <span>Salir</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderCurrentView()}
      </main>
    </div>
  );
};

export default AdminDashboard;