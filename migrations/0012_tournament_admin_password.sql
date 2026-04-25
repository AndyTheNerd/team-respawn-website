-- Add admin_password_hash to tournaments so admins can recover access
-- without their original manage link.
ALTER TABLE tournaments ADD COLUMN admin_password_hash TEXT;
