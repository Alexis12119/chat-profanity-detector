-- Make the first user (or specific user) an admin
-- This script will set is_admin = true for your user account

-- Option 1: Make the first registered user an admin
UPDATE profiles 
SET is_admin = true 
WHERE id = (
  SELECT id 
  FROM profiles 
  ORDER BY created_at ASC 
  LIMIT 1
);

-- Option 2: If you know your email, uncomment and replace 'your-email@example.com'
-- UPDATE profiles 
-- SET is_admin = true 
-- WHERE id = (
--   SELECT id 
--   FROM auth.users 
--   WHERE email = 'your-email@example.com'
-- );

-- Verify the admin user was created
SELECT id, username, display_name, is_admin, created_at 
FROM profiles 
WHERE is_admin = true;
