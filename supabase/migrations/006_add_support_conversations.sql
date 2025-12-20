-- Migration: Add generic support_conversations table for all entity types
-- Supports: inquiries, applications, nominees, health reports

-- Create the conversations table
CREATE TABLE public.support_conversations (
  id UUID NOT NULL DEFAULT extensions.uuid_generate_v4(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  message TEXT NOT NULL,
  sender_type TEXT NOT NULL DEFAULT 'staff'::TEXT,
  sender_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  CONSTRAINT support_conversations_pkey PRIMARY KEY (id),
  CONSTRAINT support_conversations_sender_id_fkey FOREIGN KEY (sender_id) 
    REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT support_conversations_entity_type_check CHECK (
    entity_type = ANY (
      ARRAY[
        'inquiry'::TEXT,
        'nominee'::TEXT,
        'health_report'::TEXT
      ]
    )
  ),
  CONSTRAINT support_conversations_sender_type_check CHECK (
    sender_type = ANY (
      ARRAY[
        'elder'::TEXT,
        'staff'::TEXT
      ]
    )
  )
) TABLESPACE pg_default;

-- Composite index for fast entity lookups
CREATE INDEX IF NOT EXISTS idx_support_conversations_entity 
  ON public.support_conversations USING btree (entity_type, entity_id) 
  TABLESPACE pg_default;

-- Index for sender lookups
CREATE INDEX IF NOT EXISTS idx_support_conversations_sender 
  ON public.support_conversations USING btree (sender_id) 
  TABLESPACE pg_default;

-- Enable RLS
ALTER TABLE public.support_conversations ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read conversations
CREATE POLICY support_conversations_select_policy 
  ON public.support_conversations
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Policy: Allow authenticated users to insert conversations
CREATE POLICY support_conversations_insert_policy 
  ON public.support_conversations
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

-- Note: customer_support_contacts table remains unchanged for backward compatibility
-- New conversations should use support_conversations table
