import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Crown, 
  Calendar, 
  CreditCard, 
  Gift,
  Clock,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const SubscriptionStatus = () => {
  const { API, language } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);

  const texts = {
    es: {
      subscription: "Estado de Suscripción",
      trial: "Prueba Gratuita",
      active: "Activa",
      expired: "Expirada",
      cancelled: "Cancelada",
      daysRemaining: "días restantes",
      upgradeNow: "Suscribirse Ahora",
      renewNow: "Renovar Ahora",
      payWithPayPal: "Pagar con PayPal",
      trialEnding: "Tu prueba gratuita termina pronto",
      subscriptionExpired: "Tu suscripción ha expirado",
      monthlyPrice: "$10 USD/mes",
      processing: "Procesando...",
      unlimited: "Acceso ilimitado",
      noSubscription: "Sin suscripción activa"
    },
    en: {
      subscription: "Subscription Status",
      trial: "Free Trial",
      active: "Active",
      expired: "Expired", 
      cancelled: "Cancelled",
      daysRemaining: "days remaining",
      upgradeNow: "Subscribe Now",
      renewNow: "Renew Now",
      payWithPayPal: "Pay with PayPal",
      trialEnding: "Your free trial is ending soon",
      subscriptionExpired: "Your subscription has expired",
      monthlyPrice: "$10 USD/month",
      processing: "Processing...",
      unlimited: "Unlimited access",
      noSubscription: "No active subscription"
    }
  };

  const t = texts[language];

  useEffect(() => {
    fetchSubscriptionStatus();
  }, []);

  const fetchSubscriptionStatus = async () => {
    try {
      setLoading(true);
      const response = await API.get('/api/subscriptions/status');
      setSubscription(response.data);
    } catch (error) {
      console.error('Error fetching subscription:', error);
      if (error.response?.status !== 404) {
        setError('Error loading subscription status');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    try {
      setPaymentLoading(true);
      setError('');
      
      const response = await API.post('/api/subscriptions/create-payment');
      
      // Open PayPal payment in new window
      window.open(response.data.approvalUrl, '_blank');
      
    } catch (error) {
      console.error('Payment error:', error);
      setError(error.response?.data?.detail || 'Error creating payment');
    } finally {
      setPaymentLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      trial: { color: "bg-blue-100 text-blue-800", icon: Gift },
      active: { color: "bg-green-100 text-green-800", icon: CheckCircle },
      expired: { color: "bg-red-100 text-red-800", icon: AlertTriangle },
      cancelled: { color: "bg-gray-100 text-gray-800", icon: AlertTriangle }
    };

    const badge = badges[status] || badges.expired;
    const Icon = badge.icon;

    return (
      <Badge className={badge.color}>
        <Icon className="w-3 h-3 mr-1" />
        {t[status]}
      </Badge>
    );
  };

  const getStatusAlert = () => {
    if (!subscription) return null;

    if (subscription.status === 'trial' && subscription.daysRemaining <= 2) {
      return (
        <Alert className="border-yellow-200 bg-yellow-50 mb-4">
          <Clock className="w-4 h-4" />
          <AlertDescription className="text-yellow-800">
            {t.trialEnding} - {subscription.daysRemaining} {t.daysRemaining}
          </AlertDescription>
        </Alert>
      );
    }

    if (subscription.status === 'expired') {
      return (
        <Alert className="border-red-200 bg-red-50 mb-4">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription className="text-red-800">
            {t.subscriptionExpired}
          </AlertDescription>
        </Alert>
      );
    }

    return null;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!subscription) {
    return (
      <Card className="border-yellow-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Crown className="w-5 h-5 text-yellow-600" />
            <span>{t.subscription}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-gray-600 mb-4">{t.noSubscription}</p>
            <Button
              onClick={() => window.location.href = '/register'}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Gift className="w-4 h-4 mr-2" />
              {language === 'es' ? 'Iniciar Prueba Gratis' : 'Start Free Trial'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Crown className="w-5 h-5 text-emerald-600" />
            <span>{t.subscription}</span>
          </div>
          {getStatusBadge(subscription.status)}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {getStatusAlert()}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-700">
              {subscription.status === 'active' ? t.unlimited : 
               `${subscription.daysRemaining} ${t.daysRemaining}`}
            </span>
          </div>
          
          {subscription.status === 'active' && (
            <div className="text-sm text-emerald-600 font-medium">
              {t.monthlyPrice}
            </div>
          )}
        </div>

        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}

        {(subscription.status === 'trial' && subscription.daysRemaining <= 3) || 
         subscription.status === 'expired' ? (
          <Button
            onClick={handlePayment}
            disabled={paymentLoading}
            className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
          >
            <CreditCard className="w-4 h-4 mr-2" />
            {paymentLoading ? t.processing : 
             subscription.status === 'expired' ? t.renewNow : t.upgradeNow}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
};

export default SubscriptionStatus;