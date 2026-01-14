import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { CheckCircle, Loader2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const PaymentSuccess = () => {
  const { language } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const texts = {
    es: {
      processing: "Procesando tu pago...",
      success: "¡Pago exitoso!",
      successMessage: "Tu suscripción ha sido activada correctamente.",
      error: "Error al procesar el pago",
      goToDashboard: "Ir al Dashboard",
      tryAgain: "Intentar nuevamente"
    },
    en: {
      processing: "Processing your payment...",
      success: "Payment successful!",
      successMessage: "Your subscription has been activated successfully.",
      error: "Error processing payment",
      goToDashboard: "Go to Dashboard",
      tryAgain: "Try again"
    }
  };

  const t = texts[language];

  useEffect(() => {
    const processPayment = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const paymentId = urlParams.get('paymentId');
      const payerId = urlParams.get('PayerID');

      if (!paymentId || !payerId) {
        setError('Missing payment information');
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem('arborist_token');
        if (!token) {
          setError('Authentication required');
          setLoading(false);
          return;
        }

        await axios.post(`${BACKEND_URL}/api/subscriptions/execute-payment`, {
          payment_id: paymentId,
          payer_id: payerId
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });

        setSuccess(true);
      } catch (error) {
        console.error('Payment processing error:', error);
        setError(error.response?.data?.detail || 'Payment processing failed');
      } finally {
        setLoading(false);
      }
    };

    processPayment();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-emerald-600" />
            <h2 className="text-xl font-semibold mb-2">{t.processing}</h2>
            <p className="text-gray-600">Please wait while we confirm your payment...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="bg-green-100 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-green-800">{t.success}</CardTitle>
          </CardHeader>
          
          <CardContent className="text-center space-y-4">
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="w-4 h-4" />
              <AlertDescription className="text-green-700">
                {t.successMessage}
              </AlertDescription>
            </Alert>

            <Button
              onClick={() => window.location.href = '/'}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              {t.goToDashboard}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="bg-red-100 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-red-800">{t.error}</CardTitle>
        </CardHeader>
        
        <CardContent className="text-center space-y-4">
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription className="text-red-700">
              {error || 'An error occurred while processing your payment'}
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Button
              onClick={() => window.location.href = '/register'}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              {t.tryAgain}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => window.location.href = '/'}
              className="w-full"
            >
              {t.goToDashboard}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccess;