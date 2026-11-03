-- Apply after 001_initial_schema.sql. Existing department grants are expanded
-- into grants for the current non-admin users of each recipient department.
-- New users do not inherit those grants.

ALTER TABLE users
    ADD COLUMN role ENUM('employee', 'department_head', 'director')
        NOT NULL DEFAULT 'employee' AFTER department_id,
    ADD KEY ix_users_role (role);

CREATE TABLE document_user_grants (
    document_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    granted_by BIGINT UNSIGNED NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (document_id, user_id),
    KEY ix_user_grants_user_document (user_id, document_id),
    KEY ix_user_grants_granted_by (granted_by),
    CONSTRAINT fk_user_grants_document FOREIGN KEY (document_id)
        REFERENCES documents (id) ON UPDATE RESTRICT ON DELETE CASCADE,
    CONSTRAINT fk_user_grants_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON UPDATE RESTRICT ON DELETE RESTRICT,
    CONSTRAINT fk_user_grants_granted_by FOREIGN KEY (granted_by)
        REFERENCES users (id) ON UPDATE RESTRICT ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO document_user_grants (document_id, user_id, granted_by, created_at)
SELECT old_grant.document_id, recipient.id, old_grant.granted_by, old_grant.created_at
FROM document_department_grants AS old_grant
JOIN users AS recipient ON recipient.department_id = old_grant.department_id
JOIN documents AS document ON document.id = old_grant.document_id
WHERE recipient.is_admin = FALSE
  AND recipient.role <> 'director'
  AND recipient.department_id <> document.owner_department_id;

DROP TABLE document_department_grants;
