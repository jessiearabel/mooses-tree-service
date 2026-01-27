#!/usr/bin/env python3
"""
Focused PayPal Integration Testing
Tests specifically the PayPal endpoints with real credentials
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
    "password": "PayPalTest123!",
    "name": "PayPal Integration Test User",
    "language": "en"
}

class PayPalTester:
    def __init__(self):
        self.session = requests.Session()
        self.test_user_token = None
        self.test_user_id = None
        self.payment_id = None
        
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
    
    def get_auth_headers(self):
        """Get authorization headers for authenticated requests"""
        if not self.test_user_token:
            return {}
        return {"Authorization": f"Bearer {self.test_user_token}"}
    
    def create_subscription(self):
        """Create a subscription for PayPal testing"""
        try:
            subscription_data = {"planId": "monthly_10", "startTrial": True}
            
            response = self.session.post(
                f"{BACKEND_URL}/subscriptions/subscribe",
                json=subscription_data,
                headers={**{"Content-Type": "application/json"}, **self.get_auth_headers()}
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Subscription created: Status={data['status']}, Days remaining={data['daysRemaining']}")
                return True
            else:
                print(f"❌ Subscription creation failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Subscription creation error: {str(e)}")
            return False
    
    def test_paypal_create_payment(self):
        """Test PayPal payment creation with real credentials"""
        try:
            print("\n🔍 Testing PayPal Payment Creation...")
            
            response = self.session.post(
                f"{BACKEND_URL}/subscriptions/create-payment",
                headers=self.get_auth_headers()
            )
            
            print(f"Response Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ PayPal Payment Created Successfully!")
                print(f"   Payment ID: {data.get('paymentId')}")
                print(f"   Approval URL: {data.get('approvalUrl')}")
                
                # Store payment ID for potential execution test
                self.payment_id = data.get('paymentId')
                
                # Validate response structure
                if "paymentId" in data and "approvalUrl" in data:
                    print("✅ Response contains required fields (paymentId, approvalUrl)")
                    
                    # Check if approval URL is valid PayPal URL
                    if "paypal.com" in data["approvalUrl"]:
                        print("✅ Approval URL is valid PayPal URL")
                    else:
                        print(f"⚠️  Approval URL doesn't contain paypal.com: {data['approvalUrl']}")
                        
                    return True
                else:
                    print(f"❌ Missing required fields in response: {data}")
                    return False
                    
            elif response.status_code == 400:
                data = response.json()
                print(f"❌ PayPal Payment Creation Failed: {data.get('detail')}")
                
                # Check if it's still a credential issue
                if "Failed to create PayPal payment" in data.get("detail", ""):
                    print("❌ This indicates PayPal API is still rejecting the request")
                    print("   Possible causes:")
                    print("   1. Credentials are still invalid")
                    print("   2. PayPal sandbox account is not properly configured")
                    print("   3. PayPal API endpoint issues")
                
                return False
            else:
                print(f"❌ Unexpected status code: {response.status_code}")
                print(f"   Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ PayPal payment creation error: {str(e)}")
            return False
    
    def test_paypal_execute_payment_structure(self):
        """Test PayPal payment execution endpoint structure"""
        try:
            print("\n🔍 Testing PayPal Payment Execution Structure...")
            
            # Test with fake payment ID to check endpoint structure
            response = self.session.post(
                f"{BACKEND_URL}/subscriptions/execute-payment",
                params={"payment_id": "fake_payment_id", "payer_id": "fake_payer_id"},
                headers=self.get_auth_headers()
            )
            
            print(f"Response Status: {response.status_code}")
            
            if response.status_code == 400:
                data = response.json()
                print(f"✅ Execute payment endpoint is working (expected failure with fake ID)")
                print(f"   Error message: {data.get('detail')}")
                
                # Check if it's trying to communicate with PayPal
                if "Failed to execute PayPal payment" in data.get("detail", ""):
                    print("✅ Endpoint is attempting PayPal communication")
                    return True
                else:
                    print(f"⚠️  Unexpected error message: {data}")
                    return False
                    
            else:
                print(f"❌ Unexpected status code: {response.status_code}")
                print(f"   Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ PayPal execute payment test error: {str(e)}")
            return False
    
    def check_payment_record_in_database(self):
        """Check if payment record was created in database"""
        try:
            print("\n🔍 Checking Payment Records in Database...")
            
            response = self.session.get(
                f"{BACKEND_URL}/subscriptions/payments",
                headers=self.get_auth_headers()
            )
            
            if response.status_code == 200:
                payments = response.json()
                print(f"✅ Retrieved {len(payments)} payment records")
                
                if payments:
                    latest_payment = payments[-1]  # Get most recent payment
                    print(f"   Latest Payment ID: {latest_payment.get('paypalOrderId')}")
                    print(f"   Amount: ${latest_payment.get('amount')}")
                    print(f"   Status: {latest_payment.get('status')}")
                    print(f"   Currency: {latest_payment.get('currency')}")
                    
                    # Verify payment record structure
                    required_fields = ["userId", "paypalOrderId", "amount", "currency", "status"]
                    missing_fields = [field for field in required_fields if field not in latest_payment]
                    
                    if not missing_fields:
                        print("✅ Payment record has all required fields")
                        return True
                    else:
                        print(f"❌ Payment record missing fields: {missing_fields}")
                        return False
                else:
                    print("⚠️  No payment records found")
                    return False
                    
            else:
                print(f"❌ Failed to retrieve payment records: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Payment record check error: {str(e)}")
            return False
    
    def run_paypal_tests(self):
        """Run comprehensive PayPal integration tests"""
        print("=" * 70)
        print("PAYPAL INTEGRATION TESTING WITH REAL CREDENTIALS")
        print("=" * 70)
        print(f"Backend URL: {BACKEND_URL}")
        print("=" * 70)
        
        # Setup
        print("\n🔧 SETUP")
        if not self.setup_test_user():
            print("❌ Failed to setup test user. Cannot proceed with PayPal tests.")
            return False
        
        if not self.create_subscription():
            print("❌ Failed to create subscription. Cannot proceed with PayPal tests.")
            return False
        
        # PayPal Tests
        print("\n💰 PAYPAL INTEGRATION TESTS")
        
        results = []
        
        # Test 1: PayPal Payment Creation
        result1 = self.test_paypal_create_payment()
        results.append(("PayPal Payment Creation", result1))
        
        # Test 2: PayPal Payment Execution Structure
        result2 = self.test_paypal_execute_payment_structure()
        results.append(("PayPal Payment Execution Structure", result2))
        
        # Test 3: Payment Record in Database
        result3 = self.check_payment_record_in_database()
        results.append(("Payment Database Record", result3))
        
        # Summary
        print("\n" + "=" * 70)
        print("PAYPAL TEST SUMMARY")
        print("=" * 70)
        
        passed = sum(1 for _, result in results if result)
        total = len(results)
        
        for test_name, result in results:
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{status} {test_name}")
        
        print(f"\nTotal Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        if passed == total:
            print("\n🎉 ALL PAYPAL TESTS PASSED!")
            print("✅ PayPal integration is fully functional with real credentials")
            print("✅ Payment creation works correctly")
            print("✅ Payment execution endpoint is properly structured")
            print("✅ Payment records are stored in database")
        else:
            print(f"\n⚠️  {total - passed} test(s) failed")
        
        print("=" * 70)
        
        return passed == total

if __name__ == "__main__":
    tester = PayPalTester()
    success = tester.run_paypal_tests()
    sys.exit(0 if success else 1)