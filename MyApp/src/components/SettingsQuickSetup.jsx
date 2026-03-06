import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useThemeColors, useThemedStyles } from '../theme/ThemeContext';
import { loadPreferences, savePreferences } from '../storage/preferences';
import { scheduleAllWindowNotifications } from '../services/notifications';
import TimePickerModal from './TimePickerModal';

const styleFactory = (colors) => StyleSheet.create({
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8, color: colors.text },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    backgroundColor: colors.surface,
  },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  timePill: {
    width: '48%',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.primary,
  },
  timePillLabel: { color: colors.secondary, marginBottom: 4 },
  timePillValue: { color: colors.text, fontWeight: '700', fontSize: 16 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap' },
  pill: {
    paddingVertical: 3,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    marginRight: 8,
    marginBottom: 8,
  },
  pillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  pillText: { color: colors.text },
  pillTextActive: { color: '#fff', fontWeight: '600' },
  helperText: { marginTop: 1, color: colors.muted },
});

export default function SettingsQuickSetup({ problemTarget, setProblemTarget }) {
  const colors = useThemeColors();
  const styles = useThemedStyles(styleFactory);
  const [fromTime, setFromTime] = useState('');
  const [toTime, setToTime] = useState('');
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerTarget, setPickerTarget] = useState('from');
  const [pickerInitH, setPickerInitH] = useState(9);
  const [pickerInitM, setPickerInitM] = useState(0);
  const [pickerInitAP, setPickerInitAP] = useState('AM');

  useEffect(() => {
    (async () => {
      const pref = await loadPreferences();
      if (pref.fromTime) setFromTime(pref.fromTime);
      if (pref.toTime) setToTime(pref.toTime);
    })();
  }, []);

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

  const commitPicker = ({ hour, minute, amPm }) => {
    const h24 = (hour % 12) + (amPm === 'PM' ? 12 : 0);
    const mm = String(minute).padStart(2, '0');
    const value = `${String(h24).padStart(2, '0')}:${mm}`;
    if (pickerTarget === 'from') setFromTime(value);
    else setToTime(value);
    savePreferences({ problemTarget, fromTime: pickerTarget === 'from' ? value : fromTime, toTime: pickerTarget === 'to' ? value : toTime });
    scheduleAllWindowNotifications().catch(() => {});
    setPickerVisible(false);
  };

  return (
    <View>
      <Text style={styles.sectionTitle}>When do you end up scrolling the most?</Text>
      <View style={styles.card}>
        <View style={styles.timeRow}>
          <Pressable onPress={() => openPicker('from')} style={styles.timePill}>
            <Text style={styles.timePillLabel}>From</Text>
            <Text style={styles.timePillValue}>{formatTime(fromTime)}</Text>
          </Pressable>
          <Pressable onPress={() => openPicker('to')} style={styles.timePill}>
            <Text style={styles.timePillLabel}>To</Text>
            <Text style={styles.timePillValue}>{formatTime(toTime)}</Text>
          </Pressable>
        </View>
        <Text style={styles.helperText}>We'll steer you back to puzzles during this window.</Text>
      </View>

      <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Daily puzzle goal</Text>
      <View style={styles.pillRow}>
        {[1, 3, 5, 10, 20].map(n => {
          const active = problemTarget === n;
          return (
            <Pressable key={n} onPress={() => setProblemTarget(n)} style={[styles.pill, active && styles.pillActive]}>
              <Text style={[styles.pillText, active && styles.pillTextActive]}>{n}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.helperText}>{"If you haven\u0027t hit your "}{problemTarget}{"-puzzle goal by no-scroll time, we\u0027ll nudge you to finish instead of scrolling."}</Text>

      <TimePickerModal
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onSave={commitPicker}
        initialHour={pickerInitH}
        initialMinute={pickerInitM}
        initialAmPm={pickerInitAP}
        label={pickerTarget === 'from' ? 'Set start time' : 'Set end time'}
      />
    </View>
  );
}