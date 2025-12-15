// ============================================
// LNF FANTASY - PAINEL ADMIN COMPLETO
// ============================================

let currentUser = null;
let allTeams = [];
let allPlayers = [];
let allRounds = [];

// ============================================
// PROTEÇÃO DE ACESSO (SÓ ADMIN)
// ============================================

document.addEventListener('DOMContentLoaded', async function() {
    console.log('🔒 Verificando permissões de admin...');
    
    // Aguardar auth carregar
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Verificar autenticação
    if (typeof auth === 'undefined') {
        console.error('❌ Auth não carregado!');
        alert('Erro ao carregar sistema de autenticação.');
        window.location.href = 'index.html';
        return;
    }
    
    currentUser = await auth.requireAuth();
    if (!currentUser) {
        console.log('❌ Não autenticado, redirecionando...');
        return;
    }
    
    console.log('✅ Usuário autenticado:', currentUser.email);
    
    // Verificar se é admin
    try {
        const { data: userData, error } = await supabase
            .from('users')
            .select('is_admin, role')
            .eq('id', currentUser.id)
            .single();
        
        if (error) {
            console.error('❌ Erro ao verificar permissões:', error);
            alert('Erro ao verificar permissões de administrador.');
            window.location.href = 'dashboard.html';
            return;
        }
        
        const isAdmin = userData.is_admin === true || userData.role === 'admin';
        
        if (!isAdmin) {
            console.warn('⚠️ Usuário não é admin!');
            alert('❌ ACESSO NEGADO!\n\nApenas administradores podem acessar esta página.\n\nUsuário: ' + currentUser.email);
            window.location.href = 'dashboard.html';
            return;
        }
        
        console.log('✅ Acesso admin autorizado');
        
        // Mostrar nome (se elemento existir)
        const adminNameEl = document.getElementById('admin-name');
        if (adminNameEl) {
            adminNameEl.textContent = currentUser.team_name;
        }
        
        // Inicializar painel
        await init();
        
    } catch (error) {
        console.error('❌ Erro na verificação:', error);
        alert('Erro ao verificar permissões: ' + error.message);
        window.location.href = 'dashboard.html';
    }
});

// ============================================
// INICIALIZAÇÃO
// ============================================

async function init() {
    try {
        setupTabs();
        await loadStats();
        await loadTeams();
        await loadPlayers();
        await loadRounds();
        setupEventListeners();
        setupScoutCalculator();
        
        // Remover tela de loading
        const loading = document.getElementById('admin-loading');
        if (loading) {
            loading.style.opacity = '0';
            setTimeout(() => loading.remove(), 300);
        }
        
        console.log('✅ Painel admin carregado');
    } catch (error) {
        console.error('Erro ao inicializar:', error);
        
        // Remover loading mesmo com erro
        const loading = document.getElementById('admin-loading');
        if (loading) loading.remove();
    }
}

// ============================================
// TABS
// ============================================

function setupTabs() {
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.tab;
            
            // Atualizar tabs
            document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Atualizar conteúdo
            document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
            document.getElementById(`tab-${target}`).classList.add('active');
        });
    });
}

// ============================================
// ESTATÍSTICAS
// ============================================

async function loadStats() {
    try {
        const [players, teams, rounds, users] = await Promise.all([
            supabase.from('players').select('*', { count: 'exact', head: true }),
            supabase.from('teams').select('*', { count: 'exact', head: true }),
            supabase.from('rounds').select('*', { count: 'exact', head: true }),
            supabase.from('users').select('*', { count: 'exact', head: true })
        ]);
        
        setText('stat-players', players.count || 0);
        setText('stat-teams', teams.count || 0);
        setText('stat-rounds', rounds.count || 0);
        setText('stat-users', users.count || 0);
    } catch (error) {
        console.error('Erro ao carregar stats:', error);
    }
}

// ============================================
// TIMES
// ============================================

async function loadTeams() {
    try {
        const { data, error } = await supabase
            .from('teams')
            .select('id, name, logo_url')
            .order('name');
        
        if (error) throw error;
        
        allTeams = data || [];
        renderTeams();
        fillTeamSelects();
        
    } catch (error) {
        console.error('Erro ao carregar times:', error);
    }
}

function renderTeams() {
    const tbody = document.getElementById('teams-list');
    
    if (allTeams.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="text-center empty-state"><div class="empty-state-icon">🏆</div><div class="empty-state-text">Nenhum time cadastrado</div><div class="empty-state-hint">Adicione times da LNF</div></td></tr>';
        return;
    }
    
    const html = allTeams.map(t => `
        <tr>
            <td>
                <div style="display:flex;align-items:center;gap:10px">
                    ${t.logo_url ? `<img src="${t.logo_url}" style="width:30px;height:30px;object-fit:contain" onerror="this.style.display='none'">` : ''}
                    <strong>${t.name}</strong>
                </div>
            </td>
            <td class="text-center">
                <span id="team-players-${t.id}">-</span>
            </td>
            <td class="text-center">
                <button onclick="deleteTeam(${t.id})" class="btn btn-sm btn-danger action-btn">Excluir</button>
            </td>
        </tr>
    `).join('');
    
    tbody.innerHTML = html;
    
    // Contar jogadores por time
    allTeams.forEach(async t => {
        const count = allPlayers.filter(p => p.team_id === t.id).length;
        setText(`team-players-${t.id}`, count);
    });
}

