import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  blockedApps: 'dd_blocked_apps',
  problemTarget: 'dd_problem_target',
  scrollFromTime: 'dd_scroll_from_time',
  scrollToTime: 'dd_scroll_to_time',
  themePrimary: 'dd_theme_primary',
  themeSecondary: 'dd_theme_secondary',
  themeKey: 'dd_theme_key',
  chessUsername: 'dd_chess_username',
  chessTacticsRating: 'dd_chess_tactics_rating',
};

// Current puzzle bucket start id per table (used for id windows)
export const LATEST_KEYS = {
  TrendingPuzzles: 'dd_latest_trending_id',
  PracticePuzzles: 'dd_latest_practice_id',
};

// Index within the current 10-puzzle batch so users resume exactly where they left off
const BATCH_INDEX_KEYS = {
  TrendingPuzzles: 'dd_batch_index_trending',
  PracticePuzzles: 'dd_batch_index_practice',
};

export async function getBatchIndex(tableName) {
  try {
    const key = BATCH_INDEX_KEYS[tableName];
    if (!key) return 0;
    const raw = await AsyncStorage.getItem(key);
    const num = raw ? Number(raw) : 0;
    return Number.isFinite(num) && num >= 0 ? num : 0;
  } catch {
    return 0;
  }
}

export async function setBatchIndex(tableName, index) {
  try {
    const key = BATCH_INDEX_KEYS[tableName];
    if (!key) return;
    await AsyncStorage.setItem(key, String(index ?? 0));
  } catch {}
}

export async function getLatestPuzzleId(tableName) {
  try {
    const key = LATEST_KEYS[tableName];
    if (!key) return null;
    const raw = await AsyncStorage.getItem(key);
    const num = raw ? Number(raw) : null;
    const value = Number.isFinite(num) ? num : null;
    return value;
  } catch {
    return null;
  }
}

export async function setLatestPuzzleId(tableName, id) {
  try {
    const key = LATEST_KEYS[tableName];
    if (!key) return;
    if (id == null) return;
    await AsyncStorage.setItem(key, String(id));
  } catch {}
}

// Daily puzzle counts used for streak (date string -> number)
export const PUZZLE_COUNTS_KEY = 'dd_puzzle_counts';

// Lightweight event emitter for puzzle count changes
const listeners = new Set();
export function onPuzzleCountChanged(handler) {
  listeners.add(handler);
  return () => listeners.delete(handler);
}
function emitPuzzleCountChanged(payload) {
  listeners.forEach((fn) => {
    try { fn(payload); } catch {}
  });
}

export async function incrementTodayPuzzleCount() {
  const today = new Date().toISOString().substring(0, 10);
  let counts = {};
  try {
    const raw = await AsyncStorage.getItem(PUZZLE_COUNTS_KEY);
    counts = raw ? JSON.parse(raw) : {};
  } catch {}
  const next = { ...counts, [today]: (counts[today] || 0) + 1 };
  try { await AsyncStorage.setItem(PUZZLE_COUNTS_KEY, JSON.stringify(next)); } catch {}
  // Notify listeners
  emitPuzzleCountChanged({ date: today, count: next[today] });
  return next[today];
}

