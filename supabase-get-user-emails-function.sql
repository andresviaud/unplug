-- Create a function to get user emails for community display
-- Run this in Supabase SQL Editor
-- This allows the app to get user emails for public habits

-- Create a function that returns user emails for given user IDs
CREATE OR REPLACE FUNCTION get_user_emails(user_ids UUID[])
RETURNS TABLE(user_id UUID, email TEXT) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id::UUID as user_id,
    au.email::TEXT as email
  FROM auth.users au
  WHERE au.id = ANY(user_ids);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_emails(UUID[]) TO authenticated;

-- Test the function (optional):
-- SELECT * FROM get_user_emails(ARRAY['user-id-1'::UUID, 'user-id-2'::UUID]);

