import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { 
  Upload, 
  Download, 
  FileSpreadsheet, 
  AlertTriangle,
  CheckCircle,
  ArrowLeft,
  Loader2,
  FileText,
  Info
} from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const BulkImportQuestions = ({ adminPassword, onBack }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const [error, setError] = useState('');

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
    setError('');
    setImportResults(null);
  };

  const handleDownloadTemplate = async () => {
    try {
      setDownloadingTemplate(true);
      setError('');

      const response = await axios.get(`${BACKEND_URL}/api/admin/questions/template`, {
        params: { admin_password: adminPassword }
      });

      // Create and download CSV file
      const csvContent = response.data.csv_content;
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'questions_template.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      setError(error.response?.data?.detail || 'Error al descargar la plantilla');
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Por favor selecciona un archivo');
      return;
    }

    try {
      setUploading(true);
      setError('');
      setImportResults(null);

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('admin_password', adminPassword);

      const response = await axios.post(`${BACKEND_URL}/api/admin/questions/bulk-import`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setImportResults(response.data);
      setSelectedFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('file-upload');
      if (fileInput) fileInput.value = '';

    } catch (error) {
      setError(error.response?.data?.detail || 'Error al importar las preguntas');
    } finally {
      setUploading(false);
    }
  };

  const getFileIcon = (filename) => {
    if (filename?.toLowerCase().includes('.csv')) {
      return <FileText className="w-5 h-5 text-green-600" />;
    }
    return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
  };

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
            <h1 className="text-2xl font-bold text-gray-900">Importación Masiva de Preguntas</h1>
            <p className="text-gray-600">Importa múltiples preguntas desde archivos Excel o CSV</p>
          </div>
        </div>
      </div>

      {/* Instructions Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-blue-800">
            <Info className="w-5 h-5" />
            <span>Instrucciones</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-700 space-y-2">
          <p><strong>1. Descargar plantilla:</strong> Usa el botón "Descargar Plantilla" para obtener el formato correcto</p>
          <p><strong>2. Llenar datos:</strong> Completa todas las columnas requeridas en el archivo</p>
          <p><strong>3. Subir archivo:</strong> Selecciona tu archivo y haz clic en "Importar Preguntas"</p>
          <p><strong>Formatos soportados:</strong> Excel (.xlsx, .xls) y CSV (.csv)</p>
        </CardContent>
      </Card>

      {/* Download Template */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Download className="w-5 h-5 text-emerald-600" />
            <span>Descargar Plantilla</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            Descarga la plantilla con ejemplos de preguntas y el formato correcto para la importación masiva.
          </p>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Columnas requeridas:</h4>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <Badge variant="outline">topic_id</Badge>
              <Badge variant="outline">type</Badge>
              <Badge variant="outline">question_es</Badge>
              <Badge variant="outline">question_en</Badge>
              <Badge variant="outline">options</Badge>
              <Badge variant="outline">correct_answer</Badge>
              <Badge variant="outline">explanation_es</Badge>
              <Badge variant="outline">explanation_en</Badge>
              <Badge variant="outline">difficulty</Badge>
            </div>
          </div>

          <Button
            onClick={handleDownloadTemplate}
            disabled={downloadingTemplate}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {downloadingTemplate ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Descargando...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Descargar Plantilla CSV
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* File Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="w-5 h-5 text-blue-600" />
            <span>Subir Archivo</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            
            <input
              id="file-upload"
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <label
              htmlFor="file-upload"
              className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md inline-flex items-center space-x-2"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Seleccionar Archivo</span>
            </label>
            
            <p className="text-gray-500 mt-2">Excel (.xlsx, .xls) o CSV (.csv)</p>
          </div>

          {selectedFile && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getFileIcon(selectedFile.name)}
                  <div>
                    <p className="font-medium text-green-800">{selectedFile.name}</p>
                    <p className="text-sm text-green-600">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Importando...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Importar Preguntas
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription className="text-red-700">{error}</AlertDescription>
        </Alert>
      )}

      {/* Import Results */}
      {importResults && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-green-800">
              <CheckCircle className="w-5 h-5" />
              <span>Resultados de Importación</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {importResults.imported_count}
                </div>
                <div className="text-sm text-green-700">Preguntas Importadas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {importResults.error_count}
                </div>
                <div className="text-sm text-red-700">Errores</div>
              </div>
            </div>

            {importResults.imported_questions.length > 0 && (
              <div>
                <h4 className="font-medium text-green-800 mb-2">Preguntas Importadas:</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {importResults.imported_questions.slice(0, 5).map((question, index) => (
                    <div key={index} className="text-sm bg-white p-2 rounded border">
                      <span className="font-medium">Fila {question.row}:</span> {question.question_es}
                      <Badge className="ml-2 bg-green-600 text-white text-xs">
                        Tema {question.topic}
                      </Badge>
                    </div>
                  ))}
                  {importResults.imported_questions.length > 5 && (
                    <div className="text-sm text-green-700 font-medium">
                      ... y {importResults.imported_questions.length - 5} más
                    </div>
                  )}
                </div>
              </div>
            )}

            {importResults.errors.length > 0 && (
              <div>
                <h4 className="font-medium text-red-800 mb-2">Errores Encontrados:</h4>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {importResults.errors.map((error, index) => (
                    <div key={index} className="text-sm bg-red-100 p-2 rounded border text-red-700">
                      {error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BulkImportQuestions;