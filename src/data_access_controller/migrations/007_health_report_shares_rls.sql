-- Enable RLS for health report share links
-- Depends on public.health_report_shares, which was created directly in the
-- Supabase dashboard rather than through a numbered migration; see
-- schema_snapshots/snapshot_health_sharing_and_care_tables.sql for its definition.
ALTER TABLE public.health_report_shares ENABLE ROW LEVEL SECURITY;

-- Allow owners to manage their own share records
CREATE POLICY "Share owners can read their shares" ON public.health_report_shares
  FOR SELECT USING (auth.uid() = shared_by_user_id);

CREATE POLICY "Share owners can create shares" ON public.health_report_shares
  FOR INSERT WITH CHECK (auth.uid() = shared_by_user_id);

CREATE POLICY "Share owners can update shares" ON public.health_report_shares
  FOR UPDATE USING (auth.uid() = shared_by_user_id);

CREATE POLICY "Share owners can delete shares" ON public.health_report_shares
  FOR DELETE USING (auth.uid() = shared_by_user_id);

-- Allow consumers of generated links to fetch active link metadata
CREATE POLICY "View active link shares" ON public.health_report_shares
  FOR SELECT USING (
    shared_with_type = 'link'
    AND is_revoked = false
    AND (expires_at IS NULL OR expires_at > now())
  );
