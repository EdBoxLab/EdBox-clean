CREATE TABLE courses (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    subject TEXT,
    category TEXT,
    engine TEXT,
    level TEXT,
    progress INTEGER DEFAULT 0,
    roadmap JSONB,
    gamification JSONB,
    lastActivity TEXT,
    coverImageUrl TEXT,
    courseArchetype TEXT,
    format TEXT,
    mode TEXT
);
