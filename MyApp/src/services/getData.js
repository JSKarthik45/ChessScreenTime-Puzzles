import { map } from 'lodash';
import { supabase } from '../services/supabase';
import { loadPreferences } from '../storage/preferences';

const DEFAULT_BUCKET_SIZE = 100;

export async function getPuzzlesData(tableName, limit = 10, rangeStart = null, rangeSize = DEFAULT_BUCKET_SIZE) {
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

    // Unified Puzzles table with optional id windows
    try {
        const hasRange = typeof rangeStart === 'number' && Number.isFinite(rangeStart);
        const bucketStart = hasRange ? rangeStart : 0;
        const bucketSize = (typeof rangeSize === 'number' && Number.isFinite(rangeSize) && rangeSize > 0) ? rangeSize : DEFAULT_BUCKET_SIZE;
        const lowerId = bucketStart;
        const upperId = bucketStart + bucketSize;

        if (tableName === 'TrendingPuzzles') {
            let q = supabase
                .from('Puzzles')
                .select('*');

            if (hasRange) {
                q = q.gte('id', lowerId).lt('id', upperId);
            }

            q = q
                .order('popularity', { ascending: false })
                .order('id', { ascending: true })
                .limit(limit);
            const { data, error } = await q;
            if (!error && Array.isArray(data) && data.length > 0) {
                return mapRowsFromPuzzles(data);
            }
        } else if (tableName === 'PracticePuzzles') {
            const prefs = await loadPreferences();
            const rating = (typeof prefs?.chessTacticsRating === 'number' && Number.isFinite(prefs.chessTacticsRating))
                ? prefs.chessTacticsRating
                : 1500;
            if (typeof rating === 'number' && Number.isFinite(rating)) {
                let q = supabase
                    .from('Puzzles')
                    .select('*');

                if (hasRange) {
                    q = q.gte('id', lowerId).lt('id', upperId);
                }

                q = q
                    .lte('lowestRating', rating)
                    .gte('highestRating', rating)
                    .order('id', { ascending: true })
                    .limit(limit);
                const { data, error } = await q;
                if (!error && Array.isArray(data) && data.length > 0) {
                    return mapRowsFromPuzzles(data);
                }
            }
        } else {
            let q = supabase
                .from('Puzzles')
                .select('*');

            if (hasRange) {
                q = q.gte('id', lowerId).lt('id', upperId);
            }

            q = q
                .order('id', { ascending: true })
                .limit(limit);
            const { data, error } = await q;
            if (!error && Array.isArray(data) && data.length > 0) {
                return mapRowsFromPuzzles(data);
            }
        }
    } catch {
        // Ignore and return empty on error
    }

    // On error or no data, return empty array
    return [];
}