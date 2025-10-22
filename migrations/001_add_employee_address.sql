-- Migration: Add address field to employees table
-- Date: 2025-10-22
-- Description: Add address field for manleva PDF generation

-- Add address column to employees table
ALTER TABLE employees
ADD COLUMN address TEXT NULL
AFTER department;

-- Optional: Add comment to column
ALTER TABLE employees
MODIFY COLUMN address TEXT NULL
COMMENT 'Employee address for official documents (manleva, contracts, etc.)';
