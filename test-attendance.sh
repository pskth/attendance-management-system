#!/bin/bash

# Test script for attendance update functionality
echo "=== Testing Attendance Update Fix ==="

# Get authentication token
echo "1. Getting authentication token..."
TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"teacher","password":"teacher123"}' | \
  python -c "import sys, json; print(json.load(sys.stdin)['token'])" 2>/dev/null)

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to get authentication token"
  exit 1
fi

echo "✅ Authentication successful"

# Get students list
echo -e "\n2. Getting students list..."
STUDENTS_RESPONSE=$(curl -s -X GET "http://localhost:4000/api/teacher/attendance/students" \
  -H "Authorization: Bearer $TOKEN")

echo "Students response: $STUDENTS_RESPONSE"

# Test with a sample student ID (we'll use a UUID format)
STUDENT_ID="550e8400-e29b-41d4-a716-446655440000"

echo -e "\n3. Testing attendance updates..."

# Test present status
echo "Testing 'present' status..."
PRESENT_RESPONSE=$(curl -s -X PUT "http://localhost:4000/api/teacher/attendance/student" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"studentId\":\"$STUDENT_ID\",\"status\":\"present\",\"date\":\"2025-08-30\"}")

echo "Present response: $PRESENT_RESPONSE"

# Test absent status
echo -e "\nTesting 'absent' status..."
ABSENT_RESPONSE=$(curl -s -X PUT "http://localhost:4000/api/teacher/attendance/student" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"studentId\":\"$STUDENT_ID\",\"status\":\"absent\",\"date\":\"2025-08-30\"}")

echo "Absent response: $ABSENT_RESPONSE"

# Test unmarked status (this was the problematic one)
echo -e "\nTesting 'unmarked' status..."
UNMARKED_RESPONSE=$(curl -s -X PUT "http://localhost:4000/api/teacher/attendance/student" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"studentId\":\"$STUDENT_ID\",\"status\":\"unmarked\",\"date\":\"2025-08-30\"}")

echo "Unmarked response: $UNMARKED_RESPONSE"

echo -e "\n=== Test completed ==="