function fillTeamSelects() {
    const selects = ['player-team', 'edit-player-team', 'filter-team'];
    
    selects.forEach(id => {
        const select = document.getElementById(id);
        if (!select) return;
        
        const options = allTeams.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
        
        if (id === 'filter-team') {
            select.innerHTML = '<option value="">Todos Times</option>' + options;
        } else {
            select.innerHTML = '<option value="">Selecione...</option>' + options;
        }
    });
}

document.getElementById('form-add-team')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('team-name').value.trim();
    const logo = document.getElementById('team-logo').value.trim();
    
    try {
        const { error } = await supabase
            .from('teams')
            .insert({ name, logo_url: logo || null });
        
        if (error) throw error;
        
        alert('✅ Time adicionado!');
        e.target.reset();
        await loadTeams();
        await loadStats();
        
    } catch (error) {
        alert('❌ Erro: ' + error.message);
    }
});

async function deleteTeam(id) {
    if (!confirm('Excluir este time?\n\nIsso afetará os jogadores vinculados.')) return;
    
    try {
        const { error } = await supabase
            .from('teams')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        alert('✅ Time excluído!');
        await loadTeams();
        await loadPlayers();
        await loadStats();
        
    } catch (error) {
        alert('❌ Erro: ' + error.message);
    }
}

// ============================================
// JOGADORES
// ============================================

async function loadPlayers() {
    try {
        const { data, error } = await supabase
            .from('players')
            .select(`
                id, name, position, price, photo_url, team_id,
                teams (id, name)
            `)
            .order('name');
        
        if (error) throw error;
        
        allPlayers = data || [];
        renderPlayers(allPlayers);
        fillPlayerSelect();
        
    } catch (error) {
        console.error('Erro ao carregar jogadores:', error);
    }
}

function renderPlayers(players) {
    const tbody = document.getElementById('players-list');
    
    if (players.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center empty-state"><div class="empty-state-icon">⚽</div><div class="empty-state-text">Nenhum jogador cadastrado</div><div class="empty-state-hint">Adicione jogadores</div></td></tr>';
        return;
    }
    
    const posColors = {
        'GOL': 'background:#fef3c7;color:#92400e',
        'FIX': 'background:#dbeafe;color:#1e40af',
        'ALA': 'background:#d1fae5;color:#065f46',
        'PIV': 'background:#fee2e2;color:#991b1b'
    };
    
    const html = players.map(p => `
        <tr>
            <td>
                <div style="font-weight:600">${p.name}</div>
                ${p.photo_url ? `<small style="color:#6b7280">Foto: ✓</small>` : ''}
            </td>
            <td><span style="padding:4px 8px;border-radius:4px;font-size:11px;font-weight:700;${posColors[p.position]}">${p.position}</span></td>
            <td>${p.teams?.name || '-'}</td>
            <td class="text-right"><strong>C$ ${p.price.toFixed(2)}</strong></td>
            <td class="text-center">
                <button onclick="editPlayer(${p.id})" class="btn btn-sm btn-primary action-btn">Editar</button>
                <button onclick="deletePlayer(${p.id})" class="btn btn-sm btn-danger action-btn">Excluir</button>
            </td>
        </tr>
    `).join('');
    
    tbody.innerHTML = html;
}

function fillPlayerSelect() {
    const select = document.getElementById('scout-player');
    if (!select) return;
    
    const options = allPlayers.map(p => 
        `<option value="${p.id}">${p.name} (${p.position}) - ${p.teams?.name || 'S/T'}</option>`
    ).join('');
    
    select.innerHTML = '<option value="">Selecione...</option>' + options;
}

document.getElementById('form-add-player')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('player-name').value.trim();
    const position = document.getElementById('player-position').value;
    const team_id = document.getElementById('player-team').value;
    const price = parseFloat(document.getElementById('player-price').value);
    const photo = document.getElementById('player-photo').value.trim();
    
    try {
        const { error } = await supabase
            .from('players')
            .insert({ name, position, team_id, price, photo_url: photo || null });
        
        if (error) throw error;
        
        alert('✅ Jogador adicionado!');
        e.target.reset();
        await loadPlayers();
        await loadStats();
        
    } catch (error) {
        alert('❌ Erro: ' + error.message);
    }
});

async function editPlayer(id) {
    const player = allPlayers.find(p => p.id === id);
    if (!player) return;
    
    // Verificar se elementos existem antes de usar
    const editId = document.getElementById('edit-player-id');
    const editName = document.getElementById('edit-player-name');
    const editPosition = document.getElementById('edit-player-position');
    const editTeam = document.getElementById('edit-player-team');
    const editPrice = document.getElementById('edit-player-price');
    const editPhoto = document.getElementById('edit-player-photo');
    
    if (!editId || !editName || !editPosition || !editTeam || !editPrice) {
        console.warn('Modal de edição não encontrado no HTML');
        
        // Alternativa: usar prompt
        const newName = prompt('Nome do jogador:', player.name);
        if (!newName) return;
        
        const newPrice = prompt('Preço (C$):', player.price);
        if (!newPrice) return;
        
        try {
            const { error } = await supabase
                .from('players')
                .update({
                    name: newName.trim(),
                    price: parseFloat(newPrice)
                })
                .eq('id', id);
            
            if (error) throw error;
            
            alert('Jogador atualizado!');
            await loadPlayers();
        } catch (error) {
            console.error('Erro ao atualizar:', error);
            alert('Erro ao atualizar: ' + error.message);
        }
        return;
    }
    
    editId.value = player.id;
    editName.value = player.name;
    editPosition.value = player.position;
    editTeam.value = player.team_id;
    editPrice.value = player.price;
    if (editPhoto) editPhoto.value = player.photo_url || '';
    
    openModal('modal-edit-player');
}

