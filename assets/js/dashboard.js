// ============================================
// LNF FANTASY - DASHBOARD
// ============================================

let currentUser = null;

// ============================================
// INICIALIZAÇÃO
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🏠 Dashboard carregando...');
    
    // Aguardar um pouco para garantir que tudo carregou
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Verificar autenticação
    currentUser = await auth.requireAuth();
    if (!currentUser) return;
    
    // Mostrar nome do usuário
    document.getElementById('user-display').textContent = currentUser.team_name;
    document.getElementById('team-name').textContent = currentUser.team_name;
    
    // IMPORTANTE: Verificar e mostrar link admin
    console.log('🔍 Verificando permissões de admin...');
    await auth.checkAndShowAdminLink();
    
    // Carregar dados
    await Promise.all([
        loadUserStats(),
        loadLineup(),
        loadRanking()
    ]);
    
    console.log('✅ Dashboard carregado');
});

// ============================================
// CARREGAR ESTATÍSTICAS DO USUÁRIO
// ============================================

async function loadUserStats() {
    try {
        const { data: userData } = await supabase
            .from('users')
            .select('total_points, cartoletas')
            .eq('id', currentUser.id)
            .single();
        
        if (userData) {
            document.getElementById('stat-points').textContent = userData.total_points || 0;
            
            // Cartoletas = patrimônio (sempre positivo)
            const cartoletas = Math.abs(userData.cartoletas || 0);
            document.getElementById('stat-balance').textContent = `C$ ${cartoletas.toFixed(2)}`;
        }
        
        // Buscar posição no ranking
        const { data: ranking } = await supabase
            .from('users')
            .select('id, total_points')
            .order('total_points', { ascending: false });
        
        const position = ranking.findIndex(u => u.id === currentUser.id) + 1;
        document.getElementById('stat-position').textContent = position > 0 ? `${position}º` : '-';
        
    } catch (error) {
        console.error('Erro ao carregar stats:', error);
    }
}

// ============================================
// CARREGAR ESCALAÇÃO
// ============================================

let currentRound = null; // Armazenar rodada atual

async function loadLineup() {
    try {
        const fieldContainer = document.getElementById('field-players');
        
        // Buscar rodada ativa ou pendente
        const { data: rounds } = await supabase
            .from('rounds')
            .select('id, name, status')
            .in('status', ['active', 'pending'])
            .order('id', { ascending: false })
            .limit(1);
        
        if (!rounds || rounds.length === 0) {
            document.getElementById('round-status').textContent = 'Nenhuma rodada disponível';
            fieldContainer.innerHTML = '<div class="field-loading"><p>Nenhuma rodada ativa</p></div>';
            return;
        }
        
        const round = rounds[0];
        currentRound = round; // Salvar rodada atual
        const statusEmoji = round.status === 'active' ? '🔴' : '⏳';
        const statusText = round.status === 'active' ? 'Em andamento' : 'Mercado aberto';
        document.getElementById('round-status').textContent = `${statusEmoji} ${round.name} - ${statusText}`;
        
        // Buscar escalação
        const { data: lineups } = await supabase
            .from('lineups')
            .select('id, total_points')
            .eq('user_id', currentUser.id)
            .eq('round_id', round.id);
        
        if (!lineups || lineups.length === 0) {
            fieldContainer.innerHTML = `
                <div class="field-loading">
                    <p style="margin-bottom:16px">Você ainda não escalou um time</p>
                    <a href="mercado.html" class="btn btn-primary">Escalar Agora</a>
                </div>
            `;
            return;
        }
        
        const lineup = lineups[0];
        
        // Buscar jogadores
        const { data: players } = await supabase
            .from('lineup_players')
            .select(`
                points,
                players (
                    id, name, position, price, photo_url,
                    teams (name)
                )
            `)
            .eq('lineup_id', lineup.id)
            .eq('is_starter', true);
        
        if (!players || players.length === 0) {
            fieldContainer.innerHTML = '<div class="field-loading"><p>Escalação vazia</p></div>';
            return;
        }
        
        // Renderizar jogadores
        renderPlayers(players, round.id);
        
        // Atualizar resumo
        const totalPoints = players.reduce((sum, p) => sum + (p.points || 0), 0);
        const totalPrice = players.reduce((sum, p) => sum + (p.players.price || 0), 0);
        
        document.getElementById('summary-points').textContent = totalPoints.toFixed(2);
        document.getElementById('summary-patrimony').textContent = `C$ ${totalPrice.toFixed(2)}`;
        
    } catch (error) {
        console.error('Erro ao carregar escalação:', error);
        document.getElementById('field-players').innerHTML = '<div class="field-loading"><p>Erro ao carregar escalação</p></div>';
    }
}

