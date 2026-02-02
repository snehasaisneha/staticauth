-- Multi-app support: apps and user access tables

CREATE TABLE apps (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE user_app_access (
    user_id TEXT NOT NULL,
    app_id TEXT NOT NULL,
    role TEXT,
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    granted_by TEXT,
    PRIMARY KEY (user_id, app_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (app_id) REFERENCES apps(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_app_access_user ON user_app_access(user_id);
CREATE INDEX idx_user_app_access_app ON user_app_access(app_id);
CREATE INDEX idx_apps_slug ON apps(slug);
