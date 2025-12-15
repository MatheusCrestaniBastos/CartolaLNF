-- ============================================
-- ADICIONAR COLUNA ROLE (OPCIONAL)
-- ============================================

-- Se você quiser usar o campo 'role' além de 'is_admin',
-- execute este SQL:

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT NULL;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Verificar se funcionou
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'role';

-- Ver seus dados
SELECT id, email, is_admin, role FROM users LIMIT 5;

-- ============================================
-- EXEMPLOS DE USO
-- ============================================

-- Definir role como 'admin'
UPDATE users SET role = 'admin' WHERE email = 'SEU@EMAIL.com';

-- Definir role como 'moderator'
UPDATE users SET role = 'moderator' WHERE email = 'OUTRO@EMAIL.com';

-- Ver todos os admins (usando is_admin OU role)
SELECT email, is_admin, role 
FROM users 
WHERE is_admin = TRUE OR role = 'admin';

-- ============================================
-- NOTA
-- ============================================

/*
A coluna 'role' é OPCIONAL!

O sistema funciona perfeitamente apenas com 'is_admin'.

Use 'role' se quiser diferentes níveis de acesso:
- admin: acesso total
- moderator: acesso parcial
- user: acesso normal (null ou 'user')

Se não precisar disso, NÃO precisa adicionar a coluna!
*/
