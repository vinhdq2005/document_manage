-- Run once after 002_user_read_grants_and_roles.sql and 001_demo_users.sql.
-- The sample accounts remain inactive until the backend assigns real hashes.

INSERT INTO users (email, password_hash, full_name, department_id, role, is_admin, can_upload, is_active)
SELECT 'head.a@example.invalid', '!disabled-demo-account', 'Trưởng phòng A', id,
       'department_head', FALSE, FALSE, FALSE
FROM departments WHERE name = 'Phòng A';

INSERT INTO users (email, password_hash, full_name, department_id, role, is_admin, can_upload, is_active)
SELECT 'reader2.b@example.invalid', '!disabled-demo-account', 'Người đọc thứ hai phòng B', id,
       'employee', FALSE, FALSE, FALSE
FROM departments WHERE name = 'Phòng B';

INSERT INTO users (email, password_hash, full_name, department_id, role, is_admin, can_upload, is_active)
SELECT 'director@example.invalid', '!disabled-demo-account', 'Giám đốc mẫu', id,
       'director', FALSE, FALSE, FALSE
FROM departments WHERE name = 'Phòng A';
