// ============================================
// LNF FANTASY - MINHAS RODADAS
// ============================================

let currentUser = null;
let allRounds = [];

// ============================================
// INICIALIZAÇÃO
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('📊 Minhas Rodadas carregando...');
    
    // Verificar autenticação
    currentUser = await auth.requireAuth();
    if (!currentUser) {
        console.error('❌ Não autenticado');
        window.location.href = 'index.html';
        return;
    }
    
    console.log('✅ Usuário:', currentUser.email);
    
    // Carregar dados
    await loadUserRounds();
    
    console.log('✅ Minhas Rodadas carregado!');
});

// ============================================
// CARREGAR RODADAS DO USUÁRIO
// ============================================

async function loadUserRounds() {
    try {
        const container = document.getElementById('lista-rodadas');
        
        // Buscar TODAS as rodadas
        const { data: rounds, error: roundsError } = await supabase
            .from('rounds')
            .select('id, name, status')
            .order('id', { ascending: false });
        
        if (roundsError) throw roundsError;
        
        if (!rounds || rounds.length === 0) {
            showEmptyState('Nenhuma rodada cadastrada ainda');
            updateStats([], []);
            return;
        }
        
        console.log(`📋 ${rounds.length} rodadas encontradas`);
        
        // Buscar escalações do usuário
        const { data: lineups, error: lineupsError } = await supabase
            .from('lineups')
            .select(`
                id,
                round_id,
                total_points,
                rounds (id, name, status)
            `)
            .eq('user_id', currentUser.id)
            .order('round_id', { ascending: false });
        
        if (lineupsError) throw lineupsError;
        
        allRounds = lineups || [];
        
        console.log(`✅ ${allRounds.length} escalações do usuário`);
        
        // Atualizar estatísticas
        updateStats(allRounds, rounds);
        
        // Renderizar lista
        if (allRounds.length === 0) {
            showEmptyState('Você ainda não participou de nenhuma rodada');
        } else {
            renderRoundsList(allRounds);
        }
        
    } catch (error) {
        console.error('❌ Erro ao carregar rodadas:', error);
        showEmptyState('Erro ao carregar rodadas');
    }
}

// ============================================
// ATUALIZAR ESTATÍSTICAS
// ============================================

function updateStats(lineups, allRounds) {
    // Total de rodadas participadas
    const totalRodadas = lineups.length;
    document.getElementById('total-rodadas').textContent = totalRodadas;
    
    if (totalRodadas === 0) {
        document.getElementById('total-pontos').textContent = '0';
        document.getElementById('media-pontos').textContent = '0';
        document.getElementById('melhor-rodada').textContent = '0';
        return;
    }
    
    // Pontos totais
    const totalPontos = lineups.reduce((sum, l) => sum + (l.total_points || 0), 0);
    document.getElementById('total-pontos').textContent = totalPontos.toFixed(1);
    
    // Média por rodada
    const media = totalPontos / totalRodadas;
    document.getElementById('media-pontos').textContent = media.toFixed(1);
    
    // Melhor rodada
    const melhorRodada = Math.max(...lineups.map(l => l.total_points || 0));
    document.getElementById('melhor-rodada').textContent = melhorRodada.toFixed(1);
}

// ============================================
// RENDERIZAR LISTA DE RODADAS
// ============================================

