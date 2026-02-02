-- Migration: Add app access requests table
-- Allows users to request access to apps they don't have access to

CREATE TABLE app_access_requests (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    app_id TEXT NOT NULL,
    requested_role TEXT,
    message TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    reviewed_by TEXT,
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (app_id) REFERENCES apps(id) ON DELETE CASCADE,
    UNIQUE (user_id, app_id, status)
);

CREATE INDEX idx_app_access_requests_app_status ON app_access_requests(app_id, status);
CREATE INDEX idx_app_access_requests_user ON app_access_requests(user_id);
