#!/usr/bin/env python3
"""
Quick Subscription System Test (Non-PayPal endpoints)
"""

import requests
import json
from datetime import datetime

BACKEND_URL = "https://exam-tree-prep.preview.emergentagent.com/api"

TEST_USER_DATA = {
    "username": f"sub_test_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
    "email": f"sub_test_{datetime.now().strftime('%Y%m%d_%H%M%S')}@example.com",
    "password": "SecurePass123!",
    "name": "Subscription Test User",
    "language": "en"
}

def test_subscription_system():
    session = requests.Session()
    
    # Register and login
    register_response = session.post(f"{BACKEND_URL}/auth/register", json=TEST_USER_DATA)
    if register_response.status_code != 200:
        print(f"❌ Registration failed: {register_response.status_code}")
        return False
    
    login_response = session.post(f"{BACKEND_URL}/auth/login", 
                                json={"username": TEST_USER_DATA["username"], "password": TEST_USER_DATA["password"]})
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.status_code}")
        return False
    
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test subscription creation
    sub_response = session.post(f"{BACKEND_URL}/subscriptions/subscribe", 
                               json={"planId": "monthly_10", "startTrial": True}, headers=headers)
    if sub_response.status_code != 200:
        print(f"❌ Subscription creation failed: {sub_response.status_code}")
        return False
    
    # Test subscription status
    status_response = session.get(f"{BACKEND_URL}/subscriptions/status", headers=headers)
    if status_response.status_code != 200:
        print(f"❌ Subscription status failed: {status_response.status_code}")
        return False
    
    # Test payment history
    history_response = session.get(f"{BACKEND_URL}/subscriptions/payments", headers=headers)
    if history_response.status_code != 200:
        print(f"❌ Payment history failed: {history_response.status_code}")
        return False
    
    print("✅ All non-PayPal subscription endpoints working correctly")
    return True

if __name__ == "__main__":
    test_subscription_system()