import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Animated,
} from 'react-native';
import { useThemeColors } from '../theme/ThemeContext';

const HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const MINUTES = [0, 15, 30, 45];

export default function TimePickerModal({
  visible,
  onClose,
  onSave,
  initialHour = 9,
  initialMinute = 0,
  initialAmPm = 'AM',
  label = 'Select time',
}) {
  const colors = useThemeColors();
  const [hour, setHour] = useState(initialHour);
  const [minute, setMinute] = useState(initialMinute);
  const [amPm, setAmPm] = useState(initialAmPm);
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setHour(initialHour);
      setMinute(initialMinute);
      setAmPm(initialAmPm);
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 65, friction: 9 }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      scaleAnim.setValue(0.9);
      opacityAnim.setValue(0);
    }
  }, [visible, initialHour, initialMinute, initialAmPm]);

  const handleSave = () => {
    onSave({ hour, minute, amPm });
  };

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          {/* Header */}
          <Text style={[styles.label, { color: colors.muted }]}>{label}</Text>

          {/* Large time display */}
          <View style={styles.displayRow}>
            <View style={[styles.displayBox, { backgroundColor: colors.primary + '14' }]}>
              <Text style={[styles.displayNum, { color: colors.text }]}>{hour}</Text>
            </View>
            <Text style={[styles.displayColon, { color: colors.muted }]}>:</Text>
            <View style={[styles.displayBox, { backgroundColor: colors.primary + '14' }]}>
              <Text style={[styles.displayNum, { color: colors.text }]}>
                {String(minute).padStart(2, '0')}
              </Text>
            </View>
            {/* AM/PM inline */}
            <View style={styles.amPmCol}>
              {['AM', 'PM'].map((v) => (
                <Pressable
                  key={v}
                  onPress={() => setAmPm(v)}
                  style={[
                    styles.amPmBtn,
                    {
                      backgroundColor: amPm === v ? colors.primary : 'transparent',
                      borderColor: amPm === v ? colors.primary : colors.border,
                    },
                    v === 'AM' && styles.amPmTop,
                    v === 'PM' && styles.amPmBottom,
                  ]}
                >
                  <Text
                    style={[
                      styles.amPmText,
                      { color: amPm === v ? '#fff' : colors.text },
                    ]}
                  >
                    {v}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Hour grid — 4×3 */}
          <Text style={[styles.gridLabel, { color: colors.muted }]}>Hour</Text>
          <View style={styles.grid}>
            {HOURS.map((h) => {
              const active = hour === h;
              return (
                <Pressable
                  key={h}
                  onPress={() => setHour(h)}
                  style={[
                    styles.cell,
                    {
                      backgroundColor: active ? colors.primary : colors.background,
                      borderColor: active ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.cellText,
                      { color: active ? '#fff' : colors.text },
                      active && styles.cellTextActive,
                    ]}
                  >
                    {h}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Minute grid — 1×4 */}
          <Text style={[styles.gridLabel, { color: colors.muted, marginTop: 14 }]}>
            Minute
          </Text>
          <View style={styles.minuteRow}>
            {MINUTES.map((m) => {
              const active = minute === m;
              return (
                <Pressable
                  key={m}
                  onPress={() => setMinute(m)}
                  style={[
                    styles.minuteCell,
                    {
                      backgroundColor: active ? colors.primary : colors.background,
                      borderColor: active ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.cellText,
                      { color: active ? '#fff' : colors.text },
                      active && styles.cellTextActive,
                    ]}
                  >
                    {String(m).padStart(2, '0')}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <Pressable onPress={onClose} style={styles.cancelBtn}>
              <Text style={[styles.cancelText, { color: colors.muted }]}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleSave}
              style={[styles.saveBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.saveText}>Save</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    width: '88%',
    maxWidth: 380,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 16,
  },

  /* Large display */
  displayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  displayBox: {
    width: 88,
    height: 72,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  displayNum: {
    fontSize: 36,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  displayColon: {
    fontSize: 32,
    fontWeight: '800',
    marginHorizontal: 6,
  },
  amPmCol: {
    marginLeft: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  amPmBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
  },
  amPmTop: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomWidth: 0,
  },
  amPmBottom: {
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  amPmText: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },

  /* Hour grid */
  gridLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cell: {
    width: '23%',
    aspectRatio: 1.6,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  cellText: {
    fontSize: 15,
    fontWeight: '600',
  },
  cellTextActive: {
    fontWeight: '800',
  },

  /* Minute row */
  minuteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  minuteCell: {
    width: '23%',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Actions */
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 22,
    alignItems: 'center',
  },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    marginRight: 8,
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '600',
  },
  saveBtn: {
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 14,
  },
  saveText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
  },
});