// ============================================
// RENDERIZAR JOGADORES
// ============================================

function renderPlayers(players, roundId) {
    const fieldContainer = document.getElementById('field-players');
    const placeholder = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' font-size='40' text-anchor='middle' dy='.3em'%3E👤%3C/text%3E%3C/svg%3E";
    
    fieldContainer.innerHTML = players.map(lp => {
        const player = lp.players;
        const points = lp.points || 0;
        
        return `
            <div class="player-card" onclick="showPlayerStats(${player.id}, ${roundId})" style="cursor: pointer;">
                <img src="${player.photo_url || placeholder}" 
                     class="player-photo" 
                     alt="${player.name}"
                     onerror="this.src='${placeholder}'">
                <div class="player-position">${player.position}</div>
                <div class="player-name">${player.name}</div>
                <div class="player-team">${player.teams?.name || 'Sem time'}</div>
                <div class="player-points-box">
                    <div class="player-points-label">Pontos</div>
                    <div class="player-points-value">${points.toFixed(2)}</div>
                </div>
                <div class="player-click-hint">👆 Clique para ver estatísticas</div>
            </div>
        `;
    }).join('');
}

// ============================================
// MODAL DE ESTATÍSTICAS DO JOGADOR
// ============================================

async function showPlayerStats(playerId, roundId) {
    try {
        console.log('📊 Carregando estatísticas do jogador', playerId, 'na rodada', roundId);
        
        // Buscar dados do jogador
        const { data: player, error: playerError } = await supabase
            .from('players')
            .select('id, name, position, price, photo_url, teams(name, logo_url)')
            .eq('id', playerId)
            .single();
        
        if (playerError) throw playerError;
        
        // Buscar estatísticas da rodada
        const { data: stats, error: statsError } = await supabase
            .from('player_stats')
            .select('*')
            .eq('player_id', playerId)
            .eq('round_id', roundId)
            .single();
        
        if (statsError && statsError.code !== 'PGRST116') { // PGRST116 = not found
            throw statsError;
        }
        
        // Renderizar modal
        renderStatsModal(player, stats, roundId);
        
    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
        alert('Erro ao carregar estatísticas do jogador');
    }
}