export async function getPuzzleCounts() {
  try {
    const raw = await AsyncStorage.getItem(PUZZLE_COUNTS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export async function loadPreferences() {
  try {
    const [blockedStr, targetStr, fromTime, toTime, primary, secondary, themeKey, chessUsername, chessRating] = await Promise.all([
      AsyncStorage.getItem(KEYS.blockedApps),
      AsyncStorage.getItem(KEYS.problemTarget),
      AsyncStorage.getItem(KEYS.scrollFromTime),
      AsyncStorage.getItem(KEYS.scrollToTime),
      AsyncStorage.getItem(KEYS.themePrimary),
      AsyncStorage.getItem(KEYS.themeSecondary),
      AsyncStorage.getItem(KEYS.themeKey),
      AsyncStorage.getItem(KEYS.chessUsername),
      AsyncStorage.getItem(KEYS.chessTacticsRating),
    ]);
    const blocked = blockedStr ? JSON.parse(blockedStr) : {};
    const problemTarget = targetStr ? Number(targetStr) : 5;
    const theme = (primary && secondary) ? { key: themeKey || 'classic', primary, secondary } : null;

    // Default no-scroll window if user hasn't set times: 8:00 PM to 10:30 PM.
    const effectiveFromTime = fromTime || '20:00';
    const effectiveToTime = toTime || '22:30';

    return {
      blocked,
      problemTarget,
      fromTime: effectiveFromTime,
      toTime: effectiveToTime,
      theme,
      chessUsername: chessUsername || '',
      chessTacticsRating: chessRating ? Number(chessRating) : null,
    };
  } catch (e) {
    return {
      blocked: {},
      problemTarget: 5,
      fromTime: '00:00',
      toTime: '22:00',
      theme: null,
      chessUsername: '',
      chessTacticsRating: null,
    };
  }
}

export async function savePreferences({ problemTarget, fromTime, toTime, theme }) {
  try {
    const tasks = [
      AsyncStorage.setItem(KEYS.problemTarget, String(problemTarget ?? 5)),
    ];
    if (typeof fromTime === 'string') {
      tasks.push(AsyncStorage.setItem(KEYS.scrollFromTime, fromTime));
    }
    if (typeof toTime === 'string') {
      tasks.push(AsyncStorage.setItem(KEYS.scrollToTime, toTime));
    }
    if (theme && theme.primary && theme.secondary) {
      tasks.push(AsyncStorage.setItem(KEYS.themePrimary, theme.primary));
      tasks.push(AsyncStorage.setItem(KEYS.themeSecondary, theme.secondary));
      tasks.push(AsyncStorage.setItem(KEYS.themeKey, theme.key || 'custom'));
    }
    await Promise.all(tasks);
  } catch (e) {
    // ignore
  }
}

export async function setBlocked(blocked) {
  try {
    await AsyncStorage.setItem(KEYS.blockedApps, JSON.stringify(blocked || {}));
  } catch {}
}

export async function setProblemTarget(value) {
  try {
    await AsyncStorage.setItem(KEYS.problemTarget, String(value ?? 5));
  } catch {}
}

export async function setTheme(theme) {
  try {
    if (theme && theme.primary && theme.secondary) {
      await Promise.all([
        AsyncStorage.setItem(KEYS.themePrimary, theme.primary),
        AsyncStorage.setItem(KEYS.themeSecondary, theme.secondary),
        AsyncStorage.setItem(KEYS.themeKey, theme.key || 'custom'),
      ]);
    }
  } catch {}
}

export async function setChessUsername(username = "") {
  try { await AsyncStorage.setItem(KEYS.chessUsername, username || ''); } catch {}
}

// Lightweight event emitter for tactics rating changes (mirrors puzzle count pattern)
const ratingListeners = new Set();
export function onTacticsRatingChanged(handler) {
  ratingListeners.add(handler);
  return () => ratingListeners.delete(handler);
}
function emitTacticsRatingChanged(payload) {
  ratingListeners.forEach((fn) => {
    try { fn(payload); } catch {}
  });
}

export async function setChessTacticsRating(rating = 1500) {
  try { if (rating != null) await AsyncStorage.setItem(KEYS.chessTacticsRating, String(rating)); } catch {}
  // Read current username so subscribers get the full picture
  let username = null;
  try { username = await AsyncStorage.getItem(KEYS.chessUsername) || ''; } catch {}
  emitTacticsRatingChanged({ rating, username });
}

export async function clearChessImport() {
  try {
    await Promise.all([
      AsyncStorage.removeItem(KEYS.chessUsername),
      AsyncStorage.removeItem(KEYS.chessTacticsRating),
    ]);
  } catch {}
  emitTacticsRatingChanged({ rating: null, username: '' });
}
