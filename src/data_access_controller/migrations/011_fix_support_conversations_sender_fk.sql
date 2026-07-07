-- Fix support_conversations.sender_id FK
-- Previously referenced public.users(id), which excluded admins and customer_supports.
-- Staff accounts exist in auth.users but NOT in public.users, so they could not insert messages.
-- Change the FK to reference auth.users(id) so all account types can send messages.

ALTER TABLE public.support_conversations
  DROP CONSTRAINT IF EXISTS support_conversations_sender_id_fkey;

ALTER TABLE public.support_conversations
  ADD CONSTRAINT support_conversations_sender_id_fkey
  FOREIGN KEY (sender_id)
  REFERENCES auth.users(id) ON DELETE CASCADE;
