-- Migration: Add indexes to maintenance table for better query performance
-- This improves queries filtering by asset, status, priority, and scheduled date

-- Add index on assetId (most frequently queried field)
CREATE INDEX IF NOT EXISTS maintenance_asset_id_idx ON maintenance(asset_id);

-- Add index on status (frequently used for filtering active/completed maintenance)
CREATE INDEX IF NOT EXISTS maintenance_status_idx ON maintenance(status);

-- Add index on priority (used for sorting and filtering urgent/high priority items)
CREATE INDEX IF NOT EXISTS maintenance_priority_idx ON maintenance(priority);

-- Add index on scheduledDate (used for sorting by date and date range queries)
CREATE INDEX IF NOT EXISTS maintenance_scheduled_date_idx ON maintenance(scheduled_date);

-- Verify indexes were created
SHOW INDEX FROM maintenance;
