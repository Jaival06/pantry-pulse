CREATE TABLE IF NOT EXISTS datasets (source TEXT PRIMARY KEY NOT NULL, payload TEXT NOT NULL, updated_at TEXT NOT NULL);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS agent_runs (id TEXT PRIMARY KEY NOT NULL, created_at TEXT NOT NULL, normalized TEXT NOT NULL, outputs TEXT NOT NULL);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS conversations (id TEXT PRIMARY KEY NOT NULL, created_at TEXT NOT NULL, question TEXT NOT NULL, answer TEXT NOT NULL);