document.getElementById('form-edit-player')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('edit-player-id').value;
    const name = document.getElementById('edit-player-name').value.trim();
    const position = document.getElementById('edit-player-position').value;
    const team_id = document.getElementById('edit-player-team').value;
    const price = parseFloat(document.getElementById('edit-player-price').value);
    const photo = document.getElementById('edit-player-photo').value.trim();
    
    try {
        const { error } = await supabase
            .from('players')
            .update({ name, position, team_id, price, photo_url: photo || null })
            .eq('id', id);
        
        if (error) throw error;
        
        alert('✅ Jogador atualizado!');
        closeModal('modal-edit-player');
        await loadPlayers();
        
    } catch (error) {
        alert('❌ Erro: ' + error.message);
    }
});

async function deletePlayer(id) {
    if (!confirm('Excluir este jogador?')) return;
    
    try {
        const { error } = await supabase
            .from('players')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        alert('✅ Jogador excluído!');
        await loadPlayers();
        await loadStats();
        
    } catch (error) {
        alert('❌ Erro: ' + error.message);
    }
}

// Filtros
document.getElementById('filter-position')?.addEventListener('change', filterPlayers);
document.getElementById('filter-team')?.addEventListener('change', filterPlayers);

function filterPlayers() {
    const position = document.getElementById('filter-position').value;
    const team = document.getElementById('filter-team').value;
    
    let filtered = allPlayers.filter(p => {
        const matchPos = !position || p.position === position;
        const matchTeam = !team || p.team_id == team;
        return matchPos && matchTeam;
    });
    
    renderPlayers(filtered);
}

// ============================================
// RODADAS
// ============================================

async function loadRounds() {
    try {
        const { data, error } = await supabase
            .from('rounds')
            .select('*')
            .order('id', { ascending: false });
        
        if (error) throw error;
        
        allRounds = data || [];
        renderRounds();
        fillRoundSelects();
        
    } catch (error) {
        console.error('Erro ao carregar rodadas:', error);
    }
}

function renderRounds() {
    const tbody = document.getElementById('rounds-list');
    
    if (allRounds.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center empty-state"><div class="empty-state-icon">📊</div><div class="empty-state-text">Nenhuma rodada criada</div><div class="empty-state-hint">Crie a primeira rodada</div></td></tr>';
        return;
    }
    
    const statusClass = {
        'pending': 'status-pending',
        'active': 'status-active',
        'finished': 'status-finished'
    };
    
    const statusText = {
        'pending': 'Pendente',
        'active': 'Ativa',
        'finished': 'Finalizada'
    };
    
    const html = allRounds.map(r => `
        <tr>
            <td><strong>${r.name}</strong></td>
            <td><span class="status-badge ${statusClass[r.status]}">${statusText[r.status]}</span></td>
            <td class="text-center" id="round-lineups-${r.id}">-</td>
            <td class="text-center">
                ${r.status === 'pending' ? `<button onclick="quickStartRound(${r.id})" class="btn btn-sm btn-success action-btn">Iniciar</button>` : ''}
                ${r.status === 'active' ? `<button onclick="quickFinishRound(${r.id})" class="btn btn-sm btn-primary action-btn">Finalizar</button>` : ''}
                <button onclick="quickDeleteRound(${r.id})" class="btn btn-sm btn-danger action-btn">Excluir</button>
            </td>
        </tr>
    `).join('');
    
    tbody.innerHTML = html;
    
    // Contar escalações
    allRounds.forEach(async r => {
        const { count } = await supabase
            .from('lineups')
            .select('*', { count: 'exact', head: true })
            .eq('round_id', r.id);
        
        setText(`round-lineups-${r.id}`, count || 0);
    });
}

function fillRoundSelects() {
    const selects = ['round-manage', 'scout-round', 'lineups-round'];
    
    selects.forEach(id => {
        const select = document.getElementById(id);
        if (!select) return;
        
        const options = allRounds.map(r => {
            const status = r.status === 'active' ? '🔴' : r.status === 'finished' ? '✓' : '⏳';
            return `<option value="${r.id}">${r.name} ${status}</option>`;
        }).join('');
        
        select.innerHTML = '<option value="">Selecione...</option>' + options;
    });
}

document.getElementById('form-add-round')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('round-name').value.trim();
    
    try {
        const { error } = await supabase
            .from('rounds')
            .insert({ name, status: 'pending' });
        
        if (error) throw error;
        
        alert('✅ Rodada criada!');
        e.target.reset();
        await loadRounds();
        await loadStats();
        
    } catch (error) {
        alert('❌ Erro: ' + error.message);
    }
});

