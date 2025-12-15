-- ============================================
-- DIAGNÓSTICO COMPLETO DO SISTEMA
-- ============================================

-- Execute cada seção e veja os resultados

-- ========================================
-- 1. VERIFICAR RLS
-- ========================================
SELECT 
    tablename,
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'users';

-- ✅ Deve ter pelo menos 1 política de SELECT


-- ========================================
-- 2. VERIFICAR TRIGGER
-- ========================================
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users';

-- ✅ Deve ter o trigger "on_auth_user_created"


-- ========================================
-- 3. VERIFICAR FUNÇÃO REGISTER_USER
-- ========================================
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'register_user';

-- ✅ Deve existir a função


-- ========================================
-- 4. VERIFICAR USUÁRIOS EXISTENTES
-- ========================================
SELECT 
    id,
    email,
    team_name,
    cartoletas,
    total_points,
    is_admin,
    created_at
FROM users
ORDER BY created_at DESC
LIMIT 10;

-- ✅ Deve mostrar os usuários


-- ========================================
-- 5. BUSCAR SEU USUÁRIO ESPECÍFICO
-- ========================================
-- ⚠️ SUBSTITUA pelo ID do seu usuário (veja no erro 406)
SELECT * FROM users WHERE id = 'b40ff61c-a6f8-40eb-9b98-110404fadedb';

-- ✅ Se retornar vazio, o registro não existe!


-- ========================================
-- 6. SE O REGISTRO NÃO EXISTIR, CRIAR MANUALMENTE
-- ========================================
-- ⚠️ SUBSTITUA com seus dados:
INSERT INTO users (id, email, team_name, cartoletas, total_points, is_admin)
VALUES (
    'b40ff61c-a6f8-40eb-9b98-110404fadedb',  -- ← SEU USER ID
    'seu@email.com',                          -- ← SEU EMAIL
    'Meu Time',                               -- ← NOME DO TIME
    100.00,
    0,
    false
)
ON CONFLICT (id) DO NOTHING;

-- ✅ Isso cria o registro se não existir


-- ========================================
-- 7. VERIFICAR SE AGORA FUNCIONA
-- ========================================
SELECT * FROM users WHERE id = 'b40ff61c-a6f8-40eb-9b98-110404fadedb';

-- ✅ Deve retornar seus dados


-- ========================================
-- 8. TORNAR ADMIN (OPCIONAL)
-- ========================================
UPDATE users 
SET is_admin = TRUE 
WHERE id = 'b40ff61c-a6f8-40eb-9b98-110404fadedb';

-- ✅ Agora você é admin!
