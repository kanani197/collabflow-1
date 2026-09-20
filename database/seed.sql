-- Minimal seed data for local development / demo purposes.
INSERT INTO users (id, email, password_hash, display_name, role)
VALUES (uuid_generate_v4(), 'demo@collabflow.app', '$2a$10$replace_with_real_hash', 'Demo User', 'admin')
ON CONFLICT DO NOTHING;

INSERT INTO datasets (id, label, file_path, is_default, row_count, column_count)
VALUES (uuid_generate_v4(), 'Dissertation Dataset', '/data/default/dissertation_dataset.xlsx', true, 84, 19)
ON CONFLICT DO NOTHING;