async function startRound() {
    const id = document.getElementById('round-manage').value;
    if (!id) {
        alert('⚠️ Selecione uma rodada!');
        return;
    }
    await quickStartRound(parseInt(id));
}

async function quickStartRound(id) {
    if (!confirm('Iniciar esta rodada?\n\n✓ Mercado será FECHADO\n✓ Usuários não poderão mais alterar escalações')) return;
    
    try {
        const { error } = await supabase
            .from('rounds')
            .update({ status: 'active' })
            .eq('id', id);
        
        if (error) throw error;
        
        alert('✅ Rodada iniciada!\n🔒 Mercado fechado.');
        await loadRounds();
        
    } catch (error) {
        alert('❌ Erro: ' + error.message);
    }
}

async function finishRound() {
    const id = document.getElementById('round-manage').value;
    if (!id) {
        alert('⚠️ Selecione uma rodada!');
        return;
    }
    await quickFinishRound(parseInt(id));
}

async function quickFinishRound(id) {
    if (!confirm('Finalizar esta rodada?\n\n✓ Mercado será REABERTO\n✓ Jogadores serão valorizados/desvalorizados\n✓ Cartoletas atualizadas automaticamente')) return;
    
    try {
        console.log('🏁 Finalizando rodada', id);
        
        // 1. Processar valorização/desvalorização dos jogadores
        console.log('💰 Processando valorização...');
        const valorizacaoResult = await processPlayerValorization(id);
        
        if (!valorizacaoResult.success) {
            throw new Error('Erro ao processar valorização: ' + valorizacaoResult.error);
        }
        
        console.log(`✅ Valorização processada: ${valorizacaoResult.valorizados} ↑ | ${valorizacaoResult.desvalorizados} ↓`);
        
        // 2. Atualizar cartoletas dos usuários baseado no valor atual dos times
        console.log('💵 Atualizando cartoletas...');
        const cartoletasResult = await updateUserCartoletas(id);
        
        if (!cartoletasResult.success) {
            console.warn('Aviso ao atualizar cartoletas:', cartoletasResult.error);
        }
        
        console.log(`✅ Cartoletas atualizadas: ${cartoletasResult.updated} usuários`);
        
        // 3. Finalizar rodada
        const { error: roundError } = await supabase
            .from('rounds')
            .update({ status: 'finished' })
            .eq('id', id);
        
        if (roundError) throw roundError;
        
        // 4. Mostrar resumo
        alert(`✅ Rodada finalizada!\n\n🔓 Mercado reaberto\n💰 ${valorizacaoResult.valorizados} jogadores valorizaram\n📉 ${valorizacaoResult.desvalorizados} jogadores desvalorizaram\n💵 ${cartoletasResult.updated} usuários atualizados`);
        
        await loadRounds();
        
    } catch (error) {
        console.error('❌ Erro ao finalizar rodada:', error);
        alert('❌ Erro: ' + error.message);
    }
}

// ============================================
// SISTEMA DE VALORIZAÇÃO
// ============================================

async function processPlayerValorization(roundId) {
    try {
        console.log('💰 Iniciando valorização da rodada', roundId);
        
        // Buscar todos os jogadores com estatísticas nessa rodada
        const { data: stats, error: statsError } = await supabase
            .from('player_stats')
            .select('player_id, points, players(id, name, price)')
            .eq('round_id', roundId);
        
        if (statsError) throw statsError;
        
        if (!stats || stats.length === 0) {
            console.log('⚠️ Nenhuma estatística encontrada para valorização');
            return { success: true, valorizados: 0, desvalorizados: 0, mantidos: 0 };
        }
        
        console.log(`📊 ${stats.length} jogadores com estatísticas`);
        
        let valorizados = 0;
        let desvalorizados = 0;
        let mantidos = 0;
        
        // Processar cada jogador
        for (const stat of stats) {
            const player = stat.players;
            const points = stat.points || 0;
            const currentPrice = player.price;
            
            // Calcular nova valorização
            const result = calculatePriceChange(currentPrice, points);
            
            if (result.change === 0) {
                mantidos++;
                continue;
            }
            
            // Atualizar preço do jogador
            const { error: updateError } = await supabase
                .from('players')
                .update({ price: result.newPrice })
                .eq('id', player.id);
            
            if (updateError) {
                console.error(`❌ Erro ao atualizar ${player.name}:`, updateError);
                continue;
            }
            
            // Contabilizar
            if (result.change > 0) {
                valorizados++;
                console.log(`↑ ${player.name}: C$ ${currentPrice.toFixed(2)} → C$ ${result.newPrice.toFixed(2)} (+${result.change.toFixed(2)})`);
            } else {
                desvalorizados++;
                console.log(`↓ ${player.name}: C$ ${currentPrice.toFixed(2)} → C$ ${result.newPrice.toFixed(2)} (${result.change.toFixed(2)})`);
            }
        }
        
        console.log(`✅ Valorização concluída: ${valorizados} ↑ | ${desvalorizados} ↓ | ${mantidos} =`);
        
        return {
            success: true,
            valorizados,
            desvalorizados,
            mantidos
        };
        
    } catch (error) {
        console.error('❌ Erro na valorização:', error);
        return { success: false, error: error.message };
    }
}

