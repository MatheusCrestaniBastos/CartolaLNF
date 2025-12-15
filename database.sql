-- ============================================
-- LNF FANTASY - BANCO DE DADOS COMPLETO
-- ============================================
-- Execute TODO este SQL no Supabase SQL Editor
-- https://supabase.com/dashboard → SQL Editor → New Query

-- ============================================
-- 1. CRIAR TABELAS
-- ============================================

-- Times da LNF
CREATE TABLE IF NOT EXISTS teams (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Jogadores
CREATE TABLE IF NOT EXISTS players (
    id BIGSERIAL PRIMARY KEY,
    team_id BIGINT REFERENCES teams(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    position VARCHAR(3) NOT NULL CHECK (position IN ('GOL', 'FIX', 'ALA', 'PIV')),
    price DECIMAL(10,2) DEFAULT 5.00 CHECK (price >= 1.00 AND price <= 20.00),
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Usuários/Cartoleiros
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    team_name VARCHAR(100) NOT NULL,
    cartoletas DECIMAL(10,2) DEFAULT 100.00,
    total_points DECIMAL(10,2) DEFAULT 0,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rodadas
CREATE TABLE IF NOT EXISTS rounds (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'finished')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Escalações
CREATE TABLE IF NOT EXISTS lineups (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    round_id BIGINT REFERENCES rounds(id) ON DELETE CASCADE,
    total_points DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, round_id)
);

-- Jogadores nas Escalações
CREATE TABLE IF NOT EXISTS lineup_players (
    id BIGSERIAL PRIMARY KEY,
    lineup_id BIGINT REFERENCES lineups(id) ON DELETE CASCADE,
    player_id BIGINT REFERENCES players(id) ON DELETE CASCADE,
    is_starter BOOLEAN DEFAULT TRUE,
    points DECIMAL(10,2) DEFAULT 0,
    UNIQUE(lineup_id, player_id)
);

-- Estatísticas dos Jogadores
CREATE TABLE IF NOT EXISTS player_stats (
    id BIGSERIAL PRIMARY KEY,
    round_id BIGINT REFERENCES rounds(id) ON DELETE CASCADE,
    player_id BIGINT REFERENCES players(id) ON DELETE CASCADE,
    goals INTEGER DEFAULT 0,
    assists INTEGER DEFAULT 0,
    saves INTEGER DEFAULT 0,
    clean_sheet INTEGER DEFAULT 0,
    own_goals INTEGER DEFAULT 0,
    yellow_cards INTEGER DEFAULT 0,
    red_cards INTEGER DEFAULT 0,
    points DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(round_id, player_id)
);

-- ============================================
-- 2. HABILITAR RLS
-- ============================================

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE lineups ENABLE ROW LEVEL SECURITY;
ALTER TABLE lineup_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. POLÍTICAS RLS
-- ============================================

-- Teams
DROP POLICY IF EXISTS "teams_public" ON teams;
CREATE POLICY "teams_public" ON teams FOR SELECT TO authenticated USING (true);

-- Players
DROP POLICY IF EXISTS "players_public" ON players;
CREATE POLICY "players_public" ON players FOR SELECT TO authenticated USING (true);

-- Users: SELECT (todos podem ver para ranking)
DROP POLICY IF EXISTS "users_select" ON users;
CREATE POLICY "users_select" ON users FOR SELECT TO authenticated USING (true);

-- Users: INSERT (próprio)
DROP POLICY IF EXISTS "users_insert" ON users;
CREATE POLICY "users_insert" ON users FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Users: UPDATE (próprio)
DROP POLICY IF EXISTS "users_update" ON users;
CREATE POLICY "users_update" ON users FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Rounds
DROP POLICY IF EXISTS "rounds_public" ON rounds;
CREATE POLICY "rounds_public" ON rounds FOR SELECT TO authenticated USING (true);

-- Lineups: SELECT
DROP POLICY IF EXISTS "lineups_select" ON lineups;
CREATE POLICY "lineups_select" ON lineups FOR SELECT TO authenticated USING (true);

-- Lineups: INSERT (próprio)
DROP POLICY IF EXISTS "lineups_insert" ON lineups;
CREATE POLICY "lineups_insert" ON lineups FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Lineups: UPDATE (próprio)
DROP POLICY IF EXISTS "lineups_update" ON lineups;
CREATE POLICY "lineups_update" ON lineups FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Lineups: DELETE (próprio)
DROP POLICY IF EXISTS "lineups_delete" ON lineups;
CREATE POLICY "lineups_delete" ON lineups FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Lineup Players: SELECT
DROP POLICY IF EXISTS "lineup_players_select" ON lineup_players;
CREATE POLICY "lineup_players_select" ON lineup_players FOR SELECT TO authenticated USING (true);

-- Lineup Players: INSERT (própria escalação)
DROP POLICY IF EXISTS "lineup_players_insert" ON lineup_players;
CREATE POLICY "lineup_players_insert" ON lineup_players FOR INSERT TO authenticated 
WITH CHECK (EXISTS (SELECT 1 FROM lineups WHERE lineups.id = lineup_id AND lineups.user_id = auth.uid()));

-- Lineup Players: DELETE (própria escalação)
DROP POLICY IF EXISTS "lineup_players_delete" ON lineup_players;
CREATE POLICY "lineup_players_delete" ON lineup_players FOR DELETE TO authenticated 
USING (EXISTS (SELECT 1 FROM lineups WHERE lineups.id = lineup_id AND lineups.user_id = auth.uid()));

-- Player Stats
DROP POLICY IF EXISTS "player_stats_public" ON player_stats;
CREATE POLICY "player_stats_public" ON player_stats FOR SELECT TO authenticated USING (true);

-- ============================================
-- 4. TRIGGER PARA AUTO-CRIAR USUÁRIO
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, team_name, cartoletas, total_points, is_admin)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'team_name', 'Novo Time'),
        100.00,
        0,
        FALSE
    )
    ON CONFLICT (id) DO UPDATE SET
        team_name = COALESCE(EXCLUDED.team_name, users.team_name);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 5. FUNÇÃO REGISTER_USER
-- ============================================

CREATE OR REPLACE FUNCTION public.register_user(
    user_id UUID,
    user_email TEXT,
    user_team_name TEXT
)
RETURNS users AS $$
DECLARE new_user users;
BEGIN
    SELECT * INTO new_user FROM users WHERE id = user_id;
    IF FOUND THEN
        UPDATE users SET team_name = user_team_name WHERE id = user_id RETURNING * INTO new_user;
        RETURN new_user;
    END IF;
    INSERT INTO users (id, email, team_name, cartoletas, total_points, is_admin)
    VALUES (user_id, user_email, user_team_name, 100.00, 0, FALSE)
    RETURNING * INTO new_user;
    RETURN new_user;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.register_user TO authenticated, anon;

-- ============================================
-- 6. CONFIRMAR EMAILS (DESENVOLVIMENTO)
-- ============================================

UPDATE auth.users SET email_confirmed_at = NOW() WHERE email_confirmed_at IS NULL;

-- ============================================
-- 7. ÍNDICES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_players_team ON players(team_id);
CREATE INDEX IF NOT EXISTS idx_lineups_user ON lineups(user_id);
CREATE INDEX IF NOT EXISTS idx_lineups_round ON lineups(round_id);
CREATE INDEX IF NOT EXISTS idx_lineup_players_lineup ON lineup_players(lineup_id);

-- ============================================
-- ✅ BANCO PRONTO!
-- ============================================

SELECT 'Banco de dados criado com sucesso!' as status;
