// ============================================
// LNF FANTASY - INDEX (LOGIN/CADASTRO)
// ============================================

// Aguardar carregamento completo
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🔐 Página de login carregada');
    
    // Apenas verificar se há usuário logado (SEM redirecionar)
    if (typeof auth !== 'undefined') {
        try {
            const user = await auth.getCurrentUser();
            if (user) {
                console.log('ℹ️ Usuário já está logado:', user.email);
                mostrarUsuarioLogado(user);
            } else {
                console.log('ℹ️ Nenhum usuário logado');
            }
        } catch (error) {
            console.log('ℹ️ Erro ao verificar usuário:', error);
        }
    }
});

// Mostrar que usuário já está logado
function mostrarUsuarioLogado(user) {
    const loginCard = document.querySelector('.login-card');
    if (!loginCard) return;
    
    loginCard.innerHTML = `
        <div class="logo-section">
            <div class="logo-big">👋</div>
            <h1 class="logo-title">Bem-vindo de volta!</h1>
            <p class="logo-desc">Você já está conectado</p>
        </div>
        
        <div style="background: rgba(5, 217, 130, 0.1); padding: 20px; border-radius: 12px; margin-bottom: 24px; border: 2px solid rgba(5, 217, 130, 0.3);">
            <div style="display: flex; align-items: center; gap: 12px;">
                <div style="width: 56px; height: 56px; background: linear-gradient(135deg, #05D982, #FF6B00); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 28px;">
                    👤
                </div>
                <div>
                    <div style="font-weight: 700; font-size: 18px; color: var(--gray-900); margin-bottom: 4px;">${user.team_name}</div>
                    <div style="font-size: 14px; color: var(--gray-600);">${user.email}</div>
                </div>
            </div>
        </div>
        
        <button onclick="window.location.href='dashboard.html'" class="btn-submit" style="margin-bottom: 12px;">
            ⚽ Ir para Meu Time
        </button>
        
        <button onclick="fazerLogoutERecarregar()" class="btn-submit" style="background: var(--gray-500);">
            🚪 Sair e fazer outro login
        </button>
    `;
}

// Logout e recarregar
window.fazerLogoutERecarregar = async function() {
    const btn = event.target;
    btn.disabled = true;
    btn.textContent = 'Saindo...';
    
    await auth.logout();
    window.location.reload();
};

// ============================================
// SISTEMA DE TABS
// ============================================

function showTab(tab) {
    // Atualizar botões
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    const activeBtn = document.querySelector(`.tab[onclick*="${tab}"]`);
    if (activeBtn) activeBtn.classList.add('active');
    
    // Atualizar conteúdo
    document.querySelectorAll('.form-content').forEach(f => f.classList.remove('active'));
    const activeContent = document.getElementById(`form-${tab}`);
    if (activeContent) activeContent.classList.add('active');
    
    // Limpar alert
    hideAlert();
}

// ============================================
// ALERTAS
// ============================================

function showAlert(message, type = 'error') {
    const alert = document.getElementById('alert');
    alert.className = `alert show alert-${type}`;
    alert.textContent = message;
}

function hideAlert() {
    const alert = document.getElementById('alert');
    alert.className = 'alert';
}

// ============================================
// LOGIN
// ============================================

async function handleLogin(event) {
    event.preventDefault();
    hideAlert();
    
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const btn = event.target.querySelector('button[type="submit"]');
    
    btn.disabled = true;
    btn.textContent = 'Entrando...';
    
    try {
        const result = await auth.login(email, password);
        
        if (result.success) {
            showAlert('Login realizado com sucesso!', 'success');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 500);
        } else {
            showAlert(result.error || 'Erro ao fazer login');
            btn.disabled = false;
            btn.textContent = 'Entrar';
        }
    } catch (error) {
        showAlert('Erro ao fazer login: ' + error.message);
        btn.disabled = false;
        btn.textContent = 'Entrar';
    }
}

// ============================================
// CADASTRO
// ============================================

async function handleRegister(event) {
    event.preventDefault();
    hideAlert();
    
    const teamName = document.getElementById('register-team').value.trim();
    const email = document.getElementById('register-email').value.trim();
    const password = document.getElementById('register-password').value;
    const btn = event.target.querySelector('button[type="submit"]');
    
    // Validações
    if (teamName.length < 3) {
        showAlert('Nome do time deve ter pelo menos 3 caracteres');
        return;
    }
    
    if (password.length < 6) {
        showAlert('Senha deve ter pelo menos 6 caracteres');
        return;
    }
    
    btn.disabled = true;
    btn.textContent = 'Criando conta...';
    
    try {
        const result = await auth.register(email, password, teamName);
        
        if (result.success) {
            showAlert('Conta criada com sucesso!', 'success');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 500);
        } else {
            showAlert(result.error || 'Erro ao criar conta');
            btn.disabled = false;
            btn.textContent = 'Criar Conta';
        }
    } catch (error) {
        showAlert('Erro ao criar conta: ' + error.message);
        btn.disabled = false;
        btn.textContent = 'Criar Conta';
    }
}

console.log('✅ Index.js carregado - LNF Fantasy');