function renderRoundsList(lineups) {
    const container = document.getElementById('lista-rodadas');
    
    const html = lineups.map(lineup => {
        const round = lineup.rounds;
        const points = lineup.total_points || 0;
        
        // Status badge
        let statusBadge = '';
        let statusClass = '';
        
        if (round.status === 'finished') {
            statusBadge = '✅ Finalizada';
            statusClass = 'badge-success';
        } else if (round.status === 'active') {
            statusBadge = '🔴 Em andamento';
            statusClass = 'badge-warning';
        } else {
            statusBadge = '⏳ Pendente';
            statusClass = 'badge-secondary';
        }
        
        return `
            <div class="round-card" onclick="showRoundDetails(${lineup.id}, '${round.name}')">
                <div class="round-header">
                    <div class="round-info">
                        <h3 class="round-name">${round.name}</h3>
                        <span class="badge ${statusClass}">${statusBadge}</span>
                    </div>
                    <div class="round-points">
                        <div class="points-value">${points.toFixed(1)}</div>
                        <div class="points-label">pontos</div>
                    </div>
                </div>
                <div class="round-footer">
                    <span class="round-action">👆 Clique para ver detalhes</span>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
}

// ============================================
// MOSTRAR DETALHES DA RODADA
// ============================================

async function showRoundDetails(lineupId, roundName) {
    try {
        console.log('📊 Carregando detalhes da rodada:', lineupId);
        
        // Mostrar loading no modal
        document.getElementById('modal-titulo').textContent = roundName;
        document.getElementById('modal-subtitulo').textContent = 'Carregando...';
        document.getElementById('modal-conteudo').innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <div class="spinner"></div>
                <p style="margin-top: 16px; color: #6b7280;">Carregando escalação...</p>
            </div>
        `;
        
        // Abrir modal
        document.getElementById('modal-detalhes').classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Buscar dados da escalação
        const { data: lineup, error: lineupError } = await supabase
            .from('lineups')
            .select('id, total_points, round_id')
            .eq('id', lineupId)
            .single();
        
        if (lineupError) throw lineupError;
        
        // Buscar jogadores da escalação
        const { data: lineupPlayers, error: playersError } = await supabase
            .from('lineup_players')
            .select(`
                points,
                players (
                    id,
                    name,
                    position,
                    price,
                    photo_url,
                    teams (name)
                )
            `)
            .eq('lineup_id', lineupId)
            .eq('is_starter', true);
        
        if (playersError) throw playersError;
        
        // Buscar estatísticas de cada jogador (com tratamento de erro)
        const playersWithStats = await Promise.all(
            lineupPlayers.map(async (lp) => {
                try {
                    const { data: stats, error } = await supabase
                        .from('player_stats')
                        .select('*')
                        .eq('player_id', lp.players.id)
                        .eq('round_id', lineup.round_id)
                        .maybeSingle(); // Use maybeSingle() em vez de single()
                    
                    // Se houver erro de RLS (406), apenas ignore
                    if (error && error.code !== 'PGRST116') {
                        console.warn(`Aviso ao buscar stats do jogador ${lp.players.id}:`, error.message);
                    }
                    
                    return {
                        ...lp,
                        stats: stats || null
                    };
                } catch (err) {
                    console.warn(`Erro ao buscar stats:`, err);
                    return {
                        ...lp,
                        stats: null
                    };
                }
            })
        );
        
        // Renderizar modal
        renderRoundModal(lineup, playersWithStats, roundName);
        
    } catch (error) {
        console.error('❌ Erro ao carregar detalhes:', error);
        document.getElementById('modal-conteudo').innerHTML = `
            <div style="text-align: center; padding: 40px; color: #ef4444;">
                <p>❌ Erro ao carregar detalhes da rodada</p>
                <p style="font-size: 14px; margin-top: 8px;">${error.message}</p>
            </div>
        `;
    }
}

// ============================================
// RENDERIZAR MODAL
// ============================================

function renderRoundModal(lineup, players, roundName) {
    const totalPoints = lineup.total_points || 0;
    
    document.getElementById('modal-titulo').textContent = roundName;
    document.getElementById('modal-subtitulo').textContent = `${totalPoints.toFixed(1)} pontos`;
    
    const positionColors = {
        'GOL': '#ffc107',
        'FIX': '#2196F3',
        'ALA': '#4CAF50',
        'PIV': '#f44336'
    };
    
    const html = `
        <!-- Pontuação Total -->
        <div style="background: linear-gradient(135deg, #05D982 0%, #04c378 100%); border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px; color: white;">
            <div style="font-size: 14px; font-weight: 600; opacity: 0.9; margin-bottom: 8px;">PONTUAÇÃO TOTAL</div>
            <div style="font-size: 48px; font-weight: 900; line-height: 1;">${totalPoints.toFixed(1)}</div>
        </div>
        
        <!-- Jogadores -->
        <div style="display: flex; flex-direction: column; gap: 16px;">
            ${players.map(lp => {
                const player = lp.players;
                const points = lp.points || 0;
                const stats = lp.stats;
                const posColor = positionColors[player.position] || '#6b7280';
                
                return `
                    <div style="background: white; border: 2px solid #e5e7eb; border-radius: 12px; padding: 16px; transition: all 0.2s;">
                        <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 12px;">
                            <img src="${player.photo_url || 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'100\' height=\'100\'%3E%3Crect width=\'100\' height=\'100\' fill=\'%23e0e0e0\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' font-size=\'40\' text-anchor=\'middle\' dy=\'.3em\'%3E👤%3C/text%3E%3C/svg%3E'}"
                                 style="width: 64px; height: 64px; border-radius: 8px; object-fit: cover; border: 3px solid ${posColor};"
                                 onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'100\\' height=\\'100\\'%3E%3Crect width=\\'100\\' height=\\'100\\' fill=\\'%23e0e0e0\\'/%3E%3Ctext x=\\'50%25\\' y=\\'50%25\\' font-size=\\'40\\' text-anchor=\\'middle\\' dy=\\'.3em\\'%3E👤%3C/text%3E%3C/svg%3E'">
                            
                            <div style="flex: 1;">
                                <div style="font-size: 16px; font-weight: 700; color: #111827; margin-bottom: 4px;">${player.name}</div>
                                <div style="display: flex; align-items: center; gap: 8px;">
                                    <span style="padding: 4px 10px; background: ${posColor}; color: white; border-radius: 4px; font-size: 11px; font-weight: 700;">${player.position}</span>
                                    <span style="font-size: 13px; color: #6b7280;">${player.teams?.name || 'S/T'}</span>
                                </div>
                            </div>
                            
                            <div style="text-align: right;">
                                <div style="font-size: 32px; font-weight: 900; color: ${points >= 0 ? '#10b981' : '#ef4444'}; line-height: 1;">${points.toFixed(1)}</div>
                                <div style="font-size: 11px; color: #9ca3af; font-weight: 600;">PONTOS</div>
                            </div>
                        </div>
                        
                        ${stats ? `
                            <div style="background: #f9fafb; border-radius: 8px; padding: 12px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; font-size: 12px;">
                                ${stats.goals > 0 ? `<div>⚽ ${stats.goals} gol${stats.goals > 1 ? 's' : ''}</div>` : ''}
                                ${stats.assists > 0 ? `<div>🎯 ${stats.assists} assist${stats.assists > 1 ? 's' : ''}</div>` : ''}
                                ${stats.saves > 0 ? `<div>🧤 ${stats.saves} defesa${stats.saves > 1 ? 's' : ''}</div>` : ''}
                                ${stats.clean_sheet > 0 ? `<div>🛡️ Sem sofrer</div>` : ''}
                                ${stats.own_goals > 0 ? `<div style="color: #ef4444;">⚽ ${stats.own_goals} contra</div>` : ''}
                                ${stats.yellow_cards > 0 ? `<div style="color: #f59e0b;">🟨 ${stats.yellow_cards} amarelo${stats.yellow_cards > 1 ? 's' : ''}</div>` : ''}
                                ${stats.red_cards > 0 ? `<div style="color: #ef4444;">🟥 ${stats.red_cards} vermelho${stats.red_cards > 1 ? 's' : ''}</div>` : ''}
                            </div>
                        ` : `
                            <div style="background: #fef3c7; border-radius: 8px; padding: 12px; text-align: center; font-size: 13px; color: #92400e;">
                                ℹ️ Sem estatísticas registradas
                            </div>
                        `}
                    </div>
                `;
            }).join('')}
        </div>
    `;
    
    document.getElementById('modal-conteudo').innerHTML = html;
}

// ============================================
// FECHAR MODAL
// ============================================

function fecharModal() {
    document.getElementById('modal-detalhes').classList.remove('active');
    document.body.style.overflow = '';
}

// Fechar modal ao clicar fora
document.getElementById('modal-detalhes')?.addEventListener('click', (e) => {
    if (e.target.id === 'modal-detalhes') {
        fecharModal();
    }
});

// ============================================
// EMPTY STATE
// ============================================

function showEmptyState(message) {
    const container = document.getElementById('lista-rodadas');
    container.innerHTML = `
        <div style="text-align: center; padding: 60px 20px;">
            <div style="font-size: 64px; margin-bottom: 20px; opacity: 0.5;">📊</div>
            <p style="font-size: 18px; font-weight: 600; color: #6b7280; margin-bottom: 8px;">${message}</p>
            <p style="font-size: 14px; color: #9ca3af;">Suas rodadas aparecerão aqui quando você participar</p>
            <a href="mercado.html" style="display: inline-block; margin-top: 24px; padding: 12px 24px; background: #05D982; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
                Escalar Time
            </a>
        </div>
    `;
}

// ============================================
// EXPORTAR FUNÇÕES
// ============================================

window.showRoundDetails = showRoundDetails;
window.fecharModal = fecharModal;

console.log('✅ Minhas Rodadas JS carregado');