-- Secure RPC function to check for duplicate NRICs
-- This function runs with SECURITY DEFINER privileges to bypass RLS
-- It allows us to check if an NRIC exists in the users table without exposing user data

CREATE OR REPLACE FUNCTION check_duplicate_ic(nric_to_check text, exclude_user_id uuid DEFAULT null)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the creator (postgres/service_role)
SET search_path = public -- Secure search path
AS $$
DECLARE
  exists_flag boolean;
BEGIN
  -- Normalize input (optional but good for consistency)
  -- Assuming nric_to_check is passed as is.
  
  -- Check if NRIC exists in users table
  SELECT EXISTS (
    SELECT 1 
    FROM users 
    WHERE 
      (ic_number = nric_to_check OR replace(ic_number, '-', '') = replace(nric_to_check, '-', ''))
      AND (exclude_user_id IS NULL OR id != exclude_user_id)
  ) INTO exists_flag;

  RETURN exists_flag;
END;
$$;

-- Revoke execution from public (everyone)
REVOKE EXECUTE ON FUNCTION check_duplicate_ic(text, uuid) FROM public;

-- Grant execution to authenticated users only
GRANT EXECUTE ON FUNCTION check_duplicate_ic(text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION check_duplicate_ic(text, uuid) TO service_role;

-- Comment for documentation
COMMENT ON FUNCTION check_duplicate_ic IS 'Checks if an NRIC is already in use by another user, bypassing RLS.';
