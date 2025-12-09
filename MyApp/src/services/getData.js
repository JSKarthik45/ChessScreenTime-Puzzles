import { map } from 'lodash';
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


function shuffleArray(rows) {
    const arr = Array.isArray(rows) ? [...rows] : [];
    for (let i = arr.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = arr[i];
        arr[i] = arr[j];
        arr[j] = tmp;
    }
    return arr;
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
        const text = row.text || 'Can you solve this puzzle?';
        return {
            id: (typeof row.id === 'number' ? row.id : null),
            key: String(row.id ?? row.key ?? Math.random()),
            fen: row.fen,
            turnText,
            text,
            correctMove: row.correctMove ?? null,
        };
    });

    // Try unified Puzzles table first
    try {
        if (tableName === 'TrendingPuzzles') {
            const overfetch = limit * 3;
            let q = supabase
                .from('Puzzles')
                .select('*')
                .order('popularity', { ascending: false })
                .order('id', { ascending: true })
                .limit(overfetch);
            if (afterId != null) {
                q = q.gt('id', afterId);
            }
            const { data, error } = await q;
            if (!error && Array.isArray(data) && data.length > 0) {
                const randomized = shuffleArray(data).slice(0, limit);
                return mapRowsFromPuzzles(randomized);
            }
        } else if (tableName === 'PracticePuzzles') {
            const prefs = await loadPreferences();
            const rating = (typeof prefs?.chessTacticsRating === 'number' && Number.isFinite(prefs.chessTacticsRating))
                ? prefs.chessTacticsRating
                : 1500;
            if (typeof rating === 'number' && Number.isFinite(rating)) {
                const overfetch = limit * 3;
                let q = supabase
                    .from('Puzzles')
                    .select('*')
                    .lte('lowestRating', rating)
                    .gte('highestRating', rating)
                    .order('id', { ascending: true })
                    .limit(overfetch);
                if (afterId != null) {
                    q = q.gt('id', afterId);
                }
                const { data, error } = await q;
                if (!error && Array.isArray(data) && data.length > 0) {
                    const randomized = shuffleArray(data).slice(0, limit);
                    return mapRowsFromPuzzles(randomized);
                }
            }
        } else {
            const overfetch = limit * 3;
            let q = supabase
                .from('Puzzles')
                .select('*')
                .order('id', { ascending: true })
                .limit(overfetch);
            if (afterId != null) {
                q = q.gt('id', afterId);
            }
            const { data, error } = await q;
            if (!error && Array.isArray(data) && data.length > 0) {
                const randomized = shuffleArray(data).slice(0, limit);
                return mapRowsFromPuzzles(randomized);
            }
        }
    } catch {
        // Ignore and fall back
    }

    // Fallback to existing table
    const { data, error } = await getData(tableName, limit, afterId);
    return error ? [] : mapRows(data);
}