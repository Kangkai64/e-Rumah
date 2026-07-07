-- Migration 014: Duplicate email check for registration, including a Gmail
-- "dot trick" / plus-addressing guard (adam@gmail.com, ad.am@gmail.com and
-- adam+x@gmail.com all deliver to the same inbox, so they should collide).
--
-- Also opens up check_duplicate_ic to the anon role, since registration
-- happens before the user has a session.

CREATE OR REPLACE FUNCTION public.normalize_email(raw_email text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  local_part text;
  domain_part text;
  at_pos int;
BEGIN
  IF raw_email IS NULL THEN
    RETURN NULL;
  END IF;

  raw_email := lower(trim(raw_email));
  at_pos := position('@' in raw_email);
  IF at_pos = 0 THEN
    RETURN raw_email;
  END IF;

  local_part := substring(raw_email from 1 for at_pos - 1);
  domain_part := substring(raw_email from at_pos + 1);

  -- Gmail (and Google Workspace aliases via googlemail.com) ignores dots in
  -- the local part and anything after a '+', so normalize both away before
  -- comparing to catch masquerading addresses.
  IF domain_part IN ('gmail.com', 'googlemail.com') THEN
    local_part := split_part(local_part, '+', 1);
    local_part := replace(local_part, '.', '');
    domain_part := 'gmail.com';
  END IF;

  RETURN local_part || '@' || domain_part;
END;
$$;

-- Secure RPC function to check for duplicate emails (including Gmail
-- dot/plus-alias collisions) across all account tables.
-- Runs with SECURITY DEFINER privileges to bypass RLS.
CREATE OR REPLACE FUNCTION check_duplicate_email(email_to_check text, exclude_user_id uuid DEFAULT null)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  exists_flag boolean;
  normalized text;
BEGIN
  normalized := public.normalize_email(email_to_check);

  SELECT EXISTS (
    SELECT 1 FROM users
      WHERE public.normalize_email(email) = normalized
        AND (exclude_user_id IS NULL OR id != exclude_user_id)
    UNION ALL
    SELECT 1 FROM admins
      WHERE public.normalize_email(email) = normalized
        AND (exclude_user_id IS NULL OR id != exclude_user_id)
    UNION ALL
    SELECT 1 FROM customer_supports
      WHERE public.normalize_email(email) = normalized
        AND (exclude_user_id IS NULL OR id != exclude_user_id)
  ) INTO exists_flag;

  RETURN exists_flag;
END;
$$;

REVOKE EXECUTE ON FUNCTION check_duplicate_email(text, uuid) FROM public;

-- Registration happens before the user has a session, so the anon role
-- needs to be able to call this (unlike check_duplicate_ic, which is only
-- ever called from an authenticated context today).
GRANT EXECUTE ON FUNCTION check_duplicate_email(text, uuid) TO anon;
GRANT EXECUTE ON FUNCTION check_duplicate_email(text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION check_duplicate_email(text, uuid) TO service_role;

COMMENT ON FUNCTION check_duplicate_email IS 'Checks if an email (normalized for Gmail dot/plus-alias tricks) is already in use across users/admins/customer_supports, bypassing RLS.';

-- check_duplicate_ic also needs to be callable pre-auth for registration's
-- duplicate-IC check.
GRANT EXECUTE ON FUNCTION check_duplicate_ic(text, uuid) TO anon;
