from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from datetime import datetime
import logging

from database import get_database, SUBSCRIPTIONS_COLLECTION, serialize_doc
from models import SubscriptionStatus
from auth import decode_access_token

logger = logging.getLogger(__name__)

async def check_subscription_middleware(request: Request, call_next):
    """Middleware to check if user has active subscription"""
    
    # Skip subscription check for certain paths
    skip_paths = [
        "/api/auth/login",
        "/api/auth/register", 
        "/api/subscriptions/subscribe",
        "/api/subscriptions/status",
        "/api/subscriptions/create-payment",
        "/api/subscriptions/execute-payment",
        "/api/health",
        "/api/admin",
        "/docs",
        "/redoc",
        "/openapi.json"
    ]
    
    # Skip if path should be excluded
    if any(request.url.path.startswith(path) for path in skip_paths):
        return await call_next(request)
    
    # Skip if not an API path
    if not request.url.path.startswith("/api/"):
        return await call_next(request)
    
    # Get authorization header
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return await call_next(request)
    
    try:
        # Decode token to get user
        token = auth_header.split(" ")[1]
        payload = decode_access_token(token)
        if not payload:
            return await call_next(request)
        
        user_id = payload.get("sub")
        if not user_id:
            return await call_next(request)
        
        # Check subscription status
        db = await get_database()
        subscription = await db[SUBSCRIPTIONS_COLLECTION].find_one({"userId": user_id})
        
        if not subscription:
            return JSONResponse(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                content={
                    "detail": "No subscription found. Please subscribe to access the platform.",
                    "requiresSubscription": True
                }
            )
        
        subscription_data = serialize_doc(subscription)
        now = datetime.utcnow()
        
        # Check if subscription is active
        is_active = False
        
        if subscription_data["status"] == SubscriptionStatus.trial:
            trial_end = subscription_data.get("trialEndDate")
            if trial_end and trial_end > now:
                is_active = True
        elif subscription_data["status"] == SubscriptionStatus.active:
            sub_end = subscription_data.get("subscriptionEndDate")
            if sub_end and sub_end > now:
                is_active = True
        
        if not is_active:
            # Update subscription to expired
            await db[SUBSCRIPTIONS_COLLECTION].update_one(
                {"userId": user_id},
                {
                    "$set": {
                        "status": SubscriptionStatus.expired,
                        "updatedAt": now
                    }
                }
            )
            
            return JSONResponse(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                content={
                    "detail": "Your subscription has expired. Please renew to continue using the platform.",
                    "requiresPayment": True,
                    "subscriptionExpired": True
                }
            )
        
        # Subscription is active, continue
        return await call_next(request)
        
    except Exception as e:
        logger.error(f"Subscription check error: {e}")
        return await call_next(request)