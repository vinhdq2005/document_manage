-- Run after 001_initial_schema.sql, on a development database only.
-- Accounts are inactive and have deliberately unusable password hashes.
-- Set real hashes through the backend's password-hashing routine, then activate.

INSERT INTO departments (name) VALUES
    ('Phòng A'),
    ('Phòng B');

INSERT INTO users (email, password_hash, full_name, department_id, is_admin, can_upload, is_active)
SELECT 'admin@example.invalid', '!disabled-demo-account', 'Quản trị viên mẫu', id, TRUE, TRUE, FALSE
FROM departments WHERE name = 'Phòng A';

INSERT INTO users (email, password_hash, full_name, department_id, is_admin, can_upload, is_active)
SELECT 'uploader.a@example.invalid', '!disabled-demo-account', 'Người tải lên phòng A', id, FALSE, TRUE, FALSE
FROM departments WHERE name = 'Phòng A';

INSERT INTO users (email, password_hash, full_name, department_id, is_admin, can_upload, is_active)
SELECT 'reader.b@example.invalid', '!disabled-demo-account', 'Người đọc phòng B', id, FALSE, FALSE, FALSE
FROM departments WHERE name = 'Phòng B';
