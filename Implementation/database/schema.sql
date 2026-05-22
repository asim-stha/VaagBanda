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

    category TEXT,

    default_currency TEXT NOT NULL DEFAULT 'NOK',

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
CREATE TABLE expenses (
    expense_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    group_id UUID NOT NULL REFERENCES groups(group_id) ON DELETE CASCADE,

    paid_by UUID NOT NULL REFERENCES profiles(user_id),

    title TEXT NOT NULL,

    description TEXT,

    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),

    currency TEXT NOT NULL DEFAULT 'NOK',

    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,

    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_expenses_group_id
ON expenses(group_id);

CREATE INDEX idx_expenses_paid_by
ON expenses(paid_by);
