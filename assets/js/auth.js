// ============================================
// LNF FANTASY - AUTENTICAÇÃO
// ============================================

class Auth {
    constructor() {
        this.currentUser = null;
    }

    // Obter usuário atual
    async getCurrentUser() {
        try {
            // Verificar se há sessão ativa
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            
            if (sessionError || !session) {
                this.currentUser = null;
                return null;
            }

            const user = session.user;
            if (!user) {
                this.currentUser = null;
                return null;
            }

            // Buscar dados completos do usuário
            let { data: userData, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('id', user.id)
                .single();

            // Se não encontrou, criar
            if (userError && userError.code === 'PGRST116') {
                const teamName = user.user_metadata?.team_name || 'Meu Time';
                
                const { data: newUser, error: createError } = await supabase
                    .from('users')
                    .insert({
                        id: user.id,
                        email: user.email,
                        team_name: teamName,
                        cartoletas: 50.00,
                        total_points: 0,
                        is_admin: false
                    })
                    .select()
                    .single();

                if (createError) {
                    console.error('Erro ao criar usuário:', createError);
                    return null;
                }

                userData = newUser;
            } else if (userError) {
                console.error('Erro ao buscar usuário:', userError);
                return null;
            }

            this.currentUser = userData;
            return userData;

        } catch (error) {
            console.error('Erro na autenticação:', error);
            return null;
        }
    }

    // Login
    async login(email, password) {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password: password
            });

            if (error) {
                throw new Error(error.message);
            }

            // Buscar dados do usuário
            const user = await this.getCurrentUser();
            
            if (!user) {
                throw new Error('Erro ao carregar dados do usuário');
            }

            return { success: true, user };

        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Registro
    async register(email, password, teamName) {
        try {
            // Criar usuário no Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: email.trim(),
                password: password,
                options: {
                    data: {
                        team_name: teamName.trim()
                    }
                }
            });

            if (authError) {
                throw new Error(authError.message);
            }

            if (!authData.user) {
                throw new Error('Erro ao criar usuário');
            }

            // Aguardar criação na tabela
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Atualizar nome do time
            const { error: updateError } = await supabase
                .from('users')
                .update({ team_name: teamName.trim() })
                .eq('id', authData.user.id);

            if (updateError) {
                console.warn('Aviso ao atualizar nome:', updateError);
            }

            // Fazer login automático
            const loginResult = await this.login(email, password);
            
            return loginResult;

        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Logout
    async logout() {
        try {
            const { error } = await supabase.auth.signOut();
            
            if (error) {
                throw new Error(error.message);
            }

            this.currentUser = null;
            return { success: true };

        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Proteger rota (redireciona se não autenticado)
    async requireAuth() {
        const user = await this.getCurrentUser();
        
        if (!user) {
            window.location.href = 'index.html';
            return null;
        }

        return user;
    }

    // Verificar se é admin
    isAdmin() {
        return this.currentUser && (this.currentUser.is_admin === true || this.currentUser.role === 'admin');
    }
    
    // Verificar e mostrar link admin
    async checkAndShowAdminLink() {
        console.log('🔍 Verificando se deve mostrar link Admin...');
        
        try {
            // Verificar sessão primeiro
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            
            if (sessionError || !session) {
                console.log('❌ Sem sessão ativa');
                return;
            }
            
            console.log('✅ Sessão ativa para:', session.user.email);
            
            let isAdmin = false;
            
            // Tentar buscar is_admin (sem role que não existe)
            console.log('📊 Verificando permissão admin...');
            const { data: userData, error } = await supabase
                .from('users')
                .select('is_admin, email')
                .eq('id', session.user.id)
                .single();
            
            if (!error && userData) {
                console.log('✅ Dados carregados');
                console.log('   - is_admin:', userData.is_admin);
                isAdmin = userData.is_admin === true;
            } else {
                console.warn('⚠️ Erro ao buscar dados:', error?.message);
                console.log('   Código:', error?.code);
                
                // Se der erro, tentar RPC
                console.log('   Tentando método alternativo...');
                const { data: isAdminRpc, error: rpcError } = await supabase
                    .rpc('check_user_is_admin', { user_uuid: session.user.id });
                
                if (!rpcError) {
                    console.log('✅ Método alternativo funcionou!');
                    isAdmin = isAdminRpc === true;
                } else {
                    console.error('❌ Método alternativo falhou:', rpcError);
                    isAdmin = false;
                }
            }
            
            console.log('🔐 Resultado final - É admin?', isAdmin);
            
            // Buscar elemento
            const adminLink = document.getElementById('admin-link');
            console.log('🔍 Elemento admin-link encontrado?', adminLink !== null);
            
            // Mostrar link se for admin
            if (adminLink && isAdmin) {
                adminLink.style.display = 'inline-flex';
                console.log('✅ ✅ ✅ Link Admin EXIBIDO! ✅ ✅ ✅');
            } else if (adminLink && !isAdmin) {
                console.log('ℹ️ Link Admin oculto (usuário não é admin)');
            } else if (!adminLink) {
                console.warn('⚠️ ATENÇÃO: Elemento admin-link NÃO encontrado no HTML!');
                console.warn('   Verifique se dashboard.html tem: <a id="admin-link" ...>');
            }
            
        } catch (error) {
            console.error('❌ ERRO CRÍTICO ao verificar link admin:', error);
            console.error('   Mensagem:', error.message);
            console.error('   Stack:', error.stack);
        }
    }
}

// ============================================
// Criar instância global
// ============================================

console.log('📦 Criando instância Auth...');

// Criar auth
const auth = new Auth();

// Garantir que está no window
if (typeof window !== 'undefined') {
    window.auth = auth;
    console.log('✅ Auth.js carregado - window.auth disponível');
} else {
    console.error('❌ Window não disponível!');
}

console.log('✅ Auth pronto:', typeof auth);
