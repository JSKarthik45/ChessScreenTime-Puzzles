import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, ScrollView, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemedStyles, useThemeColors, useThemeController } from '../../theme/ThemeContext';
import { loadPreferences, savePreferences, setTheme, setChessUsername as saveChessUsername, setChessTacticsRating, clearChessImport, onTacticsRatingChanged } from '../../storage/preferences';
import { scheduleAllWindowNotifications } from '../../services/notifications';
import TimePickerModal from '../../components/TimePickerModal';

// No app toggles; replaced by time window selection UI

const styleFactory = (colors) => StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 12 },
  scrollContent: { paddingBottom: 40 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  sectionIcon: { marginRight: 8 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  sectionSub: { fontSize: 13, color: colors.muted, marginTop: 2 },
  listContent: { paddingVertical: 3 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center' },
  rowLabel: { marginLeft: 12, fontSize: 16, color: colors.text },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 4 },
  pill: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginRight: 10,
    marginBottom: 10,
    backgroundColor: colors.surface,
  },
  pillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  pillText: { color: colors.text, fontSize: 15, fontWeight: '500' },
  pillTextActive: { color: '#fff', fontWeight: '700' },
  helperText: { fontSize: 13, marginTop: 4, color: colors.muted, lineHeight: 18 },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
    backgroundColor: colors.surface,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  cardLabel: { fontSize: 13, fontWeight: '600', marginBottom: 8, color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.5 },
  primaryBtn: {
    marginTop: 14,
    paddingVertical: 13,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  input: {
    color: colors.text,
    fontSize: 15,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: colors.background,
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  timePill: {
    width: '48%',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  timePillLabel: { color: colors.muted, marginBottom: 4, fontSize: 12, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 },
  timePillValue: { color: colors.text, fontWeight: '700', fontSize: 18 },
  linkLabel: { marginLeft: 12, fontSize: 15, color: colors.text, flex: 1, fontWeight: '500' },
  linkIconRight: { marginLeft: 8 },
  linkRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  themeRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    width: '48%',
    marginRight: 0,
    marginBottom: 10,
    backgroundColor: colors.surface,
  },
  themeOptionActive: { borderColor: colors.primary, borderWidth: 2, backgroundColor: colors.background },
  themeSwatches: { flexDirection: 'row', marginRight: 10 },
  swatch: { width: 22, height: 22, borderRadius: 6, marginRight: 5 },
  themeLabel: { color: colors.text, fontSize: 14, fontWeight: '600' },
  linkList: { marginTop: 4 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 8, opacity: 0.5 },
});

export default function SettingsScreen() {
  const [problemTarget, setProblemTarget] = useState(5);
  const [fromTime, setFromTime] = useState(''); // 'HH:mm' 24h
  const [toTime, setToTime] = useState('');
  const [chessUsername, setChessUsername] = useState('');
  const [themeKey, setThemeKey] = useState('classic');
  const [tacticsRating, setTacticsRating] = useState(null);
  const [importing, setImporting] = useState(false);
  const themeController = useThemeController();
  const colors = useThemeColors();
  const styles = useThemedStyles(styleFactory);

  // Load saved preferences on mount
  useEffect(() => {
    (async () => {
      const pref = await loadPreferences();
      setProblemTarget(pref.problemTarget ?? 5);
      if (pref.fromTime) setFromTime(pref.fromTime);
      if (pref.toTime) setToTime(pref.toTime);
      if (pref.theme) {
        setThemeKey(pref.theme.key || 'classic');
      }
      if (pref.chessUsername) setChessUsername(pref.chessUsername);
      if (pref.chessTacticsRating != null) setTacticsRating(pref.chessTacticsRating);
    })();
    // Subscribe to cross-screen rating changes (e.g. imported from Practice tab)
    const unsub = onTacticsRatingChanged(({ rating, username }) => {
      setTacticsRating(rating);
      if (username != null) setChessUsername(username);
    });
    return () => unsub();
  }, []);
  const importRating = async () => {
    if (!chessUsername) return;
    try {
      setImporting(true);
      const res = await fetch(`https://api.chess.com/pub/player/${chessUsername}/stats`);
      const json = await res.json();
      const rating = json?.tactics?.highest?.rating ?? null;
      if (rating != null) {
        setTacticsRating(rating);
        await saveChessUsername(chessUsername);
        await setChessTacticsRating(rating);
      }
    } catch {}
    finally { setImporting(false); }
  };

  const themeOptions = [
    { key: 'classic', label: 'Green', primary: '#739552', secondary: '#ebecd0' },
    { key: 'warm', label: 'Brown', primary: '#b88762', secondary: '#edd6b0' },
    { key: 'blue', label: 'Blue', primary: '#4b7399', secondary: '#d6e9f8ff' },
    { key: 'rose', label: 'Pink', primary: '#eca3b0ff', secondary: '#f8d4ddff' },
  ];

  const applyTheme = (opt) => {
    setThemeKey(opt.key);
    themeController.applyTheme(opt);
    setTheme({ key: opt.key, primary: opt.primary, secondary: opt.secondary });
    savePreferences({ problemTarget, theme: { key: opt.key, primary: opt.primary, secondary: opt.secondary } });
  };

  // --- Time window UI helpers ---
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerTarget, setPickerTarget] = useState('from'); // 'from' | 'to'
  const [pickerInitH, setPickerInitH] = useState(9);
  const [pickerInitM, setPickerInitM] = useState(0);
  const [pickerInitAP, setPickerInitAP] = useState('AM');

  const formatTime = (hhmm) => {
    if (!hhmm) return 'Set time';
    const [h, m] = hhmm.split(':').map(n => Number(n));
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    const mm = String(m).padStart(2, '0');
    return `${h12}:${mm} ${ampm}`;
  };

  const openPicker = (target) => {
    setPickerTarget(target);
    const src = target === 'from' ? fromTime : toTime;
    const now = new Date();
    let h = now.getHours();
    let m = now.getMinutes() - (now.getMinutes() % 15);
    if (src) {
      const [sh, sm] = src.split(':').map(Number);
      if (Number.isFinite(sh)) h = sh;
      if (Number.isFinite(sm)) m = sm;
    }
    setPickerInitH(((h % 12) || 12));
    setPickerInitM(m);
    setPickerInitAP(h >= 12 ? 'PM' : 'AM');
    setPickerVisible(true);
  };

  const commitPicker = async ({ hour, minute, amPm }) => {
    const h24 = (hour % 12) + (amPm === 'PM' ? 12 : 0);
    const mm = String(minute).padStart(2, '0');
    const value = `${String(h24).padStart(2, '0')}:${mm}`;
    if (pickerTarget === 'from') setFromTime(value);
    else setToTime(value);
    await savePreferences({
      problemTarget,
      fromTime: pickerTarget === 'from' ? value : fromTime,
      toTime: pickerTarget === 'to' ? value : toTime,
    });
    try {
      await scheduleAllWindowNotifications();
    } catch {}
    setPickerVisible(false);
  };

  return (
    <>
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.sectionHeader}>
        <Ionicons name="time-outline" size={20} color={colors.primary} style={styles.sectionIcon} />
        <View>
          <Text style={styles.sectionTitle}>No-scroll window</Text>
          <Text style={styles.sectionSub}>When do you end up scrolling the most?</Text>
        </View>
      </View>
      <View style={styles.card}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Pressable onPress={() => openPicker('from')} style={[styles.timePill]}>
            <Text style={styles.timePillLabel}>From</Text>
            <Text style={styles.timePillValue}>{formatTime(fromTime)}</Text>
          </Pressable>
          <Pressable onPress={() => openPicker('to')} style={[styles.timePill]}>
            <Text style={styles.timePillLabel}>To</Text>
            <Text style={styles.timePillValue}>{formatTime(toTime)}</Text>
          </Pressable>
        </View>
        <Text style={[styles.helperText, { marginTop: 8 }]}>We’ll nudge you to finish puzzles during this window.</Text>
      </View>

      <View style={[styles.sectionHeader, { marginTop: 24 }]}>
        <Ionicons name="trophy-outline" size={20} color={colors.primary} style={styles.sectionIcon} />
        <Text style={styles.sectionTitle}>Daily puzzle goal</Text>
      </View>
      <View style={styles.pillRow}>
        {[1, 3, 5, 10, 20].map(n => {
          const active = problemTarget === n;
          return (
            <Pressable key={n} onPress={() => { setProblemTarget(n); savePreferences({ problemTarget: n }); }} style={[styles.pill, active && styles.pillActive]}>
              <Text style={[styles.pillText, active && styles.pillTextActive]}>{n}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.helperText}>If you haven’t hit your {problemTarget}-puzzle goal by no‑scroll time, we’ll nudge you to finish instead of scrolling.</Text>

      <View style={[styles.sectionHeader, { marginTop: 24 }]}>
        <Ionicons name="stats-chart-outline" size={20} color={colors.primary} style={styles.sectionIcon} />
        <Text style={styles.sectionTitle}>Tactics Rating</Text>
      </View>
      <View style={styles.card}>
        {tacticsRating != null ? (
          <>
            <Text style={styles.cardLabel}>Tactics Highest Rating</Text>
            <Text style={{ color: colors.text, fontSize: 22, fontWeight: '700' }}>{tacticsRating}</Text>
            <Text style={styles.helperText}>Imported for {chessUsername}</Text>
            <Pressable onPress={async () => { await clearChessImport(); setTacticsRating(null); setChessUsername(''); }} style={[styles.primaryBtn, { marginTop: 10, backgroundColor: colors.error }]}>
              <Text style={{ color: '#fff', fontWeight: '700' }}>Clear & Re-import</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={styles.cardLabel}>Chess.com Username</Text>
            <TextInput
              value={chessUsername}
              onChangeText={(t) => { setChessUsername(t); saveChessUsername(t); }}
              placeholder="e.g., jskarthik45"
              style={styles.input}
              placeholderTextColor={colors.muted}
              autoCapitalize="none"
            />
            <Pressable onPress={importRating} style={[styles.primaryBtn, { opacity: chessUsername && !importing ? 1 : 0.6 }]} disabled={!chessUsername || importing}>
              <Text style={styles.primaryBtnText}>{importing ? 'Importing...' : 'Import'}</Text>
            </Pressable>
            <Text style={styles.helperText}>This rating is used to personalize your puzzle difficulty in practice mode.</Text>
          </>
        )}
      </View>

      <View style={[styles.sectionHeader, { marginTop: 24 }]}>
        <Ionicons name="color-palette-outline" size={20} color={colors.primary} style={styles.sectionIcon} />
        <Text style={styles.sectionTitle}>Theme</Text>
      </View>
      <View style={styles.themeRow}>
        {themeOptions.map(opt => {
          const active = themeKey === opt.key;
          return (
            <Pressable key={opt.key} onPress={() => applyTheme(opt)} style={[styles.themeOption, active && styles.themeOptionActive]}> 
              <View style={styles.themeSwatches}>
                <View style={[styles.swatch, { backgroundColor: opt.primary }]} />
                <View style={[styles.swatch, { backgroundColor: opt.secondary }]} />
              </View>
              <Text style={styles.themeLabel}>{opt.label}</Text>
              {active && <Ionicons name="checkmark-circle" size={20} color={colors.primary} style={{ marginLeft: 6 }} />}
            </Pressable>
          );
        })}
      </View>

      <View style={[styles.sectionHeader, { marginTop: 24 }]}>
        <Ionicons name="link-outline" size={20} color={colors.primary} style={styles.sectionIcon} />
        <Text style={styles.sectionTitle}>More from us</Text>
      </View>
      <View style={styles.linkList}>
        <Pressable style={styles.linkRow} onPress={() => Linking.openURL('https://www.clutchess.tech')}>
          <Ionicons name="planet" size={22} color={colors.text} />
          <Text style={styles.linkLabel}>Clutch Chess</Text>
          <Ionicons name="open-outline" size={20} color={colors.muted} style={styles.linkIconRight} />
        </Pressable>
        <Pressable style={styles.linkRow} onPress={() => Linking.openURL('https://www.velacherychessacademy.com')}>
          <Ionicons name="school" size={22} color={colors.text} />
          <Text style={styles.linkLabel}>Velachery Chess Academy</Text>
          <Ionicons name="open-outline" size={20} color={colors.muted} style={styles.linkIconRight} />
        </Pressable>
      </View>

    </ScrollView>
    <TimePickerModal
      visible={pickerVisible}
      onClose={() => setPickerVisible(false)}
      onSave={commitPicker}
      initialHour={pickerInitH}
      initialMinute={pickerInitM}
      initialAmPm={pickerInitAP}
      label={pickerTarget === 'from' ? 'Set start time' : 'Set end time'}
    />
    </>
  );
}


