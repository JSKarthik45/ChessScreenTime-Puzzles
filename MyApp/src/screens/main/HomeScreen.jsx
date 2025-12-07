import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useThemeColors, useThemedStyles } from '../../theme/ThemeContext';
import BoardPager from '../../components/BoardPager';
import { trendingPuzzles, practicePuzzles } from '../../data/puzzles';
import { refreshPuzzles } from '../../data/puzzles';

const styleFactory = (colors) => StyleSheet.create({
  container: { flex: 1, alignItems: 'stretch', justifyContent: 'center', paddingHorizontal: 0, paddingVertical: 0, backgroundColor: colors.background },
});

export default function HomeScreen({ mode = 'Trending' }) {
  const colors = useThemeColors();
  const styles = useThemedStyles(styleFactory);
  const [trendData, setTrendData] = React.useState(() => [...trendingPuzzles]);
  const [practiceData, setPracticeData] = React.useState(() => [...practicePuzzles]);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await refreshPuzzles();
        if (!mounted) return;
        // Copy arrays to change reference and trigger downstream re-render
        setTrendData([...trendingPuzzles]);
        setPracticeData([...practicePuzzles]);
      } catch {}
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <View style={styles.container}>
      {mode === 'Trending' ? (
        <BoardPager boards={trendData} transitionMode="preload" tableName="TrendingPuzzles" />
      ) : (
        // Add other mode components here
        <BoardPager boards={practiceData} transitionMode="preload" tableName="PracticePuzzles" />
      )}
    </View>
  );
}

// styles generated via hook
