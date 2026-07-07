# Database migrations

These files are pasted into the Supabase SQL Editor manually - there is no
migration runner tracking which ones have been applied.

- `001` through `014` are numbered sequentially, in the order they should be
  run against a fresh database. Each one is a hand-written incremental change
  (`ALTER TABLE`, `CREATE POLICY`, etc.).
- `schema_snapshots/` holds point-in-time dumps of tables that were created or
  altered directly in the Supabase dashboard rather than through a migration
  file. They are reference documentation only - re-running them against an
  existing database will fail (e.g. `CREATE TABLE` on a table that already
  exists). A few numbered migrations (007, 008) depend on tables defined in a
  snapshot file; each says so in its header comment.

## History notes

- `001_initial_schema.sql` originally shipped as two files (`001_initial_schema.sql`
  and a `002_fixed_schema.sql` that dropped and recreated everything with the
  `users.id -> auth.users.id` foreign key). Since the first version was never
  actually usable on its own, they've been squashed into a single `001`.
- A `005_add_healthcare_provider.sql` / `006_remove_healthcare_provider.sql`
  pair added and then removed a `health_reports.healthcare_provider` column
  with nothing in between depending on it. Both were deleted since they net
  out to no change.
- `users.role` and `users.type` were later removed from the live schema (in
  favor of per-role tables: `admins`, `customer_supports`, `caregivers`, etc.)
  but there is no migration file for that removal - it was done directly in
  the Supabase dashboard. See the header comment in
  `schema_snapshots/snapshot_users_and_role_tables.sql`.
