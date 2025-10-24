-- Migration 002: Migrate from separate pcs table to unified assets table with asset_history
-- This migration unifies PC management with other assets and adds comprehensive history tracking

-- Step 1: Create asset_history table for tracking all asset changes
CREATE TABLE IF NOT EXISTS asset_history (
  id VARCHAR(36) PRIMARY KEY,
  asset_id VARCHAR(36) NOT NULL,
  asset_code VARCHAR(50) NOT NULL,
  serial_number VARCHAR(100),
  event_type VARCHAR(50) NOT NULL COMMENT 'created, assigned, unassigned, maintenance, status_change, specs_update, notes_update',
  event_description TEXT NOT NULL,
  old_value TEXT COMMENT 'Previous value if applicable (JSON for complex objects)',
  new_value TEXT COMMENT 'New value if applicable (JSON for complex objects)',
  performed_by VARCHAR(36),
  performed_by_name VARCHAR(200) COMMENT 'User name for historical record',
  related_employee_id VARCHAR(36),
  related_employee_name VARCHAR(200) COMMENT 'Employee name for historical record',
  maintenance_id VARCHAR(36) COMMENT 'Reference to maintenance if applicable',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE,
  FOREIGN KEY (performed_by) REFERENCES users(id),
  FOREIGN KEY (related_employee_id) REFERENCES employees(id),

  INDEX asset_history_asset_id_idx (asset_id),
  INDEX asset_history_asset_code_idx (asset_code),
  INDEX asset_history_serial_number_idx (serial_number),
  INDEX asset_history_event_type_idx (event_type),
  INDEX asset_history_created_at_idx (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 2: Migrate existing PCs from pcs table to assets table
-- This converts legacy PC records to the new unified asset structure
INSERT INTO assets (
  id,
  asset_code,
  asset_type,
  employee_id,
  brand,
  model,
  serial_number,
  purchase_date,
  warranty_expiry,
  status,
  specs,
  notes,
  created_at,
  updated_at
)
SELECT
  id,
  pc_id as asset_code,
  'pc' as asset_type,
  employee_id,
  brand,
  model,
  serial_number,
  purchase_date,
  warranty_expiry,
  CASE
    WHEN status = 'active' AND employee_id IS NOT NULL THEN 'assegnato'
    WHEN status = 'active' THEN 'disponibile'
    WHEN status = 'maintenance' THEN 'manutenzione'
    WHEN status = 'retired' THEN 'dismesso'
    ELSE 'disponibile'
  END as status,
  JSON_OBJECT(
    'cpu', cpu,
    'ram', ram,
    'storage', storage,
    'operatingSystem', operating_system
  ) as specs,
  notes,
  created_at,
  updated_at
FROM pcs
WHERE NOT EXISTS (
  SELECT 1 FROM assets WHERE assets.serial_number = pcs.serial_number
);

-- Step 3: Migrate PC history to asset_history
-- Preserve all historical events from the old pc_history table
INSERT INTO asset_history (
  id,
  asset_id,
  asset_code,
  serial_number,
  event_type,
  event_description,
  old_value,
  new_value,
  performed_by,
  performed_by_name,
  related_employee_id,
  related_employee_name,
  maintenance_id,
  notes,
  created_at
)
SELECT
  ph.id,
  a.id as asset_id,
  a.asset_code,
  ph.serial_number,
  ph.event_type,
  ph.event_description,
  ph.old_value,
  ph.new_value,
  ph.performed_by,
  ph.performed_by_name,
  ph.related_employee_id,
  ph.related_employee_name,
  ph.maintenance_id,
  ph.notes,
  ph.created_at
FROM pc_history ph
INNER JOIN assets a ON a.serial_number = ph.serial_number
WHERE NOT EXISTS (
  SELECT 1 FROM asset_history WHERE asset_history.id = ph.id
);

-- Step 4: Create initial history entries for migrated PCs without history
-- This ensures every asset has at least a "created" event
INSERT INTO asset_history (
  id,
  asset_id,
  asset_code,
  serial_number,
  event_type,
  event_description,
  new_value,
  created_at
)
SELECT
  UUID() as id,
  a.id,
  a.asset_code,
  a.serial_number,
  'created' as event_type,
  CONCAT('PC migrato da sistema legacy: ', a.brand, ' ', a.model) as event_description,
  JSON_OBJECT(
    'assetType', 'pc',
    'brand', a.brand,
    'model', a.model,
    'serialNumber', a.serial_number
  ) as new_value,
  a.created_at
FROM assets a
WHERE a.asset_type = 'pc'
AND NOT EXISTS (
  SELECT 1 FROM asset_history ah
  WHERE ah.asset_id = a.id AND ah.event_type = 'created'
);

-- Step 5: Add assignment history for currently assigned PCs
INSERT INTO asset_history (
  id,
  asset_id,
  asset_code,
  serial_number,
  event_type,
  event_description,
  new_value,
  related_employee_id,
  related_employee_name,
  created_at
)
SELECT
  UUID() as id,
  a.id,
  a.asset_code,
  a.serial_number,
  'assigned' as event_type,
  CONCAT('PC assegnato a ', e.name, ' (migrazione da sistema legacy)') as event_description,
  JSON_OBJECT('employeeId', a.employee_id, 'status', 'assegnato') as new_value,
  e.id,
  e.name,
  a.updated_at
FROM assets a
INNER JOIN employees e ON a.employee_id = e.id
WHERE a.asset_type = 'pc'
AND a.employee_id IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM asset_history ah
  WHERE ah.asset_id = a.id
  AND ah.event_type = 'assigned'
  AND ah.related_employee_id = a.employee_id
);

-- Note: The pcs and pc_history tables are NOT dropped in this migration
-- They will be marked as DEPRECATED and removed in a future migration
-- after verifying data integrity and updating all references
