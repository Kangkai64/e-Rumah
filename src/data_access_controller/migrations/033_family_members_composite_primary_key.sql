-- Migration 033: Make (id, family_member_user_id) the primary key of public.family_members
--
-- family_members previously had no primary key at all - only a UNIQUE
-- constraint (family_members_unique_relationship) enforcing the same
-- (id, family_member_user_id) pair. Promote that pair to a proper composite
-- primary key.
--
-- Run this manually in the Supabase SQL Editor - it is not applied by any
-- migration runner.

ALTER TABLE public.family_members
  DROP CONSTRAINT family_members_unique_relationship,
  ADD CONSTRAINT family_members_pkey PRIMARY KEY (id, family_member_user_id);
