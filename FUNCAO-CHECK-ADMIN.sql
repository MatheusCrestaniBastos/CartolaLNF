-- ============================================
-- FUNÇÃO RPC PARA VERIFICAR ADMIN
-- ============================================

-- Esta função contorna o RLS para verificar se usuário é admin
-- Necessária porque o RLS pode bloquear a leitura de is_admin

CREATE OR REPLACE FUNCTION check_user_is_admin(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Executa com privilégios do criador (contorna RLS)
AS $$
DECLARE
    is_admin_result BOOLEAN;
BEGIN
    -- Verifica apenas is_admin (role é opcional)
    SELECT COALESCE(is_admin, FALSE)
    INTO is_admin_result
    FROM users
    WHERE id = user_uuid;
    
    RETURN COALESCE(is_admin_result, FALSE);
END;
$$;

-- Permitir que todos chamem esta função
GRANT EXECUTE ON FUNCTION check_user_is_admin(UUID) TO authenticated;

-- ============================================
-- TESTE
-- ============================================

-- Teste com seu ID de usuário:
-- SELECT check_user_is_admin('SEU-USER-ID-AQUI');

-- Deve retornar: true (se for admin) ou false (se não for)

-- ============================================
-- COMO USAR NO JAVASCRIPT
-- ============================================

/*
const { data, error } = await supabase.rpc('check_user_is_admin', {
    user_uuid: userId
});

console.log('É admin?', data);
*/
