// ============================================
// LNF FANTASY - MERCADO ESTILO CARTOLA FC
// ============================================

console.log('🚀 Mercado LNF iniciando...');

let currentUser = null;
let allPlayers = [];
let filteredPlayers = [];
let lineup = {
    GOL: null,
    FIX: null,
    ALA: [null, null],
    PIV: null
};
let budget = 50.00;

// ============================================
// INICIALIZAÇÃO
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('📱 DOM carregado');
    
    try {
        // Verificar autenticação
        currentUser = await auth.requireAuth();
        if (!currentUser) {
            console.error('❌ Não autenticado');
            window.location.href = 'index.html';
            return;
        }
        
        console.log('✅ Usuário:', currentUser.email);
        
        // Carregar dados
        await loadBudget();
        await loadPlayers();
        await loadCurrentLineup();
        await populateTeamFilter();
        
        // Atualizar UI
        updateAllUI();
        
        console.log('✅ Mercado carregado!');
        
    } catch (error) {
        console.error('❌ Erro fatal:', error);
        alert('Erro ao carregar mercado: ' + error.message);
    }
});

// ============================================
// CARREGAR SALDO
// ============================================

async function loadBudget() {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('cartoletas')
            .eq('id', currentUser.id)
            .single();
        
        if (error) throw error;
        
        budget = data?.cartoletas || 50.00;
        console.log('💰 Saldo carregado:', budget);
        
    } catch (error) {
        console.error('Erro ao carregar saldo:', error);
        budget = 50.00;
    }
}

// ============================================
// CARREGAR JOGADORES
// ============================================

async function loadPlayers() {
    try {
        console.log('📥 Carregando jogadores...');
        
        const { data, error } = await supabase
            .from('players')
            .select(`
                id,
                name,
                position,
                price,
                photo_url,
                team_id,
                teams (
                    id,
                    name,
                    logo_url
                )
            `)
            .order('name');
        
        if (error) throw error;
        
        allPlayers = data || [];
        filteredPlayers = [...allPlayers];
        
        console.log(`✅ ${allPlayers.length} jogadores carregados`);
        
        renderPlayers();
        
    } catch (error) {
        console.error('❌ Erro ao carregar jogadores:', error);
        showEmptyState('Erro ao carregar jogadores');
    }
}

// ============================================
// CARREGAR ESCALAÇÃO ATUAL
// ============================================

async function loadCurrentLineup() {
    try {
        // Buscar rodada pendente
        const { data: rounds } = await supabase
            .from('rounds')
            .select('id')
            .eq('status', 'pending')
            .limit(1)
            .single();
        
        if (!rounds) {
            console.log('Nenhuma rodada pendente');
            return;
        }
        
        // Buscar escalação do usuário
        const { data: lineups } = await supabase
            .from('lineups')
            .select('id')
            .eq('user_id', currentUser.id)
            .eq('round_id', rounds.id)
            .single();
        
        if (!lineups) {
            console.log('Nenhuma escalação salva');
            return;
        }
        
        // Buscar jogadores escalados
        const { data: players } = await supabase
            .from('lineup_players')
            .select(`
                player_id,
                players (
                    id,
                    name,
                    position,
                    price,
                    photo_url,
                    teams (name, logo_url)
                )
            `)
            .eq('lineup_id', lineups.id)
            .eq('is_starter', true);
        
        if (!players || players.length === 0) {
            console.log('Nenhum jogador escalado');
            return;
        }
        
        // Preencher lineup
        players.forEach(lp => {
            const player = lp.players;
            
            if (player.position === 'GOL') {
                lineup.GOL = player;
            } else if (player.position === 'FIX') {
                lineup.FIX = player;
            } else if (player.position === 'PIV') {
                lineup.PIV = player;
            } else if (player.position === 'ALA') {
                const idx = lineup.ALA.findIndex(a => a === null);
                if (idx !== -1) lineup.ALA[idx] = player;
            }
        });
        
        console.log('✅ Escalação carregada');
        
    } catch (error) {
        console.error('Erro ao carregar escalação:', error);
    }
}

// ============================================
// RENDERIZAR JOGADORES
// ============================================

