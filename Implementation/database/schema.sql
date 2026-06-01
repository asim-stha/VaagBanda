-- ─── Core tables ─────────────────────────────────────────────────────────────

CREATE TABLE profiles (
    user_id      UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name    TEXT,
    email        TEXT UNIQUE,
    avatar_color TEXT NOT NULL DEFAULT '#DC143C',
    profile_image TEXT,
    created_at   TIMESTAMP DEFAULT NOW()
);

CREATE TABLE groups (
    group_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_name       TEXT NOT NULL,
    emoji            TEXT NOT NULL DEFAULT '👥',
    description      TEXT,
    category         TEXT,
    default_currency TEXT NOT NULL DEFAULT 'NPR',
    created_by       UUID REFERENCES profiles(user_id),
    created_at       TIMESTAMP DEFAULT NOW()
);

CREATE TABLE group_members (
    member_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id   UUID REFERENCES groups(group_id) ON DELETE CASCADE,
    user_id    UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
    role       TEXT DEFAULT 'member',
    joined_at  TIMESTAMP DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

CREATE TABLE expenses (
    expense_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id     UUID NOT NULL REFERENCES groups(group_id) ON DELETE CASCADE,
    paid_by      UUID NOT NULL REFERENCES profiles(user_id),
    title        TEXT NOT NULL,
    description  TEXT,
    amount       NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    currency     TEXT NOT NULL DEFAULT 'NPR',
    category     TEXT NOT NULL DEFAULT 'other',
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at   TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_expenses_group_id ON expenses(group_id);
CREATE INDEX idx_expenses_paid_by  ON expenses(paid_by);

CREATE TABLE expense_splits (
    split_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_id  UUID NOT NULL REFERENCES expenses(expense_id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
    amount_owed NUMERIC(10, 2) NOT NULL CHECK (amount_owed >= 0),
    created_at  TIMESTAMP DEFAULT NOW(),
    UNIQUE(expense_id, user_id)
);

CREATE TABLE settlements (
    settlement_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id      UUID NOT NULL REFERENCES groups(group_id) ON DELETE CASCADE,
    payer_id      UUID NOT NULL REFERENCES profiles(user_id),
    payee_id      UUID NOT NULL REFERENCES profiles(user_id),
    amount        NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    method        TEXT NOT NULL DEFAULT 'cash',
    note          TEXT DEFAULT '',
    created_at    TIMESTAMP DEFAULT NOW()
);

-- ─── Row Level Security ───────────────────────────────────────────────────────
-- All authenticated users can read/write all rows (MVP policy).
-- Tighten these policies before going to production.

ALTER TABLE profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups       ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses     ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_all" ON profiles      FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON groups        FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON group_members FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON expenses      FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON expense_splits FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated_all" ON settlements   FOR ALL TO authenticated USING (true) WITH CHECK (true);
