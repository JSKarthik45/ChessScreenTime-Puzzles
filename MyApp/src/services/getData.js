import { supabase } from '../services/supabase';
import { loadPreferences } from '../storage/preferences';

async function getData(tableName, limit = 10, afterId = null) {
    let query = supabase.from(tableName).select('*');
    if (afterId != null) {
        query = query.gt('id', afterId);
    }
    // Ensure deterministic order
    query = query.order('id', { ascending: true }).limit(limit);
    return await query;
}


export async function getPuzzlesData(tableName, limit = 10, afterId = null) {
    const mapRows = (rows) => (rows || []).map((row) => ({
        id: (typeof row.id === 'number' ? row.id : null),
        key: String(row.id ?? row.key ?? Math.random()),
        fen: row.fen,
        turnText: row.turnText || row.turn || 'White to play',
        text: row.text || 'Can you solve this puzzle?',
        correctMove: row.correctMove ?? null,
    }));

    const mapRowsFromPuzzles = (rows) => (rows || []).map((row) => {
        const fen = row.fen || '';
        const parts = typeof fen === 'string' ? fen.split(' ') : [];
        const color = parts.length >= 2 ? parts[1] : 'w';
        const turnText = color === 'b' ? 'Black to play' : 'White to play';
        return {
            id: (typeof row.id === 'number' ? row.id : null),
            key: String(row.id ?? row.key ?? Math.random()),
            fen: row.fen,
            turnText,
            text: row.text || 'Can you solve this puzzle?',
            correctMove: row.correctMove ?? null,
        };
    });

    // Try unified Puzzles table first
    try {
        if (tableName === 'TrendingPuzzles') {
            let q = supabase
                .from('Puzzles')
                .select('*')
                .order('popularity', { ascending: false })
                .order('id', { ascending: true })
                .limit(limit);
            if (afterId != null) {
                q = q.gt('id', afterId);
            }
            const { data, error } = await q;
            if (!error && Array.isArray(data) && data.length > 0) {
                return mapRowsFromPuzzles(data);
            }
        } else if (tableName === 'PracticePuzzles') {
            const prefs = await loadPreferences();
            const rating = prefs?.chessTacticsRating;
            if (typeof rating === 'number' && Number.isFinite(rating)) {
                let q = supabase
                    .from('Puzzles')
                    .select('*')
                    .lte('lowestRating', rating)
                    .gte('highestRating', rating)
                    .order('id', { ascending: true })
                    .limit(limit);
                if (afterId != null) {
                    q = q.gt('id', afterId);
                }
                const { data, error } = await q;
                if (!error && Array.isArray(data) && data.length > 0) {
                    return mapRowsFromPuzzles(data);
                }
            }
        } else {
            let q = supabase
                .from('Puzzles')
                .select('*')
                .order('id', { ascending: true })
                .limit(limit);
            if (afterId != null) {
                q = q.gt('id', afterId);
            }
            const { data, error } = await q;
            if (!error && Array.isArray(data) && data.length > 0) {
                return mapRowsFromPuzzles(data);
            }
        }
    } catch {
        // Ignore and fall back
    }

    // Fallback to existing table
    const { data, error } = await getData(tableName, limit, afterId);
    return error ? [] : mapRows(data);
}