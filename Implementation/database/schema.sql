CREATE TABLE profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

    full_name TEXT,

    email TEXT UNIQUE,

    profile_image TEXT,

    created_at TIMESTAMP DEFAULT NOW()
);
CREATE TABLE groups (
    group_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    group_name TEXT NOT NULL,

    description TEXT,

    created_by UUID REFERENCES profiles(user_id),

    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE group_members (
    member_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    group_id UUID REFERENCES groups(group_id) ON DELETE CASCADE,

    user_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE,

    role TEXT DEFAULT 'member',

    joined_at TIMESTAMP DEFAULT NOW(),

    UNIQUE(group_id, user_id)
);