function calculatePriceChange(currentPrice, points) {
    // Regras de valorização baseadas em pontos
    let percentChange = 0;
    
    if (points >= 15) {
        percentChange = 0.15; // +15% (excelente)
    } else if (points >= 10) {
        percentChange = 0.10; // +10% (muito bom)
    } else if (points >= 5) {
        percentChange = 0.05; // +5% (bom)
    } else if (points >= 0) {
        percentChange = 0; // Mantém (regular)
    } else if (points >= -5) {
        percentChange = -0.05; // -5% (ruim)
    } else {
        percentChange = -0.10; // -10% (péssimo)
    }
    
    // Calcular nova variação
    let change = currentPrice * percentChange;
    
    // Limitar mudança máxima por rodada
    const MAX_CHANGE = 2.00;
    if (Math.abs(change) > MAX_CHANGE) {
        change = change > 0 ? MAX_CHANGE : -MAX_CHANGE;
    }
    
    // Calcular novo preço
    let newPrice = currentPrice + change;
    
    // Limites de preço
    const MIN_PRICE = 1.00;
    const MAX_PRICE = 20.00;
    
    if (newPrice < MIN_PRICE) {
        newPrice = MIN_PRICE;
        change = newPrice - currentPrice;
    } else if (newPrice > MAX_PRICE) {
        newPrice = MAX_PRICE;
        change = newPrice - currentPrice;
    }
    
    // Arredondar para 2 decimais
    newPrice = parseFloat(newPrice.toFixed(2));
    change = parseFloat(change.toFixed(2));
    
    return { newPrice, change };
}

async function updateUserCartoletas(roundId) {
    try {
        console.log('💵 Atualizando cartoletas dos usuários...');
        
        // Buscar todas as escalações da rodada
        const { data: lineups, error: lineupsError } = await supabase
            .from('lineups')
            .select('id, user_id')
            .eq('round_id', roundId);
        
        if (lineupsError) throw lineupsError;
        
        if (!lineups || lineups.length === 0) {
            console.log('⚠️ Nenhuma escalação encontrada');
            return { success: true, updated: 0 };
        }
        
        console.log(`📋 ${lineups.length} escalação(ões) encontrada(s)`);
        
        let updated = 0;
        
        // Para cada escalação
        for (const lineup of lineups) {
            // Buscar jogadores da escalação (com preço ATUAL - já valorizado)
            const { data: players, error: playersError } = await supabase
                .from('lineup_players')
                .select('player_id, players(price)')
                .eq('lineup_id', lineup.id)
                .eq('is_starter', true);
            
            if (playersError) {
                console.error(`❌ Erro ao buscar jogadores da lineup ${lineup.id}:`, playersError);
                continue;
            }
            
            // Calcular patrimônio total (valor dos 5 jogadores)
            const totalValue = players.reduce((sum, p) => {
                return sum + (p.players?.price || 0);
            }, 0);
            
            console.log(`💰 Usuário ${lineup.user_id}: C$ ${totalValue.toFixed(2)}`);
            
            // Atualizar cartoletas do usuário
            const { error: updateError } = await supabase
                .from('users')
                .update({ cartoletas: parseFloat(totalValue.toFixed(2)) })
                .eq('id', lineup.user_id);
            
            if (updateError) {
                console.error(`❌ Erro ao atualizar usuário ${lineup.user_id}:`, updateError);
                continue;
            }
            
            updated++;
        }
        
        console.log(`✅ ${updated} usuário(s) atualizado(s)`);
        
        return { success: true, updated };
        
    } catch (error) {
        console.error('❌ Erro ao atualizar cartoletas:', error);
        return { success: false, error: error.message };
    }
}

async function deleteRound() {
    const id = document.getElementById('round-manage').value;
    if (!id) {
        alert('⚠️ Selecione uma rodada!');
        return;
    }
    await quickDeleteRound(parseInt(id));
}

async function quickDeleteRound(id) {
    if (!confirm('⚠️ ATENÇÃO!\n\nExcluir esta rodada irá:\n• Deletar todas as escalações\n• Deletar todos os scouts\n\nDeseja continuar?')) return;
    
    try {
        const { error } = await supabase
            .from('rounds')
            .delete()
            .eq('id', id);
        
        if (error) throw error;
        
        alert('✅ Rodada excluída!');
        await loadRounds();
        await loadStats();
        
    } catch (error) {
        alert('❌ Erro: ' + error.message);
    }
}

// ============================================
// SCOUTS
// ============================================

function setupScoutCalculator() {
    const inputs = [
        'scout-goals', 'scout-assists', 'scout-saves',
        'scout-own', 'scout-yellow', 'scout-red', 'scout-clean'
    ];
    
    inputs.forEach(id => {
        document.getElementById(id)?.addEventListener('input', calculateScoutPoints);
        document.getElementById(id)?.addEventListener('change', calculateScoutPoints);
    });
}

