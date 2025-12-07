import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { lightTheme } from '../theme';

export default function CircleButton({ onPress, icon = 'arrow-forward', size = 56, color = '#fff', backgroundColor = lightTheme.colors.primary, style }) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[styles.button, { width: size, height: size, borderRadius: size / 2, backgroundColor }, style]}
    >
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={Math.floor(size * 0.48)} color={color} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  iconWrap: { alignItems: 'center', justifyContent: 'center' },
});
