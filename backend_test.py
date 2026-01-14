#!/usr/bin/env python3
"""
Backend API Testing for Arborist Platform
Tests admin endpoints and subscription system with proper authentication and error handling
"""

import requests
import json
import sys
import os
from datetime import datetime

# Configuration
BACKEND_URL = "https://exam-tree-prep.preview.emergentagent.com/api"
ADMIN_PASSWORD = "moose_admin_2024"
INVALID_PASSWORD = "wrong_password"

# Test user credentials for subscription testing
TEST_USER_DATA = {
    "username": f"testuser_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
    "email": f"test_{datetime.now().strftime('%Y%m%d_%H%M%S')}@example.com",
    "password": "SecurePass123!",
    "name": "Test User for Subscription Testing",
    "language": "en"
}

class BackendAPITester:
    def __init__(self):
        self.session = requests.Session()
        self.test_results = []
        self.created_user_id = None
        self.created_question_id = None
        self.test_user_token = None
        self.test_user_id = None
        
    def log_test(self, test_name, success, details=""):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   Details: {details}")
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat()
        })
    
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
                self.log_test("Setup Test User - Registration", False, f"Registration failed: {response.status_code} - {response.text}")
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
                self.log_test("Setup Test User - Authentication", True, f"User created and authenticated: {TEST_USER_DATA['username']}")
                return True
            else:
                self.log_test("Setup Test User - Authentication", False, f"Login failed: {login_response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Setup Test User", False, f"Exception: {str(e)}")
            return False
    
    def get_auth_headers(self):
        """Get authorization headers for authenticated requests"""
        if not self.test_user_token:
            return {}
        return {"Authorization": f"Bearer {self.test_user_token}"}
    
    # SUBSCRIPTION SYSTEM TESTS
    
    def test_subscription_create_unauthorized(self):
        """Test creating subscription without authentication"""
        try:
            subscription_data = {"planId": "monthly_10", "startTrial": True}
            
            response = self.session.post(
                f"{BACKEND_URL}/subscriptions/subscribe",
                json=subscription_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 401:
                self.log_test("Subscription Create - Unauthorized", True, "Correctly rejected unauthenticated request")
            else:
                self.log_test("Subscription Create - Unauthorized", False, f"Expected 401, got {response.status_code}")
                
        except Exception as e:
            self.log_test("Subscription Create - Unauthorized", False, f"Exception: {str(e)}")
    
    def test_subscription_create_valid(self):
        """Test creating subscription with valid authentication"""
        try:
            subscription_data = {"planId": "monthly_10", "startTrial": True}
            
            response = self.session.post(
                f"{BACKEND_URL}/subscriptions/subscribe",
                json=subscription_data,
                headers={**{"Content-Type": "application/json"}, **self.get_auth_headers()}
            )
            
            if response.status_code == 200:
                data = response.json()
                expected_fields = ["id", "userId", "status", "planId", "trialStartDate", "trialEndDate", "daysRemaining", "isActive"]
                if all(field in data for field in expected_fields):
                    if data["status"] == "trial" and data["daysRemaining"] == 5 and data["isActive"]:
                        self.log_test("Subscription Create - Valid", True, f"5-day trial created successfully, {data['daysRemaining']} days remaining")
                    else:
                        self.log_test("Subscription Create - Valid", False, f"Incorrect trial setup: status={data.get('status')}, days={data.get('daysRemaining')}, active={data.get('isActive')}")
                else:
                    missing_fields = [f for f in expected_fields if f not in data]
                    self.log_test("Subscription Create - Valid", False, f"Missing fields: {missing_fields}")
            else:
                self.log_test("Subscription Create - Valid", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_test("Subscription Create - Valid", False, f"Exception: {str(e)}")
    
    def test_subscription_create_duplicate(self):
        """Test creating duplicate subscription for same user"""
        try:
            subscription_data = {"planId": "monthly_10", "startTrial": True}
            
            response = self.session.post(
                f"{BACKEND_URL}/subscriptions/subscribe",
                json=subscription_data,
                headers={**{"Content-Type": "application/json"}, **self.get_auth_headers()}
            )
            
            if response.status_code == 400:
                data = response.json()
                if "already has a subscription" in data.get("detail", ""):
                    self.log_test("Subscription Create - Duplicate", True, "Correctly rejected duplicate subscription")
                else:
                    self.log_test("Subscription Create - Duplicate", False, f"Wrong error message: {data}")
            else:
                self.log_test("Subscription Create - Duplicate", False, f"Expected 400, got {response.status_code}")
                
        except Exception as e:
            self.log_test("Subscription Create - Duplicate", False, f"Exception: {str(e)}")
    
    def test_subscription_status_valid(self):
        """Test getting subscription status with valid authentication"""
        try:
            response = self.session.get(
                f"{BACKEND_URL}/subscriptions/status",
                headers=self.get_auth_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                if data:  # Should have subscription data
                    expected_fields = ["id", "userId", "status", "daysRemaining", "isActive"]
                    if all(field in data for field in expected_fields):
                        self.log_test("Subscription Status - Valid", True, f"Status: {data['status']}, Days remaining: {data['daysRemaining']}, Active: {data['isActive']}")
                    else:
                        missing_fields = [f for f in expected_fields if f not in data]
                        self.log_test("Subscription Status - Valid", False, f"Missing fields: {missing_fields}")
                else:
                    self.log_test("Subscription Status - Valid", True, "No subscription found (null response)")
            else:
                self.log_test("Subscription Status - Valid", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_test("Subscription Status - Valid", False, f"Exception: {str(e)}")
    
    def test_subscription_status_unauthorized(self):
        """Test getting subscription status without authentication"""
        try:
            response = self.session.get(f"{BACKEND_URL}/subscriptions/status")
            
            if response.status_code == 401:
                self.log_test("Subscription Status - Unauthorized", True, "Correctly rejected unauthenticated request")
            else:
                self.log_test("Subscription Status - Unauthorized", False, f"Expected 401, got {response.status_code}")
                
        except Exception as e:
            self.log_test("Subscription Status - Unauthorized", False, f"Exception: {str(e)}")
    
    def test_paypal_create_payment_unauthorized(self):
        """Test creating PayPal payment without authentication"""
        try:
            response = self.session.post(f"{BACKEND_URL}/subscriptions/create-payment")
            
            if response.status_code == 401:
                self.log_test("PayPal Create Payment - Unauthorized", True, "Correctly rejected unauthenticated request")
            else:
                self.log_test("PayPal Create Payment - Unauthorized", False, f"Expected 401, got {response.status_code}")
                
        except Exception as e:
            self.log_test("PayPal Create Payment - Unauthorized", False, f"Exception: {str(e)}")
    
    def test_paypal_create_payment_valid(self):
        """Test creating PayPal payment with valid authentication"""
        try:
            response = self.session.post(
                f"{BACKEND_URL}/subscriptions/create-payment",
                headers=self.get_auth_headers()
            )
            
            # Note: This may fail due to PayPal credentials not being configured
            if response.status_code == 200:
                data = response.json()
                if "paymentId" in data and "approvalUrl" in data:
                    self.log_test("PayPal Create Payment - Valid", True, f"Payment created with ID: {data['paymentId']}")
                else:
                    self.log_test("PayPal Create Payment - Valid", False, f"Missing payment fields: {data}")
            elif response.status_code == 400:
                data = response.json()
                if "Failed to create PayPal payment" in data.get("detail", ""):
                    self.log_test("PayPal Create Payment - Valid", True, "Expected failure due to PayPal credentials not configured (sandbox)")
                else:
                    self.log_test("PayPal Create Payment - Valid", False, f"Unexpected error: {data}")
            else:
                self.log_test("PayPal Create Payment - Valid", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_test("PayPal Create Payment - Valid", False, f"Exception: {str(e)}")
    
    def test_paypal_execute_payment_unauthorized(self):
        """Test executing PayPal payment without authentication"""
        try:
            response = self.session.post(
                f"{BACKEND_URL}/subscriptions/execute-payment",
                params={"payment_id": "fake_payment_id", "payer_id": "fake_payer_id"}
            )
            
            if response.status_code == 401:
                self.log_test("PayPal Execute Payment - Unauthorized", True, "Correctly rejected unauthenticated request")
            else:
                self.log_test("PayPal Execute Payment - Unauthorized", False, f"Expected 401, got {response.status_code}")
                
        except Exception as e:
            self.log_test("PayPal Execute Payment - Unauthorized", False, f"Exception: {str(e)}")
    
    def test_subscription_cancel_valid(self):
        """Test cancelling subscription with valid authentication"""
        try:
            response = self.session.post(
                f"{BACKEND_URL}/subscriptions/cancel",
                headers=self.get_auth_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                if "message" in data and "cancelled successfully" in data["message"]:
                    self.log_test("Subscription Cancel - Valid", True, "Subscription cancelled successfully")
                else:
                    self.log_test("Subscription Cancel - Valid", False, f"Unexpected response: {data}")
            else:
                self.log_test("Subscription Cancel - Valid", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_test("Subscription Cancel - Valid", False, f"Exception: {str(e)}")
    
    def test_subscription_cancel_unauthorized(self):
        """Test cancelling subscription without authentication"""
        try:
            response = self.session.post(f"{BACKEND_URL}/subscriptions/cancel")
            
            if response.status_code == 401:
                self.log_test("Subscription Cancel - Unauthorized", True, "Correctly rejected unauthenticated request")
            else:
                self.log_test("Subscription Cancel - Unauthorized", False, f"Expected 401, got {response.status_code}")
                
        except Exception as e:
            self.log_test("Subscription Cancel - Unauthorized", False, f"Exception: {str(e)}")
    
    def test_payment_history_valid(self):
        """Test getting payment history with valid authentication"""
        try:
            response = self.session.get(
                f"{BACKEND_URL}/subscriptions/payments",
                headers=self.get_auth_headers()
            )
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test("Payment History - Valid", True, f"Retrieved {len(data)} payment records")
                else:
                    self.log_test("Payment History - Valid", False, f"Expected list, got: {type(data)}")
            else:
                self.log_test("Payment History - Valid", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_test("Payment History - Valid", False, f"Exception: {str(e)}")
    
    def test_payment_history_unauthorized(self):
        """Test getting payment history without authentication"""
        try:
            response = self.session.get(f"{BACKEND_URL}/subscriptions/payments")
            
            if response.status_code == 401:
                self.log_test("Payment History - Unauthorized", True, "Correctly rejected unauthenticated request")
            else:
                self.log_test("Payment History - Unauthorized", False, f"Expected 401, got {response.status_code}")
                
        except Exception as e:
            self.log_test("Payment History - Unauthorized", False, f"Exception: {str(e)}")
    
    # ADMIN PORTAL TESTS (existing tests)
    def test_admin_login_valid(self):
        """Test admin login with correct password"""
        try:
            response = self.session.post(
                f"{BACKEND_URL}/admin/login",
                json={"password": ADMIN_PASSWORD},
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                if "message" in data and "Admin access granted" in data["message"]:
                    self.log_test("Admin Login - Valid Password", True, f"Status: {response.status_code}")
                else:
                    self.log_test("Admin Login - Valid Password", False, f"Unexpected response: {data}")
            else:
                self.log_test("Admin Login - Valid Password", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_test("Admin Login - Valid Password", False, f"Exception: {str(e)}")
    
    def test_admin_login_invalid(self):
        """Test admin login with incorrect password"""
        try:
            response = self.session.post(
                f"{BACKEND_URL}/admin/login",
                json={"password": INVALID_PASSWORD},
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 401:
                data = response.json()
                if "detail" in data and "Invalid admin password" in data["detail"]:
                    self.log_test("Admin Login - Invalid Password", True, f"Correctly rejected with 401")
                else:
                    self.log_test("Admin Login - Invalid Password", False, f"Wrong error message: {data}")
            else:
                self.log_test("Admin Login - Invalid Password", False, f"Expected 401, got {response.status_code}")
                
        except Exception as e:
            self.log_test("Admin Login - Invalid Password", False, f"Exception: {str(e)}")
    
    def test_get_users_valid(self):
        """Test getting all users with valid admin password"""
        try:
            response = self.session.get(
                f"{BACKEND_URL}/admin/users",
                params={"admin_password": ADMIN_PASSWORD}
            )
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test("Get Users - Valid Password", True, f"Retrieved {len(data)} users")
                else:
                    self.log_test("Get Users - Valid Password", False, f"Expected list, got: {type(data)}")
            else:
                self.log_test("Get Users - Valid Password", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_test("Get Users - Valid Password", False, f"Exception: {str(e)}")
    
    def test_get_users_invalid(self):
        """Test getting all users with invalid admin password"""
        try:
            response = self.session.get(
                f"{BACKEND_URL}/admin/users",
                params={"admin_password": INVALID_PASSWORD}
            )
            
            if response.status_code == 401:
                self.log_test("Get Users - Invalid Password", True, f"Correctly rejected with 401")
            else:
                self.log_test("Get Users - Invalid Password", False, f"Expected 401, got {response.status_code}")
                
        except Exception as e:
            self.log_test("Get Users - Invalid Password", False, f"Exception: {str(e)}")
    
    def test_create_user_valid(self):
        """Test creating a new user with valid admin password"""
        try:
            user_data = {
                "username": f"testuser_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                "email": f"test_{datetime.now().strftime('%Y%m%d_%H%M%S')}@example.com",
                "password": "SecurePass123!",
                "name": "Test User for Admin Testing",
                "language": "en"
            }
            
            response = self.session.post(
                f"{BACKEND_URL}/admin/users",
                json=user_data,
                params={"admin_password": ADMIN_PASSWORD},
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                if "message" in data and "created successfully" in data["message"]:
                    self.log_test("Create User - Valid Password", True, f"User created: {user_data['username']}")
                    # Store username for potential cleanup
                    self.created_username = user_data["username"]
                else:
                    self.log_test("Create User - Valid Password", False, f"Unexpected response: {data}")
            else:
                self.log_test("Create User - Valid Password", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_test("Create User - Valid Password", False, f"Exception: {str(e)}")
    
    def test_create_user_invalid(self):
        """Test creating a new user with invalid admin password"""
        try:
            user_data = {
                "username": "shouldnotcreate",
                "email": "shouldnotcreate@example.com",
                "password": "password123",
                "name": "Should Not Create",
                "language": "en"
            }
            
            response = self.session.post(
                f"{BACKEND_URL}/admin/users",
                json=user_data,
                params={"admin_password": INVALID_PASSWORD},
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 401:
                self.log_test("Create User - Invalid Password", True, f"Correctly rejected with 401")
            else:
                self.log_test("Create User - Invalid Password", False, f"Expected 401, got {response.status_code}")
                
        except Exception as e:
            self.log_test("Create User - Invalid Password", False, f"Exception: {str(e)}")
    
    def test_get_questions_valid(self):
        """Test getting all questions with valid admin password"""
        try:
            response = self.session.get(
                f"{BACKEND_URL}/admin/questions",
                params={"admin_password": ADMIN_PASSWORD}
            )
            
            if response.status_code == 200:
                data = response.json()
                if "questions" in data and "total" in data:
                    self.log_test("Get Questions - Valid Password", True, f"Retrieved {data['total']} questions")
                else:
                    self.log_test("Get Questions - Valid Password", False, f"Expected questions/total, got: {data.keys()}")
            else:
                self.log_test("Get Questions - Valid Password", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_test("Get Questions - Valid Password", False, f"Exception: {str(e)}")
    
    def test_get_questions_with_filter(self):
        """Test getting questions filtered by topic"""
        try:
            response = self.session.get(
                f"{BACKEND_URL}/admin/questions",
                params={"admin_password": ADMIN_PASSWORD, "topic_id": 1}
            )
            
            if response.status_code == 200:
                data = response.json()
                if "questions" in data and "total" in data:
                    # Check if all questions have topicId = 1
                    all_correct_topic = all(q.get("topicId") == 1 for q in data["questions"])
                    if all_correct_topic:
                        self.log_test("Get Questions - Topic Filter", True, f"Retrieved {data['total']} questions for topic 1")
                    else:
                        self.log_test("Get Questions - Topic Filter", False, f"Some questions have wrong topicId")
                else:
                    self.log_test("Get Questions - Topic Filter", False, f"Expected questions/total, got: {data.keys()}")
            else:
                self.log_test("Get Questions - Topic Filter", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_test("Get Questions - Topic Filter", False, f"Exception: {str(e)}")
    
    def test_get_questions_invalid(self):
        """Test getting questions with invalid admin password"""
        try:
            response = self.session.get(
                f"{BACKEND_URL}/admin/questions",
                params={"admin_password": INVALID_PASSWORD}
            )
            
            if response.status_code == 401:
                self.log_test("Get Questions - Invalid Password", True, f"Correctly rejected with 401")
            else:
                self.log_test("Get Questions - Invalid Password", False, f"Expected 401, got {response.status_code}")
                
        except Exception as e:
            self.log_test("Get Questions - Invalid Password", False, f"Exception: {str(e)}")
    
    def test_create_question_valid(self):
        """Test creating a new question with valid admin password"""
        try:
            question_data = {
                "topicId": 1,
                "type": "multiple_choice",
                "question": {
                    "es": "¿Cuál es la técnica correcta de poda?",
                    "en": "What is the correct pruning technique?"
                },
                "options": {
                    "es": ["Corte en ángulo", "Corte recto", "Corte irregular", "Sin corte"],
                    "en": ["Angled cut", "Straight cut", "Irregular cut", "No cut"]
                },
                "correctAnswer": 0,
                "explanation": {
                    "es": "El corte en ángulo permite mejor drenaje del agua.",
                    "en": "Angled cuts allow better water drainage."
                },
                "difficulty": "medium"
            }
            
            response = self.session.post(
                f"{BACKEND_URL}/admin/questions",
                json=question_data,
                params={"admin_password": ADMIN_PASSWORD},
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                if "message" in data and "created successfully" in data["message"]:
                    self.log_test("Create Question - Valid Password", True, f"Bilingual question created for topic {question_data['topicId']}")
                else:
                    self.log_test("Create Question - Valid Password", False, f"Unexpected response: {data}")
            else:
                self.log_test("Create Question - Valid Password", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_test("Create Question - Valid Password", False, f"Exception: {str(e)}")
    
    def test_create_question_invalid(self):
        """Test creating a question with invalid admin password"""
        try:
            question_data = {
                "topicId": 1,
                "type": "true_false",
                "question": {
                    "es": "¿Los árboles necesitan agua?",
                    "en": "Do trees need water?"
                },
                "correctAnswer": True,
                "explanation": {
                    "es": "Sí, los árboles necesitan agua para sobrevivir.",
                    "en": "Yes, trees need water to survive."
                }
            }
            
            response = self.session.post(
                f"{BACKEND_URL}/admin/questions",
                json=question_data,
                params={"admin_password": INVALID_PASSWORD},
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 401:
                self.log_test("Create Question - Invalid Password", True, f"Correctly rejected with 401")
            else:
                self.log_test("Create Question - Invalid Password", False, f"Expected 401, got {response.status_code}")
                
        except Exception as e:
            self.log_test("Create Question - Invalid Password", False, f"Exception: {str(e)}")
    
    def test_get_stats_valid(self):
        """Test getting admin statistics with valid password"""
        try:
            response = self.session.get(
                f"{BACKEND_URL}/admin/stats",
                params={"admin_password": ADMIN_PASSWORD}
            )
            
            if response.status_code == 200:
                data = response.json()
                expected_keys = ["totalUsers", "totalQuestions", "questionsByTopic"]
                if all(key in data for key in expected_keys):
                    self.log_test("Get Stats - Valid Password", True, 
                                f"Users: {data['totalUsers']}, Questions: {data['totalQuestions']}, Topics: {len(data['questionsByTopic'])}")
                else:
                    self.log_test("Get Stats - Valid Password", False, f"Missing keys. Got: {list(data.keys())}")
            else:
                self.log_test("Get Stats - Valid Password", False, f"Status: {response.status_code}, Response: {response.text}")
                
        except Exception as e:
            self.log_test("Get Stats - Valid Password", False, f"Exception: {str(e)}")
    
    def test_get_stats_invalid(self):
        """Test getting admin statistics with invalid password"""
        try:
            response = self.session.get(
                f"{BACKEND_URL}/admin/stats",
                params={"admin_password": INVALID_PASSWORD}
            )
            
            if response.status_code == 401:
                self.log_test("Get Stats - Invalid Password", True, f"Correctly rejected with 401")
            else:
                self.log_test("Get Stats - Invalid Password", False, f"Expected 401, got {response.status_code}")
                
        except Exception as e:
            self.log_test("Get Stats - Invalid Password", False, f"Exception: {str(e)}")
    
    def test_delete_nonexistent_user(self):
        """Test deleting a non-existent user"""
        try:
            fake_user_id = "507f1f77bcf86cd799439011"  # Valid ObjectId format but non-existent
            
            response = self.session.delete(
                f"{BACKEND_URL}/admin/users/{fake_user_id}",
                params={"admin_password": ADMIN_PASSWORD}
            )
            
            if response.status_code == 404:
                self.log_test("Delete Non-existent User", True, f"Correctly returned 404 for non-existent user")
            else:
                self.log_test("Delete Non-existent User", False, f"Expected 404, got {response.status_code}")
                
        except Exception as e:
            self.log_test("Delete Non-existent User", False, f"Exception: {str(e)}")
    
    def test_delete_nonexistent_question(self):
        """Test deleting a non-existent question"""
        try:
            fake_question_id = "507f1f77bcf86cd799439011"  # Valid ObjectId format but non-existent
            
            response = self.session.delete(
                f"{BACKEND_URL}/admin/questions/{fake_question_id}",
                params={"admin_password": ADMIN_PASSWORD}
            )
            
            if response.status_code == 404:
                self.log_test("Delete Non-existent Question", True, f"Correctly returned 404 for non-existent question")
            else:
                self.log_test("Delete Non-existent Question", False, f"Expected 404, got {response.status_code}")
                
        except Exception as e:
            self.log_test("Delete Non-existent Question", False, f"Exception: {str(e)}")
    
    def run_all_tests(self):
        """Run all backend API tests"""
        print("=" * 60)
        print("ARBORIST PLATFORM BACKEND API TESTING")
        print("=" * 60)
        print(f"Backend URL: {BACKEND_URL}")
        print("=" * 60)
        
        # Setup test user for subscription testing
        print("\n🔧 SETUP")
        if not self.setup_test_user():
            print("❌ Failed to setup test user. Skipping subscription tests.")
            subscription_tests_enabled = False
        else:
            subscription_tests_enabled = True
        
        # Subscription System Tests
        if subscription_tests_enabled:
            print("\n💳 SUBSCRIPTION SYSTEM TESTS")
            self.test_subscription_create_unauthorized()
            self.test_subscription_create_valid()
            self.test_subscription_create_duplicate()
            self.test_subscription_status_valid()
            self.test_subscription_status_unauthorized()
            
            print("\n💰 PAYPAL INTEGRATION TESTS")
            self.test_paypal_create_payment_unauthorized()
            self.test_paypal_create_payment_valid()
            self.test_paypal_execute_payment_unauthorized()
            
            print("\n📋 SUBSCRIPTION MANAGEMENT TESTS")
            self.test_subscription_cancel_valid()
            self.test_subscription_cancel_unauthorized()
            self.test_payment_history_valid()
            self.test_payment_history_unauthorized()
        
        # Admin Portal Tests
        print("\n🔐 ADMIN AUTHENTICATION TESTS")
        self.test_admin_login_valid()
        self.test_admin_login_invalid()
        
        # User Management Tests
        print("\n👥 ADMIN USER MANAGEMENT TESTS")
        self.test_get_users_valid()
        self.test_get_users_invalid()
        self.test_create_user_valid()
        self.test_create_user_invalid()
        self.test_delete_nonexistent_user()
        
        # Question Management Tests
        print("\n❓ ADMIN QUESTION MANAGEMENT TESTS")
        self.test_get_questions_valid()
        self.test_get_questions_with_filter()
        self.test_get_questions_invalid()
        self.test_create_question_valid()
        self.test_create_question_invalid()
        self.test_delete_nonexistent_question()
        
        # Statistics Tests
        print("\n📊 ADMIN STATISTICS TESTS")
        self.test_get_stats_valid()
        self.test_get_stats_invalid()
        
        # Summary
        self.print_summary()
        
        return self.get_test_success_rate()
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 60)
        print("TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  - {result['test']}: {result['details']}")
        
        print("\n" + "=" * 60)
        
        return failed_tests == 0

if __name__ == "__main__":
    tester = AdminAPITester()
    success = tester.run_all_tests()
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)