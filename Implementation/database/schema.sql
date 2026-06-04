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

-- ─── Auto-create profile on signup ──────────────────────────────────────────
-- Runs as SECURITY DEFINER so it bypasses RLS (user has no session yet at
-- signup time when email confirmation is enabled).

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  palette TEXT[] := ARRAY['#DC143C','#1A2B5F','#9C27B0','#FF6F00','#00838F','#2E7D32','#C62828','#4527A0'];
  color   TEXT;
BEGIN
  color := palette[(abs(hashtext(NEW.id::text)) % array_length(palette, 1)) + 1];
  INSERT INTO public.profiles (user_id, full_name, email, avatar_color)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    NEW.email,
    color
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

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
