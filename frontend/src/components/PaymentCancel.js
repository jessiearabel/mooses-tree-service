import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { XCircle, ArrowLeft } from 'lucide-react';

const PaymentCancel = () => {
  const texts = {
    es: {
      title: "Pago cancelado",
      message: "Has cancelado el proceso de pago. Tu suscripción no ha sido activada.",
      noWorries: "No te preocupes, puedes intentar nuevamente cuando estés listo.",
      tryAgain: "Intentar nuevamente",
      backToPlatform: "Volver a la plataforma"
    },
    en: {
      title: "Payment cancelled",
      message: "You have cancelled the payment process. Your subscription has not been activated.",
      noWorries: "No worries, you can try again when you're ready.",
      tryAgain: "Try again",
      backToPlatform: "Back to platform"
    }
  };

  // Detect language from URL or default to Spanish
  const language = new URLSearchParams(window.location.search).get('lang') || 'es';
  const t = texts[language];

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="bg-yellow-100 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <XCircle className="w-8 h-8 text-yellow-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-yellow-800">{t.title}</CardTitle>
        </CardHeader>
        
        <CardContent className="text-center space-y-4">
          <Alert className="border-yellow-200 bg-yellow-50">
            <XCircle className="w-4 h-4" />
            <AlertDescription className="text-yellow-700">
              {t.message}
            </AlertDescription>
          </Alert>

          <p className="text-gray-600">{t.noWorries}</p>

          <div className="space-y-2">
            <Button
              onClick={() => window.location.href = '/register'}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              {t.tryAgain}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => window.location.href = '/'}
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t.backToPlatform}
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
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentCancel;