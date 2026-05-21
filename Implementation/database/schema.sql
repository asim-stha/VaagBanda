CREATE TABLE profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

    full_name TEXT,

    email TEXT UNIQUE,

    profile_image TEXT,

    created_at TIMESTAMP DEFAULT NOW()
);