from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from datetime import datetime, timedelta
import os
import paypalrestsdk as paypal
import logging

from models import (
    Subscription, SubscriptionCreate, SubscriptionResponse, 
    Payment, PaymentCreate, PaymentStatus, SubscriptionStatus,
    MessageResponse
)
from auth import get_current_user, get_password_hash
from database import (
    get_database, USERS_COLLECTION, SUBSCRIPTIONS_COLLECTION, 
    PAYMENTS_COLLECTION, serialize_doc
)

logger = logging.getLogger(__name__)
router = APIRouter()

# Configure PayPal
paypal.configure({
    "mode": os.getenv("PAYPAL_MODE", "sandbox"),  # sandbox or live
    "client_id": os.getenv("PAYPAL_CLIENT_ID"),
    "client_secret": os.getenv("PAYPAL_CLIENT_SECRET")
})

async def get_user_subscription(user_id: str, db):
    """Get user's current subscription"""
    subscription = await db[SUBSCRIPTIONS_COLLECTION].find_one({"userId": user_id})
    if not subscription:
        return None
    
    # Calculate days remaining and active status
    now = datetime.utcnow()
    subscription_data = serialize_doc(subscription)
    
    if subscription_data["status"] == SubscriptionStatus.trial and subscription_data.get("trialEndDate"):
        end_date = subscription_data["trialEndDate"]
        days_remaining = (end_date - now).days if end_date > now else 0
        is_active = days_remaining > 0
    elif subscription_data["status"] == SubscriptionStatus.active and subscription_data.get("subscriptionEndDate"):
        end_date = subscription_data["subscriptionEndDate"]
        days_remaining = (end_date - now).days if end_date > now else 0
        is_active = days_remaining > 0
    else:
        days_remaining = 0
        is_active = False
    
    subscription_data["daysRemaining"] = days_remaining
    subscription_data["isActive"] = is_active
    
    return SubscriptionResponse(**subscription_data)

@router.post("/subscribe", response_model=SubscriptionResponse)
async def create_subscription(
    subscription_data: SubscriptionCreate,
    current_user = Depends(get_current_user)
):
    """Create a new subscription with 5-day trial"""
    db = await get_database()
    
    # Check if user already has a subscription
    existing_subscription = await db[SUBSCRIPTIONS_COLLECTION].find_one({"userId": current_user.id})
    if existing_subscription:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already has a subscription"
        )
    
    # Create trial subscription
    now = datetime.utcnow()
    trial_end = now + timedelta(days=5)
    
    new_subscription = {
        "userId": current_user.id,
        "status": SubscriptionStatus.trial,
        "planId": subscription_data.planId,
        "trialStartDate": now,
        "trialEndDate": trial_end,
        "subscriptionStartDate": None,
        "subscriptionEndDate": None,
        "paypalSubscriptionId": None,
        "createdAt": now,
        "updatedAt": now
    }
    
    result = await db[SUBSCRIPTIONS_COLLECTION].insert_one(new_subscription)
    new_subscription["id"] = str(result.inserted_id)
    
    # Calculate response data
    new_subscription["daysRemaining"] = 5
    new_subscription["isActive"] = True
    
    logger.info(f"Created trial subscription for user: {current_user.username}")
    return SubscriptionResponse(**serialize_doc(new_subscription))

@router.get("/status", response_model=Optional[SubscriptionResponse])
async def get_subscription_status(current_user = Depends(get_current_user)):
    """Get current user's subscription status"""
    db = await get_database()
    subscription = await get_user_subscription(current_user.id, db)
    
    if not subscription:
        return None
    
    # Auto-update expired subscriptions
    if subscription.daysRemaining <= 0 and subscription.status in [SubscriptionStatus.trial, SubscriptionStatus.active]:
        await db[SUBSCRIPTIONS_COLLECTION].update_one(
            {"userId": current_user.id},
            {
                "$set": {
                    "status": SubscriptionStatus.expired,
                    "updatedAt": datetime.utcnow()
                }
            }
        )
        subscription.status = SubscriptionStatus.expired
        subscription.isActive = False
    
    return subscription