function calculateScoutPoints() {
    const goals = parseInt(document.getElementById('scout-goals')?.value) || 0;
    const assists = parseInt(document.getElementById('scout-assists')?.value) || 0;
    const saves = parseInt(document.getElementById('scout-saves')?.value) || 0;
    const cleanSheet = document.getElementById('scout-clean')?.checked ? 1 : 0;
    const ownGoals = parseInt(document.getElementById('scout-own')?.value) || 0;
    const yellow = parseInt(document.getElementById('scout-yellow')?.value) || 0;
    const red = parseInt(document.getElementById('scout-red')?.value) || 0;
    
    // NOVA TABELA DE PONTOS
    const points = (goals * 5) +           // Gol: 5 pts
                   (assists * 3) +         // Assist: 3 pts  
                   (saves * 1.5) +         // Defesa: 1.5 pts
                   (cleanSheet * 5) -      // Sem sofrer: 5 pts
                   (ownGoals * 3) -        // Gol contra: -3 pts
                   (yellow * 1) -          // Amarelo: -1 pt
                   (red * 5);              // Vermelho: -5 pts
    
    const preview = document.getElementById('points-preview');
    if (preview) {
        preview.textContent = points.toFixed(1);
    }
}

document.getElementById('form-add-scout')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const round_id = document.getElementById('scout-round')?.value;
    const player_id = document.getElementById('scout-player')?.value;
    
    if (!round_id || !player_id) {
        alert('⚠️ Selecione rodada e jogador!');
        return;
    }
    
    const goals = parseInt(document.getElementById('scout-goals')?.value) || 0;
    const assists = parseInt(document.getElementById('scout-assists')?.value) || 0;
    const saves = parseInt(document.getElementById('scout-saves')?.value) || 0;
    const cleanSheet = document.getElementById('scout-clean')?.checked ? 1 : 0;
    const ownGoals = parseInt(document.getElementById('scout-own')?.value) || 0;
    const yellow = parseInt(document.getElementById('scout-yellow')?.value) || 0;
    const red = parseInt(document.getElementById('scout-red')?.value) || 0;
    
    // NOVA TABELA DE PONTOS
    const points = (goals * 5) +           // Gol: 5 pts
                   (assists * 3) +         // Assist: 3 pts
                   (saves * 1.5) +         // Defesa: 1.5 pts
                   (cleanSheet * 5) -      // Sem sofrer: 5 pts
                   (ownGoals * 3) -        // Gol contra: -3 pts
                   (yellow * 1) -          // Amarelo: -1 pt
                   (red * 5);              // Vermelho: -5 pts
    
    try {
        const { error } = await supabase
            .from('player_stats')
            .upsert({
                round_id,
                player_id,
                goals,
                assists,
                saves,
                clean_sheet: cleanSheet,
                own_goals: ownGoals,
                yellow_cards: yellow,
                red_cards: red,
                points
            }, {
                onConflict: 'round_id,player_id'
            });
        
        if (error) throw error;
        
        alert(`✅ Scout salvo!\n\n⚽ Pontuação: ${points.toFixed(1)}`);
        e.target.reset();
        calculateScoutPoints();
        
    } catch (error) {
        alert('❌ Erro: ' + error.message);
    }
});

// ============================================
// ESCALAÇÕES
// ============================================

async function loadLineups() {
    const roundId = document.getElementById('lineups-round').value;
    const container = document.getElementById('lineups-container');
    
    if (!roundId) {
        container.innerHTML = '<p class="text-center" style="color:#6b7280;padding:40px">Selecione uma rodada</p>';
        return;
    }
    
    try {
        container.innerHTML = '<div class="text-center" style="padding:40px"><div class="spinner"></div></div>';
        
        const { data: lineups, error } = await supabase
            .from('lineups')
            .select(`
                id, total_points,
                users (team_name),
                lineup_players (
                    points,
                    players (name, position, price)
                )
            `)
            .eq('round_id', roundId)
            .order('total_points', { ascending: false });
        
        if (error) throw error;
        
        if (!lineups || lineups.length === 0) {
            container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">👥</div><div class="empty-state-text">Nenhuma escalação nesta rodada</div></div>';
            return;
        }
        
        const html = lineups.map((lineup, index) => `
            <div class="lineup-item">
                <div class="lineup-header">
                    <div>
                        <span style="font-size:24px;margin-right:10px">${index + 1}º</span>
                        <span class="lineup-user">${lineup.users.team_name}</span>
                    </div>
                    <div class="lineup-points">${lineup.total_points || 0} pts</div>
                </div>
                <div class="lineup-players">
                    ${lineup.lineup_players.map(lp => `
                        <div class="lineup-player">
                            <div class="lineup-player-name">${lp.players.name}</div>
                            <div class="lineup-player-position">${lp.players.position}</div>
                            <div class="lineup-player-points">${lp.points || 0} pts</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
        
        container.innerHTML = html;
        
    } catch (error) {
        console.error('Erro ao carregar escalações:', error);
        container.innerHTML = '<p class="text-center text-danger">Erro ao carregar escalações</p>';
    }
}

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
    // Já configurados nos formulários acima
}

// ============================================
// MODAL
// ============================================

function openModal(id) {
    document.getElementById(id).classList.add('active');
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}

// ============================================
// HELPERS
// ============================================

function setText(id, value) {
    const elem = document.getElementById(id);
    if (elem) elem.textContent = value;
}

function getValue(id) {
    const elem = document.getElementById(id);
    return elem ? elem.value : '';
}

// ============================================
// EXPORTAR FUNÇÕES GLOBAIS
// ============================================

// ============================================
// FUNÇÃO DE TABS
// ============================================

