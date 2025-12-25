-- Secure RPC function to check for duplicate Nominee NRICs
-- Checks if an NRIC is already used as a nominee in ANOTHER application

CREATE OR REPLACE FUNCTION check_duplicate_nominee_ic(nric_to_check text, exclude_application_id uuid DEFAULT null)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  exists_flag boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 
    FROM nominees 
    WHERE 
      (ic_number = nric_to_check OR replace(ic_number, '-', '') = replace(nric_to_check, '-', ''))
      AND (exclude_application_id IS NULL OR application_id != exclude_application_id)
  ) INTO exists_flag;

  RETURN exists_flag;
END;
$$;

-- Permissions
REVOKE EXECUTE ON FUNCTION check_duplicate_nominee_ic(text, uuid) FROM public;
GRANT EXECUTE ON FUNCTION check_duplicate_nominee_ic(text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION check_duplicate_nominee_ic(text, uuid) TO service_role;