@router.post("/create-payment", response_model=dict)
async def create_paypal_payment(current_user = Depends(get_current_user)):
    """Create PayPal payment for subscription"""
    db = await get_database()
    
    # Get user's subscription
    subscription = await get_user_subscription(current_user.id, db)
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No subscription found for user"
        )
    
    # Create PayPal payment
    payment = paypal.Payment({
        "intent": "sale",
        "payer": {"payment_method": "paypal"},
        "redirect_urls": {
            "return_url": f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/payment/success",
            "cancel_url": f"{os.getenv('FRONTEND_URL', 'http://localhost:3000')}/payment/cancel"
        },
        "transactions": [{
            "item_list": {
                "items": [{
                    "name": "Arborist Study Platform - Monthly Subscription",
                    "sku": "MOOSE_MONTHLY_10",
                    "price": "10.00",
                    "currency": "USD",
                    "quantity": 1
                }]
            },
            "amount": {
                "total": "10.00",
                "currency": "USD"
            },
            "description": "Monthly subscription to Moose Arborist Study Platform"
        }]
    })
    
    if payment.create():
        # Store payment record
        payment_record = {
            "userId": current_user.id,
            "subscriptionId": subscription.id,
            "paypalOrderId": payment.id,
            "amount": 10.0,
            "currency": "USD",
            "status": PaymentStatus.pending,
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }
        await db[PAYMENTS_COLLECTION].insert_one(payment_record)
        
        # Get approval URL
        for link in payment.links:
            if link.rel == "approval_url":
                return {
                    "paymentId": payment.id,
                    "approvalUrl": str(link.href)
                }
    else:
        logger.error(f"PayPal payment creation failed: {payment.error}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create PayPal payment"
        )

@router.post("/execute-payment", response_model=MessageResponse)
async def execute_paypal_payment(
    payment_id: str,
    payer_id: str,
    current_user = Depends(get_current_user)
):
    """Execute PayPal payment after approval"""
    db = await get_database()
    
    # Get payment from PayPal
    payment = paypal.Payment.find(payment_id)
    
    if payment.execute({"payer_id": payer_id}):
        # Update payment record
        await db[PAYMENTS_COLLECTION].update_one(
            {"paypalOrderId": payment_id},
            {
                "$set": {
                    "paypalPaymentId": payment.id,
                    "status": PaymentStatus.completed,
                    "updatedAt": datetime.utcnow()
                }
            }
        )
        
        # Update subscription to active
        now = datetime.utcnow()
        next_month = now + timedelta(days=30)
        
        await db[SUBSCRIPTIONS_COLLECTION].update_one(
            {"userId": current_user.id},
            {
                "$set": {
                    "status": SubscriptionStatus.active,
                    "subscriptionStartDate": now,
                    "subscriptionEndDate": next_month,
                    "updatedAt": now
                }
            }
        )
        
        logger.info(f"Payment completed for user: {current_user.username}")
        return MessageResponse(message="Payment completed successfully")
    else:
        logger.error(f"PayPal payment execution failed: {payment.error}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to execute PayPal payment"
        )

@router.post("/cancel", response_model=MessageResponse)
async def cancel_subscription(current_user = Depends(get_current_user)):
    """Cancel user's subscription"""
    db = await get_database()
    
    # Update subscription status
    result = await db[SUBSCRIPTIONS_COLLECTION].update_one(
        {"userId": current_user.id},
        {
            "$set": {
                "status": SubscriptionStatus.cancelled,
                "updatedAt": datetime.utcnow()
            }
        }
    )
    
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No subscription found for user"
        )
    
    logger.info(f"Subscription cancelled for user: {current_user.username}")
    return MessageResponse(message="Subscription cancelled successfully")

@router.get("/payments", response_model=List[dict])
async def get_payment_history(current_user: dict = Depends(get_current_user)):
    """Get user's payment history"""
    db = await get_database()
    
    payments_cursor = db[PAYMENTS_COLLECTION].find({"userId": current_user["id"]})
    payments = await payments_cursor.to_list(length=100)
    
    return [serialize_doc(payment) for payment in payments]