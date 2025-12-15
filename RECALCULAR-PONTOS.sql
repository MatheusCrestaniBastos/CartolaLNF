-- ============================================
-- RECALCULAR TODOS OS PONTOS
-- ============================================
-- Execute este script para recalcular todos os pontos
-- de todas as escalações e usuários
-- ============================================

-- PASSO 1: Atualizar pontos em lineup_players baseado em player_stats
UPDATE lineup_players lp
SET points = COALESCE(ps.points, 0)
FROM player_stats ps
JOIN lineups l ON lp.lineup_id = l.id
WHERE ps.player_id = lp.player_id
  AND ps.round_id = l.round_id;

-- PASSO 2: Recalcular total de cada lineup
UPDATE lineups l
SET total_points = (
    SELECT COALESCE(SUM(lp.points), 0)
    FROM lineup_players lp
    WHERE lp.lineup_id = l.id
      AND lp.is_starter = true
);

-- PASSO 3: Recalcular total de cada usuário
UPDATE users u
SET total_points = (
    SELECT COALESCE(SUM(l.total_points), 0)
    FROM lineups l
    WHERE l.user_id = u.id
);

-- VERIFICAR RESULTADOS
SELECT 
    u.team_name,
    u.total_points as pontos_totais,
    COUNT(l.id) as rodadas_participadas
FROM users u
LEFT JOIN lineups l ON l.user_id = u.id
GROUP BY u.id, u.team_name, u.total_points
ORDER BY u.total_points DESC;

-- ✅ Pontos recalculados com sucesso!
