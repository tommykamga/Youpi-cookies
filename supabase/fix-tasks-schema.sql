-- Fix Task Assignment Schema
-- Run this in your Supabase SQL Editor

-- 1. Drop the foreign key constraint
ALTER TABLE public.tasks
DROP CONSTRAINT IF EXISTS tasks_assigned_to_fkey;

-- 2. Change the column type to TEXT to allow names/roles
ALTER TABLE public.tasks
ALTER COLUMN assigned_to TYPE TEXT;
