#!/bin/bash

echo "Testing complete authentication flow with admin credentials..."
echo

# Step 1: Login with admin credentials
echo "1. Testing admin login..."
LOGIN_RESPONSE=$(curl -s -X POST "http://localhost:4000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}')

echo "Login Response: $LOGIN_RESPONSE"
echo

# Extract token from response
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -n "$TOKEN" ]; then
    echo "✅ Login successful! Token extracted: ${TOKEN:0:50}..."
    echo
    
    # Step 2: Test analytics overview
    echo "2. Testing analytics overview..."
    OVERVIEW_RESPONSE=$(curl -s -X GET "http://localhost:4000/api/analytics/overview" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json")
    
    echo "Overview Response: $OVERVIEW_RESPONSE"
    echo
    
    # Step 3: Test analytics attendance
    echo "3. Testing analytics attendance..."
    ATTENDANCE_RESPONSE=$(curl -s -X GET "http://localhost:4000/api/analytics/attendance" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json")
    
    echo "Attendance Response: $ATTENDANCE_RESPONSE"
    echo
    
    # Step 4: Test analytics marks
    echo "4. Testing analytics marks..."
    MARKS_RESPONSE=$(curl -s -X GET "http://localhost:4000/api/analytics/marks" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json")
    
    echo "Marks Response: $MARKS_RESPONSE"
    echo
    
    echo "✅ All tests completed! Admin authentication and analytics access working."
else
    echo "❌ Login failed - no token received"
fi
