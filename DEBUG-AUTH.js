// ============================================
// DEBUG - VERIFICAR AUTENTICAÇÃO
// ============================================

// Cole este código no Console do navegador (F12) após fazer login

async function debugAuth() {
    console.log('🔍 INICIANDO DEBUG...\n');
    
    // 1. Verificar Supabase
    console.log('1️⃣ Verificando Supabase...');
    if (typeof supabase === 'undefined') {
        console.error('❌ ERRO: Supabase não está carregado!');
        return;
    }
    console.log('✅ Supabase OK\n');
    
    // 2. Verificar sessão
    console.log('2️⃣ Verificando sessão...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
        console.error('❌ Erro ao buscar sessão:', sessionError);
        return;
    }
    if (!session) {
        console.error('❌ Nenhuma sessão ativa!');
        return;
    }
    console.log('✅ Sessão ativa');
    console.log('   User ID:', session.user.id);
    console.log('   Email:', session.user.email, '\n');
    
    // 3. Verificar usuário na auth
    console.log('3️⃣ Verificando auth.users...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) {
        console.error('❌ Erro ao buscar usuário:', userError);
        return;
    }
    if (!user) {
        console.error('❌ Usuário não encontrado!');
        return;
    }
    console.log('✅ Usuário na auth OK');
    console.log('   ID:', user.id);
    console.log('   Email:', user.email);
    console.log('   Metadata:', user.user_metadata, '\n');
    
    // 4. Verificar se tabela users existe
    console.log('4️⃣ Verificando tabela users...');
    try {
        const { data, error, count } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true });
        
        if (error) {
            console.error('❌ ERRO ao acessar tabela users:', error);
            console.log('   Mensagem:', error.message);
            console.log('   Código:', error.code);
            return;
        }
        console.log('✅ Tabela users existe');
        console.log('   Total de registros:', count, '\n');
    } catch (e) {
        console.error('❌ EXCEÇÃO ao acessar tabela users:', e);
        return;
    }
    
    // 5. Buscar registro do usuário
    console.log('5️⃣ Buscando registro na tabela users...');
    try {
        const { data: userData, error: searchError } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();
        
        if (searchError) {
            console.error('❌ ERRO ao buscar usuário:', searchError);
            console.log('   Mensagem:', searchError.message);
            console.log('   Código:', searchError.code);
            console.log('   Detalhes:', searchError.details);
            
            // Verificar se o registro existe
            console.log('\n🔍 Verificando se o registro existe (sem .single())...');
            const { data: allData, error: allError } = await supabase
                .from('users')
                .select('*')
                .eq('id', user.id);
            
            if (allError) {
                console.error('❌ Erro na verificação:', allError);
            } else {
                console.log('   Registros encontrados:', allData?.length || 0);
                if (allData && allData.length > 0) {
                    console.log('   Dados:', allData[0]);
                } else {
                    console.error('❌ REGISTRO NÃO EXISTE NA TABELA USERS!');
                    console.log('\n💡 SOLUÇÃO:');
                    console.log('   Execute no SQL Editor do Supabase:');
                    console.log(`   INSERT INTO users (id, email, team_name, cartoletas, total_points, is_admin)`);
                    console.log(`   VALUES ('${user.id}', '${user.email}', 'Meu Time', 100.00, 0, FALSE);`);
                }
            }
            return;
        }
        
        console.log('✅ Usuário encontrado na tabela users!');
        console.log('   ID:', userData.id);
        console.log('   Email:', userData.email);
        console.log('   Time:', userData.team_name);
        console.log('   Cartoletas:', userData.cartoletas);
        console.log('   Pontos:', userData.total_points);
        console.log('   Admin:', userData.is_admin);
        
    } catch (e) {
        console.error('❌ EXCEÇÃO ao buscar usuário:', e);
        return;
    }
    
    console.log('\n✅ DEBUG COMPLETO - Tudo OK!');
}

// Executar debug
debugAuth();