function openTab(tabName) {
    console.log('🔄 Abrindo tab:', tabName);
    
    // Remover active de todos os botões
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Adicionar active no botão clicado
    const clickedBtn = document.querySelector(`[data-tab="${tabName}"]`);
    if (clickedBtn) {
        clickedBtn.classList.add('active');
    }
    
    // Esconder todos os painéis
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
        content.style.display = 'none';
    });
    
    // Mostrar painel selecionado
    const selectedContent = document.getElementById(`tab-${tabName}`);
    if (selectedContent) {
        selectedContent.classList.add('active');
        selectedContent.style.display = 'block';
    }
}

// ============================================
// FUNÇÕES DE FORMULÁRIO
// ============================================

async function addTeam(event) {
    event.preventDefault();
    
    const name = getValue('team-name');
    const logoUrl = getValue('team-logo');
    
    if (!name) {
        alert('Digite o nome do time');
        return;
    }
    
    try {
        const { error } = await supabase
            .from('teams')
            .insert([{ name: name.trim(), logo_url: logoUrl.trim() || null }]);
        
        if (error) throw error;
        
        alert('Time adicionado com sucesso!');
        document.getElementById('form-add-team').reset();
        await loadTeams();
        await loadPlayers(); // Atualizar select de times nos jogadores
    } catch (error) {
        console.error('Erro ao adicionar time:', error);
        alert('Erro ao adicionar time: ' + error.message);
    }
}

async function addPlayer(event) {
    event.preventDefault();
    
    const name = getValue('player-name');
    const position = getValue('player-position');
    const price = parseFloat(getValue('player-price'));
    const teamId = getValue('player-team');
    const photoUrl = getValue('player-photo');
    
    if (!name || !position || !price || !teamId) {
        alert('Preencha todos os campos obrigatórios');
        return;
    }
    
    if (price < 1 || price > 20) {
        alert('Preço deve estar entre C$ 1.00 e C$ 20.00');
        return;
    }
    
    try {
        const { error } = await supabase
            .from('players')
            .insert([{
                name: name.trim(),
                position: position,
                price: price,
                team_id: parseInt(teamId),
                photo_url: photoUrl.trim() || null
            }]);
        
        if (error) throw error;
        
        alert('Jogador adicionado com sucesso!');
        document.getElementById('form-add-player').reset();
        await loadPlayers();
    } catch (error) {
        console.error('Erro ao adicionar jogador:', error);
        alert('Erro ao adicionar jogador: ' + error.message);
    }
}

async function addRound(event) {
    event.preventDefault();
    
    const name = getValue('round-name');
    
    if (!name) {
        alert('Digite o nome da rodada');
        return;
    }
    
    try {
        const { error } = await supabase
            .from('rounds')
            .insert([{ name: name.trim(), status: 'pending' }]);
        
        if (error) throw error;
        
        alert('Rodada criada com sucesso!');
        document.getElementById('form-add-round').reset();
        await loadRounds();
    } catch (error) {
        console.error('Erro ao criar rodada:', error);
        alert('Erro ao criar rodada: ' + error.message);
    }
}

async function saveScouts(event) {
    event.preventDefault();
    
    const roundId = getValue('scout-round');
    const playerId = getValue('scout-player');
    
    if (!roundId || !playerId) {
        alert('Selecione rodada e jogador');
        return;
    }
    
    const scouts = {
        goals: parseInt(getValue('scout-goals') || 0),
        assists: parseInt(getValue('scout-assists') || 0),
        shots_on_target: 0,  // Não tem no formulário
        saves: parseInt(getValue('scout-saves') || 0),
        clean_sheet: document.getElementById('scout-clean')?.checked ? 1 : 0,
        own_goals: parseInt(getValue('scout-own') || 0),
        yellow_cards: parseInt(getValue('scout-yellow') || 0),
        red_cards: parseInt(getValue('scout-red') || 0),
        fouls: 0  // Não tem no formulário
    };
    
    // Calcular pontos - NOVA TABELA
    const points = (scouts.goals * 5) +                    // Gol: 5 pts
                  (scouts.assists * 3) +                   // Assistência: 3 pts
                  (scouts.shots_on_target * 1) +           // Finalização: 1 pt
                  (scouts.saves * 1.5) +                   // Defesa: 1.5 pts
                  (scouts.clean_sheet * 5) -               // Sem sofrer: 5 pts
                  (scouts.own_goals * 3) -                 // Gol contra: -3 pts
                  (scouts.yellow_cards * 1) -              // Amarelo: -1 pt
                  (scouts.red_cards * 5) -                 // Vermelho: -5 pts
                  (scouts.fouls * 0.5);                    // Falta: -0.5 pts
    
    try {
        // 1. Salvar estatísticas
        const { error: statsError } = await supabase
            .from('player_stats')
            .upsert([{
                round_id: parseInt(roundId),
                player_id: parseInt(playerId),
                ...scouts,
                points: parseFloat(points.toFixed(2))
            }], {
                onConflict: 'round_id,player_id'
            });
        
        if (statsError) throw statsError;
        
        console.log(`✅ Scouts salvos: ${points.toFixed(2)} pontos`);
        
        // 2. Atualizar pontos em todas as escalações que têm esse jogador nessa rodada
        await updateLineupPoints(parseInt(roundId), parseInt(playerId), parseFloat(points.toFixed(2)));
        
        alert(`✅ Scouts salvos!\n\nJogador: ${document.getElementById('scout-player').selectedOptions[0].text}\nPontuação: ${points.toFixed(2)}\n\n✓ Escalações atualizadas\n✓ Pontos dos usuários atualizados`);
        document.getElementById('form-scouts').reset();
        
    } catch (error) {
        console.error('Erro ao salvar scouts:', error);
        alert('Erro ao salvar scouts: ' + error.message);
    }
}

