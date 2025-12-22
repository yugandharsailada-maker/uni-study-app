-- Create the missing trigger to connect handle_new_user() to auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Backfill any existing users without profiles
INSERT INTO public.profiles (user_id, email, display_name)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data ->> 'full_name', raw_user_meta_data ->> 'name', email)
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.profiles)
ON CONFLICT (user_id) DO NOTHING;