function renderPlayers() {
    const container = document.getElementById('players-list');
    
    if (!container) {
        console.error('❌ Container não encontrado');
        return;
    }
    
    if (filteredPlayers.length === 0) {
        showEmptyState('Nenhum jogador encontrado');
        return;
    }
    
    const cost = calculateCost();
    const remaining = budget - cost;
    
    const html = filteredPlayers.map(player => {
        const isSelected = isPlayerSelected(player.id);
        const canAfford = !isSelected && (cost + player.price <= budget);
        const photoUrl = player.photo_url || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="300"%3E%3Crect width="200" height="300" fill="%23e0e0e0"/%3E%3Ctext x="50%25" y="50%25" font-size="60" text-anchor="middle" dy=".3em"%3E👤%3C/text%3E%3C/svg%3E';
        
        return `
            <div class="player-card ${isSelected ? 'selected' : ''} ${!canAfford && !isSelected ? 'no-money' : ''}">
                <img src="${photoUrl}" 
                     alt="${player.name}" 
                     class="player-photo"
                     onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'200\\' height=\\'300\\'%3E%3Crect width=\\'200\\' height=\\'300\\' fill=\\'%23e0e0e0\\'/%3E%3Ctext x=\\'50%25\\' y=\\'50%25\\' font-size=\\'60\\' text-anchor=\\'middle\\' dy=\\'.3em\\'%3E👤%3C/text%3E%3C/svg%3E'">
                
                <div class="player-info">
                    <div class="player-name">${player.name}</div>
                    <div class="player-team">${player.teams?.name || 'Sem time'}</div>
                    
                    <div class="player-meta">
                        <span class="player-position position-${player.position}">${player.position}</span>
                        <span class="player-price">C$ ${player.price.toFixed(2)}</span>
                    </div>
                    
                    <button class="add-btn" 
                            ${isSelected || !canAfford ? 'disabled' : ''}
                            onclick="${canAfford && !isSelected ? `selectPlayer(${player.id})` : ''}">
                        ${isSelected ? '✓ Escalado' : !canAfford ? 'Sem saldo' : 'Escalar'}
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
}

// ============================================
// RENDERIZAR CAMPO
// ============================================

function renderField() {
    renderSlot('slot-gol', lineup.GOL);
    renderSlot('slot-fix', lineup.FIX);
    renderSlot('slot-ala1', lineup.ALA[0], 0);
    renderSlot('slot-ala2', lineup.ALA[1], 1);
    renderSlot('slot-piv', lineup.PIV);
}

function renderSlot(slotId, player, alaIndex = null) {
    const slot = document.getElementById(slotId);
    if (!slot) return;
    
    if (player) {
        const photoUrl = player.photo_url || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="300"%3E%3Crect width="200" height="300" fill="%23e0e0e0"/%3E%3Ctext x="50%25" y="50%25" font-size="60" text-anchor="middle" dy=".3em"%3E👤%3C/text%3E%3C/svg%3E';
        
        const removeCmd = alaIndex !== null 
            ? `removePlayer('ALA', ${alaIndex})` 
            : `removePlayer('${player.position}')`;
        
        slot.className = 'player-slot filled';
        slot.innerHTML = `
            <img src="${photoUrl}" 
                 alt="${player.name}"
                 onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'200\\' height=\\'300\\'%3E%3Crect width=\\'200\\' height=\\'300\\' fill=\\'%23e0e0e0\\'/%3E%3Ctext x=\\'50%25\\' y=\\'50%25\\' font-size=\\'60\\' text-anchor=\\'middle\\' dy=\\'.3em\\'%3E👤%3C/text%3E%3C/svg%3E'">
            <div class="player-slot-name">${player.name}</div>
            <div class="player-slot-price">C$ ${player.price.toFixed(2)}</div>
            <button class="remove-btn" onclick="${removeCmd}">✕</button>
        `;
    } else {
        slot.className = 'player-slot';
        slot.innerHTML = `<span>${slotId.includes('gol') ? 'GOL' : slotId.includes('fix') ? 'FIX' : slotId.includes('piv') ? 'PIV' : 'ALA'}</span>`;
    }
}

// ============================================
// SELECIONAR JOGADOR
// ============================================

function selectPlayer(playerId) {
    console.log('➕ Selecionando jogador:', playerId);
    
    const player = allPlayers.find(p => p.id === playerId);
    if (!player) {
        console.error('Jogador não encontrado');
        return;
    }
    
    // Verificar saldo
    const cost = calculateCost();
    if (cost + player.price > budget) {
        alert('💰 Saldo insuficiente!');
        return;
    }
    
    // Adicionar na posição
    const pos = player.position;
    
    if (pos === 'GOL') {
        if (lineup.GOL) {
            alert('⚠️ Já há um goleiro escalado');
            return;
        }
        lineup.GOL = player;
    } else if (pos === 'FIX') {
        if (lineup.FIX) {
            alert('⚠️ Já há um fixo escalado');
            return;
        }
        lineup.FIX = player;
    } else if (pos === 'PIV') {
        if (lineup.PIV) {
            alert('⚠️ Já há um pivô escalado');
            return;
        }
        lineup.PIV = player;
    } else if (pos === 'ALA') {
        const idx = lineup.ALA.findIndex(a => a === null);
        if (idx === -1) {
            alert('⚠️ Já há 2 alas escalados');
            return;
        }
        lineup.ALA[idx] = player;
    }
    
    console.log('✅ Jogador escalado:', player.name);
    updateAllUI();
}

// ============================================
// REMOVER JOGADOR
// ============================================

function removePlayer(position, alaIndex = null) {
    console.log('➖ Removendo:', position, alaIndex);
    
    if (position === 'ALA' && alaIndex !== null) {
        lineup.ALA[alaIndex] = null;
    } else {
        lineup[position] = null;
    }
    
    updateAllUI();
}

// ============================================
// CALCULAR CUSTO
// ============================================

function calculateCost() {
    let total = 0;
    
    if (lineup.GOL) total += lineup.GOL.price;
    if (lineup.FIX) total += lineup.FIX.price;
    if (lineup.PIV) total += lineup.PIV.price;
    lineup.ALA.forEach(a => {
        if (a) total += a.price;
    });
    
    return parseFloat(total.toFixed(2));
}

// ============================================
// CONTAR JOGADORES
// ============================================

function countPlayers() {
    let count = 0;
    
    if (lineup.GOL) count++;
    if (lineup.FIX) count++;
    if (lineup.PIV) count++;
    count += lineup.ALA.filter(a => a !== null).length;
    
    return count;
}

// ============================================
// VERIFICAR SE JOGADOR ESTÁ ESCALADO
// ============================================

function isPlayerSelected(playerId) {
    if (lineup.GOL?.id === playerId) return true;
    if (lineup.FIX?.id === playerId) return true;
    if (lineup.PIV?.id === playerId) return true;
    if (lineup.ALA.some(a => a?.id === playerId)) return true;
    return false;
}

// ============================================
// ATUALIZAR TODA A UI
// ============================================

function updateAllUI() {
    const cost = calculateCost();
    const remaining = budget - cost;
    const count = countPlayers();
    
    // Atualizar saldo
    setText('budget-total', budget.toFixed(2));
    setText('budget-available', budget.toFixed(2));
    setText('budget-spent', cost.toFixed(2));
    setText('budget-remaining', remaining.toFixed(2));
    
    // Atualizar contador
    setText('lineup-count', count);
    
    // Renderizar campo
    renderField();
    
    // Re-renderizar jogadores (para atualizar disponibilidade)
    renderPlayers();
    
    console.log(`💰 Saldo: ${budget} | Gasto: ${cost} | Restante: ${remaining} | Jogadores: ${count}/5`);
}

// ============================================
// FILTRAR JOGADORES
// ============================================

function filterPlayers() {
    const position = document.getElementById('filter-position')?.value || '';
    const team = document.getElementById('filter-team')?.value || '';
    const search = document.getElementById('filter-search')?.value.toLowerCase() || '';
    
    filteredPlayers = allPlayers.filter(p => {
        const matchPos = !position || p.position === position;
        const matchTeam = !team || p.teams?.name === team;
        const matchSearch = !search || p.name.toLowerCase().includes(search);
        
        return matchPos && matchTeam && matchSearch;
    });
    
    console.log(`🔍 Filtrados: ${filteredPlayers.length} de ${allPlayers.length}`);
    renderPlayers();
}

// ============================================
// POPULAR FILTRO DE TIMES
// ============================================

async function populateTeamFilter() {
    const select = document.getElementById('filter-team');
    if (!select) return;
    
    const teams = [...new Set(allPlayers.map(p => p.teams?.name).filter(Boolean))];
    teams.sort();
    
    select.innerHTML = '<option value="">Todos os times</option>' + 
        teams.map(t => `<option value="${t}">${t}</option>`).join('');
}

// ============================================
// SALVAR ESCALAÇÃO
// ============================================

async function saveLineup() {
    console.log('💾 Salvando escalação...');
    
    const count = countPlayers();
    
    if (count !== 5) {
        alert('⚠️ Você precisa escalar exatamente 5 jogadores!\n\n1 GOL + 1 FIX + 2 ALA + 1 PIV');
        return;
    }
    
    // Validar formação
    if (!lineup.GOL || !lineup.FIX || !lineup.PIV || lineup.ALA.filter(a => a).length !== 2) {
        alert('⚠️ Formação incompleta!\n\n1 GOL + 1 FIX + 2 ALA + 1 PIV');
        return;
    }
    
    try {
        // Buscar rodada pendente
        const { data: round, error: roundError } = await supabase
            .from('rounds')
            .select('id')
            .eq('status', 'pending')
            .single();
        
        if (roundError || !round) {
            alert('⚠️ Nenhuma rodada disponível para escalação');
            return;
        }
        
        // Verificar se já tem escalação
        const { data: existingLineup } = await supabase
            .from('lineups')
            .select('id')
            .eq('user_id', currentUser.id)
            .eq('round_id', round.id)
            .single();
        
        let lineupId;
        
        if (existingLineup) {
            // Deletar jogadores antigos
            await supabase
                .from('lineup_players')
                .delete()
                .eq('lineup_id', existingLineup.id);
            
            lineupId = existingLineup.id;
        } else {
            // Criar nova escalação
            const { data: newLineup, error: lineupError } = await supabase
                .from('lineups')
                .insert({
                    user_id: currentUser.id,
                    round_id: round.id,
                    total_points: 0
                })
                .select('id')
                .single();
            
            if (lineupError) throw lineupError;
            lineupId = newLineup.id;
        }
        
        // Inserir jogadores
        const players = [];
        
        if (lineup.GOL) players.push({
            lineup_id: lineupId,
            player_id: lineup.GOL.id,
            is_starter: true,
            points: 0
        });
        
        if (lineup.FIX) players.push({
            lineup_id: lineupId,
            player_id: lineup.FIX.id,
            is_starter: true,
            points: 0
        });
        
        if (lineup.PIV) players.push({
            lineup_id: lineupId,
            player_id: lineup.PIV.id,
            is_starter: true,
            points: 0
        });
        
        lineup.ALA.forEach(ala => {
            if (ala) players.push({
                lineup_id: lineupId,
                player_id: ala.id,
                is_starter: true,
                points: 0
            });
        });
        
        const { error: playersError } = await supabase
            .from('lineup_players')
            .insert(players);
        
        if (playersError) throw playersError;
        
        // Atualizar saldo do usuário
        const cost = calculateCost();
        const newBudget = budget - cost;
        
        const { error: budgetError } = await supabase
            .from('users')
            .update({ cartoletas: newBudget })
            .eq('id', currentUser.id);
        
        if (budgetError) throw budgetError;
        
        alert('✅ Escalação salva com sucesso!');
        window.location.href = 'dashboard.html';
        
    } catch (error) {
        console.error('❌ Erro ao salvar:', error);
        alert('Erro ao salvar escalação: ' + error.message);
    }
}

// ============================================
// LIMPAR ESCALAÇÃO
// ============================================

function clearLineup() {
    if (!confirm('Limpar toda a escalação?')) return;
    
    lineup = {
        GOL: null,
        FIX: null,
        ALA: [null, null],
        PIV: null
    };
    
    updateAllUI();
    console.log('🗑️ Escalação limpa');
}

// ============================================
// HELPERS
// ============================================

function setText(id, value) {
    const elem = document.getElementById(id);
    if (elem) elem.textContent = value;
}

function showEmptyState(message) {
    const container = document.getElementById('players-list');
    if (!container) return;
    
    container.innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon">⚽</div>
            <div>${message}</div>
        </div>
    `;
}

// ============================================
// EXPORTAR FUNÇÕES GLOBAIS
// ============================================

window.selectPlayer = selectPlayer;
window.removePlayer = removePlayer;
window.filterPlayers = filterPlayers;
window.saveLineup = saveLineup;
window.clearLineup = clearLineup;

console.log('✅ Mercado LNF carregado');
