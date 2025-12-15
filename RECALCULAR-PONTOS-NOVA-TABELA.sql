-- ============================================
-- RECALCULAR PONTOS - NOVA TABELA
-- ============================================
-- Execute este script para recalcular TODOS os pontos
-- usando a nova tabela de pontuação:
-- 
-- Gol: 5 pts (antes: 8)
-- Assistência: 3 pts (antes: 5)
-- Finalização: 1 pt (antes: 3)
-- Defesa: 1.5 pts (antes: 7)
-- Falta: -0.5 pts (antes: -0.3)
-- ============================================

-- PASSO 1: Recalcular pontos em player_stats
UPDATE player_stats
SET points = (
    (COALESCE(goals, 0) * 5) +                    -- Gol: 5 pts
    (COALESCE(assists, 0) * 3) +                  -- Assistência: 3 pts
    (COALESCE(shots_on_target, 0) * 1) +          -- Finalização: 1 pt
    (COALESCE(saves, 0) * 1.5) +                  -- Defesa: 1.5 pts
    (COALESCE(clean_sheet, 0) * 5) +              -- Sem sofrer: 5 pts
    (COALESCE(own_goals, 0) * -3) +               -- Gol contra: -3 pts
    (COALESCE(yellow_cards, 0) * -1) +            -- Amarelo: -1 pt
    (COALESCE(red_cards, 0) * -5) +               -- Vermelho: -5 pts
    (COALESCE(fouls, 0) * -0.5)                   -- Falta: -0.5 pts
);

-- PASSO 2: Atualizar pontos em lineup_players
UPDATE lineup_players lp
SET points = COALESCE(ps.points, 0)
FROM player_stats ps
JOIN lineups l ON lp.lineup_id = l.id
WHERE ps.player_id = lp.player_id
  AND ps.round_id = l.round_id;

-- PASSO 3: Recalcular total de cada lineup
UPDATE lineups l
SET total_points = (
    SELECT COALESCE(SUM(lp.points), 0)
    FROM lineup_players lp
    WHERE lp.lineup_id = l.id
      AND lp.is_starter = true
);

-- PASSO 4: Recalcular total de cada usuário
UPDATE users u
SET total_points = (
    SELECT COALESCE(SUM(l.total_points), 0)
    FROM lineups l
    WHERE l.user_id = u.id
);

-- PASSO 5: Verificar resultados
SELECT 
    p.name,
    ps.goals,
    ps.assists,
    ps.shots_on_target,
    ps.saves,
    ps.clean_sheet,
    ps.own_goals,
    ps.yellow_cards,
    ps.red_cards,
    ps.fouls,
    ps.points as pontos_recalculados
FROM player_stats ps
JOIN players p ON ps.player_id = p.id
ORDER BY ps.points DESC
LIMIT 20;

-- PASSO 6: Verificar usuários
SELECT 
    u.team_name,
    u.total_points as pontos_totais,
    COUNT(l.id) as rodadas_participadas
FROM users u
LEFT JOIN lineups l ON l.user_id = u.id
GROUP BY u.id, u.team_name, u.total_points
ORDER BY u.total_points DESC;

-- ✅ Pontos recalculados com NOVA tabela!
-- 
-- MUDANÇAS:
-- • Gol: 8 → 5 (-37.5%)
-- • Assistência: 5 → 3 (-40%)
-- • Finalização: 3 → 1 (-66%)
-- • Defesa: 7 → 1.5 (-78.6%)
-- • Falta: -0.3 → -0.5 (+66.7%)
