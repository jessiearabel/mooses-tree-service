#!/usr/bin/env python3
"""
PayPal Integration Specific Test
Tests PayPal endpoints with current credentials to verify if they are working
"""

import requests
import json
import sys
import os
from datetime import datetime

# Configuration
BACKEND_URL = "https://moose-learning-hub.preview.emergentagent.com/api"

# Test user credentials for PayPal testing
TEST_USER_DATA = {
    "username": f"paypal_test_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
    "email": f"paypal_test_{datetime.now().strftime('%Y%m%d_%H%M%S')}@example.com",
    "password": "SecurePass123!",
    "name": "PayPal Test User",
    "language": "en"
}

class PayPalTester:
    def __init__(self):
        self.session = requests.Session()
        self.test_user_token = None
        self.test_user_id = None
        
    def setup_test_user(self):
        """Create a test user and get authentication token"""
        try:
            # Register test user
            response = self.session.post(
                f"{BACKEND_URL}/auth/register",
                json=TEST_USER_DATA,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code != 200:
                print(f"❌ Registration failed: {response.status_code} - {response.text}")
                return False
            
            # Login to get token
            login_response = self.session.post(
                f"{BACKEND_URL}/auth/login",
                json={"username": TEST_USER_DATA["username"], "password": TEST_USER_DATA["password"]},
                headers={"Content-Type": "application/json"}
            )
            
            if login_response.status_code == 200:
                data = login_response.json()
                self.test_user_token = data["access_token"]
                self.test_user_id = data["user"]["id"]
                print(f"✅ Test user created and authenticated: {TEST_USER_DATA['username']}")
                return True
            else:
                print(f"❌ Login failed: {login_response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Setup failed: {str(e)}")
            return False
    
    def create_subscription(self):
        """Create a subscription for the test user"""
        try:
            subscription_data = {"planId": "monthly_10", "startTrial": True}
            
            response = self.session.post(
                f"{BACKEND_URL}/subscriptions/subscribe",
                json=subscription_data,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {self.test_user_token}"
                }
            )
            
            if response.status_code == 200:
                print("✅ Subscription created successfully")
                return True
            else:
                print(f"❌ Subscription creation failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Subscription creation error: {str(e)}")
            return False
    
    def test_paypal_create_payment(self):
        """Test PayPal payment creation"""
        print("\n🔍 Testing PayPal Create Payment Endpoint")
        print("=" * 50)
        
        try:
            response = self.session.post(
                f"{BACKEND_URL}/subscriptions/create-payment",
                headers={"Authorization": f"Bearer {self.test_user_token}"}
            )
            
            print(f"Status Code: {response.status_code}")
            print(f"Response: {response.text}")
            
            if response.status_code == 200:
                data = response.json()
                if "paymentId" in data and "approvalUrl" in data:
                    print("✅ PayPal payment created successfully!")
                    print(f"   Payment ID: {data['paymentId']}")
                    print(f"   Approval URL: {data['approvalUrl']}")
                    return True
                else:
                    print("❌ PayPal payment response missing required fields")
                    return False
            elif response.status_code == 400:
                try:
                    error_data = response.json()
                    if "Failed to create PayPal payment" in error_data.get("detail", ""):
                        print("❌ PayPal payment creation failed - likely credential issue")
                        print("   This indicates PayPal credentials are invalid or not configured properly")
                        return False
                except:
                    pass
                print("❌ PayPal payment creation failed with 400 error")
                return False
            elif response.status_code == 500:
                print("❌ Internal server error - PayPal integration issue")
                print("   This typically indicates PayPal SDK authentication failure")
                return False
            else:
                print(f"❌ Unexpected status code: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Exception during PayPal test: {str(e)}")
            return False
    
    def test_paypal_execute_payment(self):
        """Test PayPal payment execution (with fake IDs to test validation)"""
        print("\n🔍 Testing PayPal Execute Payment Endpoint")
        print("=" * 50)
        
        try:
            response = self.session.post(
                f"{BACKEND_URL}/subscriptions/execute-payment",
                params={"payment_id": "PAYID-FAKE123", "payer_id": "PAYER-FAKE123"},
                headers={"Authorization": f"Bearer {self.test_user_token}"}
            )
            
            print(f"Status Code: {response.status_code}")
            print(f"Response: {response.text}")
            
            # We expect this to fail since we're using fake IDs, but it should fail gracefully
            if response.status_code == 400:
                print("✅ PayPal execute endpoint is accessible and validates input")
                return True
            else:
                print(f"❌ Unexpected response for execute payment test")
                return False
                
        except Exception as e:
            print(f"❌ Exception during PayPal execute test: {str(e)}")
            return False
    
    def run_paypal_tests(self):
        """Run PayPal-specific tests"""
        print("=" * 60)
        print("PAYPAL INTEGRATION TESTING")
        print("=" * 60)
        print(f"Backend URL: {BACKEND_URL}")
        print("=" * 60)
        
        # Setup
        print("\n🔧 SETUP")
        if not self.setup_test_user():
            print("❌ Cannot proceed without test user")
            return False
        
        if not self.create_subscription():
            print("❌ Cannot proceed without subscription")
            return False
        
        # Test PayPal endpoints
        create_success = self.test_paypal_create_payment()
        execute_success = self.test_paypal_execute_payment()
        
        # Summary
        print("\n" + "=" * 60)
        print("PAYPAL TEST SUMMARY")
        print("=" * 60)
        
        if create_success:
            print("✅ PayPal Create Payment: WORKING")
        else:
            print("❌ PayPal Create Payment: FAILED")
            
        if execute_success:
            print("✅ PayPal Execute Payment: ACCESSIBLE")
        else:
            print("❌ PayPal Execute Payment: FAILED")
        
        overall_success = create_success and execute_success
        
        if overall_success:
            print("\n🎉 PayPal integration is working correctly!")
        else:
            print("\n⚠️  PayPal integration has issues:")
            if not create_success:
                print("   - Payment creation failing (likely credential issue)")
            if not execute_success:
                print("   - Payment execution endpoint not accessible")
        
        print("=" * 60)
        return overall_success

if __name__ == "__main__":
    tester = PayPalTester()
    success = tester.run_paypal_tests()
    sys.exit(0 if success else 1)