import React from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemedStyles, useThemeColors } from '../../theme/ThemeContext';
import BoardPager from '../../components/BoardPager';
import { getPuzzlesData } from '../../services/getData';
import { getLatestPuzzleId, setLatestPuzzleId, getBatchIndex, setBatchIndex, loadPreferences, setChessUsername as saveChessUsername, setChessTacticsRating, onTacticsRatingChanged } from '../../storage/preferences';
import { startNoScrollReminder, stopNoScrollReminder } from '../../services/notifications';

const styleFactory = (colors) => StyleSheet.create({
  container: { flex: 1, alignItems: 'stretch', justifyContent: 'center', backgroundColor: colors.background },
  importGate: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 28 },
  importIcon: { marginBottom: 16 },
  importTitle: { fontSize: 20, fontWeight: '800', color: colors.text, textAlign: 'center', marginBottom: 6 },
  importSub: { fontSize: 14, color: colors.muted, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  importCard: { width: '100%', borderRadius: 16, padding: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  importLabel: { fontSize: 13, fontWeight: '600', color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  importInput: { color: colors.text, fontSize: 15, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14, backgroundColor: colors.background },
  importBtn: { marginTop: 14, paddingVertical: 13, alignItems: 'center', borderRadius: 12, backgroundColor: colors.primary },
  importBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  importHelper: { fontSize: 13, marginTop: 10, color: colors.muted, textAlign: 'center', lineHeight: 18 },
});

const BUCKET_SIZE = 1000;
const PAGE_SIZE = 10;
const PREFETCH_INDEX_IN_BATCH = 7; // 0-based: 8th puzzle triggers prefetch

// Derive a bucket-aligned start from an arbitrary puzzle id
const deriveBucket = (id) => Math.floor(id / BUCKET_SIZE) * BUCKET_SIZE;

export default function HomeScreen({ mode = 'Trending' }) {
  const styles = useThemedStyles(styleFactory);
  const colors = useThemeColors();
  const [trendData, setTrendData] = React.useState([]);
  const [practiceData, setPracticeData] = React.useState([]);

  // Practice-gate state: require rating import before showing puzzles
  const [tacticsRating, setTacticsRating] = React.useState(null);
  const [ratingLoaded, setRatingLoaded] = React.useState(false);
  const [importUsername, setImportUsername] = React.useState('');
  const [importingRating, setImportingRating] = React.useState(false);

  const [trendBucketStart, setTrendBucketStart] = React.useState(null);
  const [practiceBucketStart, setPracticeBucketStart] = React.useState(null);
  const [trendPrefetchedNext, setTrendPrefetchedNext] = React.useState(false);
  const [practicePrefetchedNext, setPracticePrefetchedNext] = React.useState(false);

  // Saved position within the current 10-puzzle batch
  const [trendInitialIndex, setTrendInitialIndex] = React.useState(0);
  const [practiceInitialIndex, setPracticeInitialIndex] = React.useState(0);

  // Load tactics rating on mount to decide whether to gate practice tab
  React.useEffect(() => {
    (async () => {
      try {
        const pref = await loadPreferences();
        if (pref.chessTacticsRating != null) setTacticsRating(pref.chessTacticsRating);
        if (pref.chessUsername) setImportUsername(pref.chessUsername);
      } catch {}
      setRatingLoaded(true);
    })();
    // Subscribe to cross-screen rating changes (e.g. cleared from Settings)
    const unsub = onTacticsRatingChanged(({ rating }) => {
      setTacticsRating(rating);
    });
    return () => unsub();
  }, []);

  const doImportRating = async () => {
    if (!importUsername) return;
    try {
      setImportingRating(true);
      const res = await fetch(`https://api.chess.com/pub/player/${importUsername}/stats`);
      const json = await res.json();
      const rating = json?.tactics?.highest?.rating ?? null;
      if (rating != null) {
        setTacticsRating(rating);
        await saveChessUsername(importUsername);
        await setChessTacticsRating(rating);
      }
    } catch {}
    finally { setImportingRating(false); }
  };

  React.useEffect(() => {
    let mounted = true;
    startNoScrollReminder(10 * 60 * 1000);
    (async () => {
      try {
        // --- 1. Load stored bucket + batch index (parallel) ---
        const [storedT, storedP, batchIdxT, batchIdxP] = await Promise.all([
          getLatestPuzzleId('TrendingPuzzles'),
          getLatestPuzzleId('PracticePuzzles'),
          getBatchIndex('TrendingPuzzles'),
          getBatchIndex('PracticePuzzles'),
        ]);

        const hasStoredT = typeof storedT === 'number' && Number.isFinite(storedT);
        const hasStoredP = typeof storedP === 'number' && Number.isFinite(storedP);

        // --- 2. First fetch (parallel) ---
        let [t, p] = await Promise.all([
          getPuzzlesData('TrendingPuzzles', PAGE_SIZE, hasStoredT ? storedT : null),
          getPuzzlesData('PracticePuzzles', PAGE_SIZE, hasStoredP ? storedP : null),
        ]);

        // Fallback: retry with no range
        if (!Array.isArray(t) || t.length === 0) {
          t = await getPuzzlesData('TrendingPuzzles', PAGE_SIZE, null);
        }
        if (!Array.isArray(p) || p.length === 0) {
          p = await getPuzzlesData('PracticePuzzles', PAGE_SIZE, null);
        }

        if (!mounted) return;

        t = Array.isArray(t) ? t : [];
        p = Array.isArray(p) ? p : [];

        // --- 3. Derive effective bucket from first result's id ---
        let bucketT = hasStoredT ? storedT : null;
        if (t.length > 0 && t[0].id != null) {
          const derived = deriveBucket(t[0].id);
          if (!hasStoredT || derived !== storedT) {
            bucketT = derived;
            setLatestPuzzleId('TrendingPuzzles', bucketT);
          }
        }

        let bucketP = hasStoredP ? storedP : null;
        if (p.length > 0 && p[0].id != null) {
          const derived = deriveBucket(p[0].id);
          if (!hasStoredP || derived !== storedP) {
            bucketP = derived;
            setLatestPuzzleId('PracticePuzzles', bucketP);
          }
        }

        // --- 4. Clamp saved batch index to actual data length ---
        const safeIdxT = Math.min(batchIdxT, Math.max(0, t.length - 1));
        const safeIdxP = Math.min(batchIdxP, Math.max(0, p.length - 1));

        setTrendBucketStart(bucketT);
        setPracticeBucketStart(bucketP);
        setTrendData(t);
        setPracticeData(p);
        setTrendInitialIndex(safeIdxT);
        setPracticeInitialIndex(safeIdxP);
      } catch {}
    })();
    return () => { mounted = false; stopNoScrollReminder(); };
  }, []);

  const handleIndexChange = React.useCallback(async (tableName, index) => {
    try {
      // Persist batch index so the session can resume here
      setBatchIndex(tableName, index % PAGE_SIZE);

      if (tableName === 'TrendingPuzzles') {
        if (trendBucketStart == null) return;
        const currentLength = trendData.length;
        if (currentLength === 0) return;
        const batchIndex = index % PAGE_SIZE;

        if (!trendPrefetchedNext && currentLength <= PAGE_SIZE && batchIndex === PREFETCH_INDEX_IN_BATCH) {
          const nextBucketStart = trendBucketStart + BUCKET_SIZE;
          const nextBatch = await getPuzzlesData('TrendingPuzzles', PAGE_SIZE, nextBucketStart);
          if (Array.isArray(nextBatch) && nextBatch.length > 0) {
            setTrendData((prev) => [...prev, ...nextBatch]);
            setTrendPrefetchedNext(true);
          }
          return;
        }

        if (trendPrefetchedNext && currentLength > PAGE_SIZE && index >= PAGE_SIZE) {
          const newBucketStart = trendBucketStart + BUCKET_SIZE;
          setTrendData((prev) => prev.slice(PAGE_SIZE));
          setTrendBucketStart(newBucketStart);
          setTrendPrefetchedNext(false);
          setLatestPuzzleId('TrendingPuzzles', newBucketStart);
          setBatchIndex('TrendingPuzzles', 0);
        }
      } else if (tableName === 'PracticePuzzles') {
        if (practiceBucketStart == null) return;
        const currentLength = practiceData.length;
        if (currentLength === 0) return;
        const batchIndex = index % PAGE_SIZE;

        if (!practicePrefetchedNext && currentLength <= PAGE_SIZE && batchIndex === PREFETCH_INDEX_IN_BATCH) {
          const nextBucketStart = practiceBucketStart + BUCKET_SIZE;
          const nextBatch = await getPuzzlesData('PracticePuzzles', PAGE_SIZE, nextBucketStart);
          if (Array.isArray(nextBatch) && nextBatch.length > 0) {
            setPracticeData((prev) => [...prev, ...nextBatch]);
            setPracticePrefetchedNext(true);
          }
          return;
        }

        if (practicePrefetchedNext && currentLength > PAGE_SIZE && index >= PAGE_SIZE) {
          const newBucketStart = practiceBucketStart + BUCKET_SIZE;
          setPracticeData((prev) => prev.slice(PAGE_SIZE));
          setPracticeBucketStart(newBucketStart);
          setPracticePrefetchedNext(false);
          setLatestPuzzleId('PracticePuzzles', newBucketStart);
          setBatchIndex('PracticePuzzles', 0);
        }
      }
    } catch {}
  }, [
    trendBucketStart,
    practiceBucketStart,
    trendData.length,
    practiceData.length,
    trendPrefetchedNext,
    practicePrefetchedNext,
  ]);

  return (
    <View style={styles.container}>
      {mode === 'Trending' ? (
        <BoardPager
          boards={trendData}
          transitionMode="preload"
          tableName="TrendingPuzzles"
          initialIndex={trendInitialIndex}
          onIndexChange={(index) => handleIndexChange('TrendingPuzzles', index)}
        />
      ) : (
        ratingLoaded && tacticsRating == null ? (
          <View style={styles.importGate}>
            <Ionicons name="stats-chart" size={48} color={colors.primary} style={styles.importIcon} />
            <Text style={styles.importTitle}>Import your rating</Text>
            <Text style={styles.importSub}>Practice puzzles are matched to your skill level. Import your Chess.com tactics rating to get started.</Text>
            <View style={styles.importCard}>
              <Text style={styles.importLabel}>Chess.com Username</Text>
              <TextInput
                value={importUsername}
                onChangeText={setImportUsername}
                placeholder="e.g., jskarthik45"
                style={styles.importInput}
                placeholderTextColor={colors.muted}
                autoCapitalize="none"
              />
              <Pressable onPress={doImportRating} style={[styles.importBtn, { opacity: importUsername && !importingRating ? 1 : 0.6 }]} disabled={!importUsername || importingRating}>
                <Text style={styles.importBtnText}>{importingRating ? 'Importing...' : 'Import Rating'}</Text>
              </Pressable>
            </View>
            <Text style={styles.importHelper}>Your rating personalizes puzzle difficulty so you always get the right challenge.</Text>
          </View>
        ) : (
          <BoardPager
            boards={practiceData}
            transitionMode="preload"
            tableName="PracticePuzzles"
            initialIndex={practiceInitialIndex}
            onIndexChange={(index) => handleIndexChange('PracticePuzzles', index)}
          />
        )
      )}
    </View>
  );
}
