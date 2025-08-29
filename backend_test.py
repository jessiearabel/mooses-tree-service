#!/usr/bin/env python3
"""
Backend API Testing for Admin Portal
Tests all admin endpoints with proper authentication and error handling
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

class AdminAPITester:
    def __init__(self):
        self.session = requests.Session()
        self.test_results = []
        self.created_user_id = None
        self.created_question_id = None
        
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
        """Run all admin API tests"""
        print("=" * 60)
        print("ADMIN PORTAL BACKEND API TESTING")
        print("=" * 60)
        print(f"Backend URL: {BACKEND_URL}")
        print(f"Admin Password: {ADMIN_PASSWORD}")
        print("=" * 60)
        
        # Authentication Tests
        print("\n🔐 AUTHENTICATION TESTS")
        self.test_admin_login_valid()
        self.test_admin_login_invalid()
        
        # User Management Tests
        print("\n👥 USER MANAGEMENT TESTS")
        self.test_get_users_valid()
        self.test_get_users_invalid()
        self.test_create_user_valid()
        self.test_create_user_invalid()
        self.test_delete_nonexistent_user()
        
        # Question Management Tests
        print("\n❓ QUESTION MANAGEMENT TESTS")
        self.test_get_questions_valid()
        self.test_get_questions_with_filter()
        self.test_get_questions_invalid()
        self.test_create_question_valid()
        self.test_create_question_invalid()
        self.test_delete_nonexistent_question()
        
        # Statistics Tests
        print("\n📊 STATISTICS TESTS")
        self.test_get_stats_valid()
        self.test_get_stats_invalid()
        
        # Summary
        self.print_summary()
    
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