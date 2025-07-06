-- =============================================================================
-- SHOW USERS DATA
-- =============================================================================

-- All users with their roles
SELECT 
  u.username,
  u.name,
  u.phone,
  ur.role,
  u.created_at
FROM users u
LEFT JOIN user_roles ur ON u.user_id = ur.user_id
ORDER BY ur.role, u.username;

-- Users count by role
SELECT 
  COALESCE(ur.role::text, 'No Role') as role,
  COUNT(*) as user_count
FROM users u
LEFT JOIN user_roles ur ON u.user_id = ur.user_id
GROUP BY ur.role
ORDER BY ur.role;

-- Admin users only
SELECT 
  u.username,
  u.name,
  u.phone
FROM users u
JOIN user_roles ur ON u.user_id = ur.user_id
WHERE ur.role = 'admin'
ORDER BY u.username;

-- Teacher users only
SELECT 
  u.username,
  u.name,
  u.phone,
  c.college_code,
  d.department_code
FROM users u
JOIN user_roles ur ON u.user_id = ur.user_id
JOIN teachers t ON u.user_id = t.user_id
JOIN colleges c ON t.college_id = c.college_id
JOIN departments d ON t.department_id = d.department_id
WHERE ur.role = 'teacher'
ORDER BY c.college_code, d.department_code, u.username;

-- Student users only (first 20)
SELECT 
  u.username,
  u.name,
  u.phone,
  st.usn,
  c.college_code,
  d.department_code,
  s.section_name,
  st.batch_year,
  st.semester
FROM users u
JOIN user_roles ur ON u.user_id = ur.user_id
JOIN students st ON u.user_id = st.user_id
JOIN colleges c ON st.college_id = c.college_id
JOIN departments d ON st.department_id = d.department_id
JOIN sections s ON st.section_id = s.section_id
WHERE ur.role = 'student'
ORDER BY st.usn
LIMIT 20;
