-- Create a default general chat room
INSERT INTO public.chat_rooms (id, name, description, is_private, created_by)
VALUES (
  gen_random_uuid(),
  'General',
  'Welcome to the general chat room! Please be respectful and follow the community guidelines.',
  false,
  NULL
)
ON CONFLICT DO NOTHING;

-- Create admin user (this will be updated when first admin signs up)
-- This is just a placeholder for the admin role structure
