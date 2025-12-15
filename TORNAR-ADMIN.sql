-- ============================================
-- TORNAR USUÁRIO ADMIN
-- ============================================

-- Execute este SQL no Supabase após criar sua conta

-- ⚠️ SUBSTITUA 'seu@email.com' pelo seu email!

UPDATE users 
SET is_admin = TRUE 
WHERE email = 'seu@email.com';

-- Verificar se funcionou:
SELECT email, team_name, is_admin 
FROM users 
WHERE email = 'seu@email.com';

-- ✅ Se is_admin = true, você é admin!

-- ============================================
-- ALTERNATIVA: Tornar TODOS os usuários admin (CUIDADO!)
-- ============================================

-- Descomente a linha abaixo se quiser tornar TODOS admin:
-- UPDATE users SET is_admin = TRUE;

-- ============================================
-- REMOVER ADMIN DE UM USUÁRIO
-- ============================================

-- UPDATE users SET is_admin = FALSE WHERE email = 'usuario@email.com';