// ============================================
// ATUALIZAR PONTOS NAS ESCALAÇÕES
// ============================================

async function updateLineupPoints(roundId, playerId, points) {
    try {
        console.log(`🔄 Atualizando pontos do jogador ${playerId} na rodada ${roundId}...`);
        
        // 1. Buscar todas as escalações dessa rodada que têm esse jogador
        const { data: lineupPlayers, error: lpError } = await supabase
            .from('lineup_players')
            .select('id, lineup_id, lineups(user_id)')
            .eq('player_id', playerId)
            .eq('lineups.round_id', roundId);
        
        if (lpError) throw lpError;
        
        if (!lineupPlayers || lineupPlayers.length === 0) {
            console.log('Nenhuma escalação tem esse jogador nessa rodada');
            return;
        }
        
        console.log(`📊 ${lineupPlayers.length} escalação(ões) encontrada(s)`);
        
        // 2. Atualizar pontos em lineup_players
        for (const lp of lineupPlayers) {
            const { error: updateError } = await supabase
                .from('lineup_players')
                .update({ points: points })
                .eq('id', lp.id);
            
            if (updateError) {
                console.error('Erro ao atualizar lineup_player:', updateError);
                continue;
            }
            
            console.log(`✅ Pontos atualizados em lineup_player ${lp.id}`);
            
            // 3. Recalcular total da escalação
            await recalculateLineupTotal(lp.lineup_id);
            
            // 4. Recalcular total do usuário
            if (lp.lineups?.user_id) {
                await recalculateUserTotal(lp.lineups.user_id);
            }
        }
        
        console.log('✅ Todas as escalações atualizadas!');
        
    } catch (error) {
        console.error('Erro ao atualizar pontos das escalações:', error);
        throw error;
    }
}

// ============================================
// RECALCULAR TOTAL DA ESCALAÇÃO
// ============================================

async function recalculateLineupTotal(lineupId) {
    try {
        // Buscar todos os jogadores da escalação
        const { data: players, error: playersError } = await supabase
            .from('lineup_players')
            .select('points')
            .eq('lineup_id', lineupId)
            .eq('is_starter', true);
        
        if (playersError) throw playersError;
        
        // Somar pontos
        const totalPoints = players.reduce((sum, p) => sum + (p.points || 0), 0);
        
        // Atualizar escalação
        const { error: updateError } = await supabase
            .from('lineups')
            .update({ total_points: parseFloat(totalPoints.toFixed(2)) })
            .eq('id', lineupId);
        
        if (updateError) throw updateError;
        
        console.log(`✅ Total da escalação ${lineupId}: ${totalPoints.toFixed(2)} pontos`);
        
    } catch (error) {
        console.error('Erro ao recalcular total da escalação:', error);
        throw error;
    }
}

// ============================================
// RECALCULAR TOTAL DO USUÁRIO
// ============================================

async function recalculateUserTotal(userId) {
    try {
        // Buscar todas as escalações do usuário
        const { data: lineups, error: lineupsError } = await supabase
            .from('lineups')
            .select('total_points')
            .eq('user_id', userId);
        
        if (lineupsError) throw lineupsError;
        
        // Somar todos os pontos
        const totalPoints = lineups.reduce((sum, l) => sum + (l.total_points || 0), 0);
        
        // Atualizar usuário
        const { error: updateError } = await supabase
            .from('users')
            .update({ total_points: parseFloat(totalPoints.toFixed(2)) })
            .eq('id', userId);
        
        if (updateError) throw updateError;
        
        console.log(`✅ Total do usuário ${userId}: ${totalPoints.toFixed(2)} pontos`);
        
    } catch (error) {
        console.error('Erro ao recalcular total do usuário:', error);
        throw error;
    }
}

// ============================================
// EXPORTAR FUNÇÕES
// ============================================

window.addTeam = addTeam;
window.addPlayer = addPlayer;
window.addRound = addRound;
window.saveScouts = saveScouts;
window.editPlayer = editPlayer;
window.deletePlayer = deletePlayer;
window.deleteTeam = deleteTeam;
window.startRound = startRound;
window.quickStartRound = quickStartRound;
window.finishRound = finishRound;
window.quickFinishRound = quickFinishRound;
window.deleteRound = deleteRound;
window.quickDeleteRound = quickDeleteRound;
window.loadLineups = loadLineups;
window.openModal = openModal;
window.closeModal = closeModal;
window.openTab = openTab;
window.updateLineupPoints = updateLineupPoints;
window.recalculateLineupTotal = recalculateLineupTotal;
window.recalculateUserTotal = recalculateUserTotal;
window.processPlayerValorization = processPlayerValorization;
window.calculatePriceChange = calculatePriceChange;
window.updateUserCartoletas = updateUserCartoletas;

console.log('✅ Admin.js carregado');