function renderStatsModal(player, stats, roundId) {
    const placeholder = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23e5e7eb'/%3E%3Ctext x='50%25' y='50%25' font-size='40' text-anchor='middle' dy='.3em'%3E👤%3C/text%3E%3C/svg%3E";
    
    const positionColors = {
        'GOL': '#ffc107',
        'FIX': '#2196F3',
        'ALA': '#4CAF50',
        'PIV': '#f44336'
    };
    
    const positionColor = positionColors[player.position] || '#6b7280';
    
    // Se não tem stats, mostrar que ainda não jogou
    if (!stats) {
        document.getElementById('stats-modal').innerHTML = `
            <div class="modal-overlay" onclick="closeStatsModal()">
                <div class="modal-content" onclick="event.stopPropagation()">
                    <div class="modal-header" style="background: linear-gradient(135deg, ${positionColor} 0%, ${positionColor}dd 100%);">
                        <img src="${player.photo_url || placeholder}" class="modal-player-photo" onerror="this.src='${placeholder}'">
                        <div class="modal-player-info">
                            <h2>${player.name}</h2>
                            <div class="modal-player-meta">
                                <span class="modal-position" style="background: ${positionColor};">${player.position}</span>
                                <span class="modal-team">${player.teams?.name || 'Sem time'}</span>
                                <span class="modal-price">C$ ${player.price.toFixed(2)}</span>
                            </div>
                        </div>
                        <button class="modal-close" onclick="closeStatsModal()">✕</button>
                    </div>
                    <div class="modal-body">
                        <div class="no-stats">
                            <div class="no-stats-icon">📊</div>
                            <p>Ainda não há estatísticas para este jogador nesta rodada</p>
                            <small>As estatísticas serão exibidas após o jogo ser finalizado</small>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.getElementById('stats-modal').style.display = 'block';
        document.body.style.overflow = 'hidden';
        return;
    }
    
    // Calcular breakdown dos pontos - NOVA TABELA
    const breakdown = [
        { label: 'Gols', emoji: '⚽', value: stats.goals || 0, points: (stats.goals || 0) * 5, multiplier: 5 },
        { label: 'Assistências', emoji: '🎯', value: stats.assists || 0, points: (stats.assists || 0) * 3, multiplier: 3 },
        { label: 'Finalizações no gol', emoji: '🎪', value: stats.shots_on_target || 0, points: (stats.shots_on_target || 0) * 1, multiplier: 1 },
        { label: 'Defesas', emoji: '🧤', value: stats.saves || 0, points: (stats.saves || 0) * 1.5, multiplier: 1.5 },
        { label: 'Jogo sem sofrer gol', emoji: '🛡️', value: stats.clean_sheet || 0, points: (stats.clean_sheet || 0) * 5, multiplier: 5 },
        { label: 'Gols contra', emoji: '😞', value: stats.own_goals || 0, points: (stats.own_goals || 0) * -3, multiplier: -3, negative: true },
        { label: 'Cartões amarelos', emoji: '🟨', value: stats.yellow_cards || 0, points: (stats.yellow_cards || 0) * -1, multiplier: -1, negative: true },
        { label: 'Cartões vermelhos', emoji: '🟥', value: stats.red_cards || 0, points: (stats.red_cards || 0) * -5, multiplier: -5, negative: true },
        { label: 'Faltas cometidas', emoji: '⚠️', value: stats.fouls || 0, points: (stats.fouls || 0) * -0.5, multiplier: -0.5, negative: true }
    ];
    
    const positiveBreakdown = breakdown.filter(b => !b.negative && b.value > 0);
    const negativeBreakdown = breakdown.filter(b => b.negative && b.value > 0);
    const totalPoints = stats.points || 0;
    
    document.getElementById('stats-modal').innerHTML = `
        <div class="modal-overlay" onclick="closeStatsModal()">
            <div class="modal-content" onclick="event.stopPropagation()">
                <!-- Header -->
                <div class="modal-header" style="background: linear-gradient(135deg, ${positionColor} 0%, ${positionColor}dd 100%);">
                    <img src="${player.photo_url || placeholder}" class="modal-player-photo" onerror="this.src='${placeholder}'">
                    <div class="modal-player-info">
                        <h2>${player.name}</h2>
                        <div class="modal-player-meta">
                            <span class="modal-position" style="background: ${positionColor};">${player.position}</span>
                            <span class="modal-team">${player.teams?.name || 'Sem time'}</span>
                            <span class="modal-price">C$ ${player.price.toFixed(2)}</span>
                        </div>
                    </div>
                    <button class="modal-close" onclick="closeStatsModal()">✕</button>
                </div>
                
                <!-- Body -->
                <div class="modal-body">
                    <!-- Pontuação Total -->
                    <div class="total-points-card">
                        <div class="total-points-label">PONTUAÇÃO TOTAL</div>
                        <div class="total-points-value ${totalPoints >= 0 ? 'positive' : 'negative'}">${totalPoints.toFixed(2)}</div>
                        <div class="total-points-subtitle">${currentRound?.name || 'Rodada'}</div>
                    </div>
                    
                    <!-- Ações Positivas -->
                    ${positiveBreakdown.length > 0 ? `
                        <div class="stats-section">
                            <h3 class="stats-section-title positive">✅ Ações Positivas</h3>
                            <div class="stats-list">
                                ${positiveBreakdown.map(b => `
                                    <div class="stat-item positive">
                                        <div class="stat-info">
                                            <span class="stat-emoji">${b.emoji}</span>
                                            <span class="stat-label">${b.label}</span>
                                            <span class="stat-detail">${b.value} × ${b.multiplier > 0 ? '+' : ''}${b.multiplier}</span>
                                        </div>
                                        <div class="stat-points positive">+${b.points.toFixed(2)}</div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : `
                        <div class="stats-section">
                            <h3 class="stats-section-title">✅ Ações Positivas</h3>
                            <div class="no-stats-small">Nenhuma ação positiva registrada</div>
                        </div>
                    `}
                    
                    <!-- Ações Negativas -->
                    ${negativeBreakdown.length > 0 ? `
                        <div class="stats-section">
                            <h3 class="stats-section-title negative">❌ Ações Negativas</h3>
                            <div class="stats-list">
                                ${negativeBreakdown.map(b => `
                                    <div class="stat-item negative">
                                        <div class="stat-info">
                                            <span class="stat-emoji">${b.emoji}</span>
                                            <span class="stat-label">${b.label}</span>
                                            <span class="stat-detail">${b.value} × ${b.multiplier}</span>
                                        </div>
                                        <div class="stat-points negative">${b.points.toFixed(2)}</div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : `
                        <div class="stats-section">
                            <h3 class="stats-section-title">❌ Ações Negativas</h3>
                            <div class="no-stats-small">✓ Nenhuma ação negativa! Jogo limpo!</div>
                        </div>
                    `}
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('stats-modal').style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeStatsModal() {
    document.getElementById('stats-modal').style.display = 'none';
    document.body.style.overflow = '';
}

// Exportar funções
window.showPlayerStats = showPlayerStats;
window.closeStatsModal = closeStatsModal;

// ============================================
// CARREGAR RANKING
// ============================================

async function loadRanking() {
    try {
        const { data: users } = await supabase
            .from('users')
            .select('id, team_name, total_points, cartoletas')
            .order('total_points', { ascending: false })
            .limit(20);
        
        if (!users || users.length === 0) {
            document.getElementById('ranking-body').innerHTML = '<tr><td colspan="4" class="text-center" style="padding:40px">Nenhum time cadastrado</td></tr>';
            return;
        }
        
        const tbody = document.getElementById('ranking-body');
        tbody.innerHTML = users.map((user, index) => {
            const position = index + 1;
            const isMe = user.id === currentUser.id;
            
            let posDisplay = position;
            if (position === 1) posDisplay = '🥇';
            else if (position === 2) posDisplay = '🥈';
            else if (position === 3) posDisplay = '🥉';
            
            return `
                <tr class="${isMe ? 'my-row' : ''}">
                    <td class="text-center ranking-position ${position <= 3 ? 'medal' : ''}">${posDisplay}</td>
                    <td class="ranking-team">${user.team_name}${isMe ? ' <span class="badge badge-primary">VOCÊ</span>' : ''}</td>
                    <td class="text-center ranking-points">${user.total_points || 0}</td>
                    <td class="text-right ranking-money">C$ ${Math.abs(user.cartoletas || 0).toFixed(2)}</td>
                </tr>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Erro ao carregar ranking:', error);
    }
}

// ============================================
// LOGOUT
// ============================================

async function handleLogout() {
    const result = await auth.logout();
    if (result.success) {
        window.location.href = 'index.html';
    }
}

console.log('✅ Dashboard.js carregado - LNF Fantasy');