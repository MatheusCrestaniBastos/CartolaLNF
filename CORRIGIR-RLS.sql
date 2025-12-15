-- ============================================
-- CORRIGIR RLS DA TABELA USERS
-- ============================================

-- Execute este SQL no Supabase SQL Editor

-- 1. REMOVER políticas antigas (se existirem)
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON users;

-- 2. HABILITAR RLS (se ainda não estiver)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 3. CRIAR política de LEITURA (todos usuários podem ler todos)
CREATE POLICY "Allow authenticated users to read all users"
ON users FOR SELECT
TO authenticated
USING (true);

-- 4. CRIAR política de ATUALIZAÇÃO (usuário só atualiza seus próprios dados)
CREATE POLICY "Users can update own data"
ON users FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- 5. CRIAR política de INSERT (para o registro automático funcionar)
CREATE POLICY "Users can insert own record"
ON users FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- 6. Verificar se funcionou
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'users';

-- ✅ Deve mostrar 3 políticas:
-- 1. Allow authenticated users to read all users (SELECT)
-- 2. Users can update own data (UPDATE)
-- 3. Users can insert own record (INSERT)
