import { getPuzzlesData } from '../services/getData';
import { getLatestPuzzleId } from '../storage/preferences';

// Exported mutable arrays; keep reference stable so consumers see updates after mutation.
export const trendingPuzzles = [];
export const practicePuzzles = [];

// Internal load process (fires immediately on module import)
// Initial asynchronous population (mutates arrays in place)
(async () => {
  const [lastT, lastP] = await Promise.all([
    getLatestPuzzleId('TrendingPuzzles'),
    getLatestPuzzleId('PracticePuzzles'),
  ]);
  const [t, p] = await Promise.all([
    getPuzzlesData('TrendingPuzzles', 10, lastT),
    getPuzzlesData('PracticePuzzles', 10, lastP),
  ]);
    // logs removed
    trendingPuzzles.splice(0, trendingPuzzles.length, ...t);
    practicePuzzles.splice(0, practicePuzzles.length, ...p);
})();

// Optional helper if a component wants to refresh manually
export async function refreshPuzzles({ afterTrendingId = null, afterPracticeId = null } = {}) {
  const [t, p] = await Promise.all([
    getPuzzlesData('TrendingPuzzles', 10, afterTrendingId),
    getPuzzlesData('PracticePuzzles', 10, afterPracticeId),
  ]);
  // logs removed
  trendingPuzzles.splice(0, trendingPuzzles.length, ...t);
  practicePuzzles.splice(0, practicePuzzles.length, ...p);
  return { trendingPuzzles, practicePuzzles };
}
