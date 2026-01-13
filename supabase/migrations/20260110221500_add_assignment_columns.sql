-- Add missing columns to assignments table to match TypeScript interface
ALTER TABLE public.assignments
ADD COLUMN IF NOT EXISTS due_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS weight numeric DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS confidence numeric DEFAULT 50 NOT NULL;
