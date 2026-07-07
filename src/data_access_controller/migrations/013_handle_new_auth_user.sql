-- Migration 013: Auto-create the public.users profile row when a new auth.users
-- row is inserted. Pairs with the "on_auth_user_created" trigger on auth.users
-- (after insert, for each row, execute function public.handle_new_auth_user()).
--
-- full_name / ic_number / phone come from raw_user_meta_data, which authService.js
-- signUp() populates via supabase.auth.signUp({ options: { data: {...} } }).
--
-- Staff accounts (admins / customer_supports) are created without ic_number
-- metadata, so this function skips them rather than failing the auth.users
-- insert on the users.ic_number NOT NULL constraint.

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.raw_user_meta_data ->> 'ic_number' IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.users (id, email, full_name, ic_number, phone)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'ic_number',
    NEW.raw_user_meta_data ->> 'phone'
  )
  ON CONFLICT (id, ic_number) DO NOTHING;

  RETURN NEW;
END;
$$;
