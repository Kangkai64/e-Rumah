-- Migration 027: Fix normalize_email() so plus-addressing (recipient+tag@domain)
-- collapses for every domain, not just gmail.com/googlemail.com.
--
-- Plus-addressing is a near-universal mail-server convention (Gmail,
-- Outlook/Office365, Yahoo, ProtonMail, FastMail, most Postfix/Sendmail
-- setups, and Google-Workspace-hosted custom domains such as a university's
-- student email), so restricting it to literal @gmail.com addresses let
-- duplicates like adam@student.example.edu and adam+alt@student.example.edu
-- through check_duplicate_email() undetected.
--
-- Dot-insensitivity (ad.am@gmail.com == adam@gmail.com) really is a
-- Gmail/Google Workspace-specific quirk -- most other providers treat dots in
-- the local part as significant -- so that part stays restricted to
-- gmail.com/googlemail.com to avoid false-positive collisions elsewhere.
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

  local_part := split_part(local_part, '+', 1);

  IF domain_part IN ('gmail.com', 'googlemail.com') THEN
    local_part := replace(local_part, '.', '');
    domain_part := 'gmail.com';
  END IF;

  RETURN local_part || '@' || domain_part;
END;
$$;
