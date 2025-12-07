import React, { useContext } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import CircleButton from '../../components/CircleButton';
import { OnboardingContext } from '../../navigation/OnboardingContext';
import { lightTheme } from '../../theme';

export default function PermissionsScreen() {
  const { completeOnboarding } = useContext(OnboardingContext);
  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: lightTheme.colors.text }]}>Permissions</Text>
      <Text style={[styles.subtitle, { color: lightTheme.colors.muted }]}>Explain required app permissions here.</Text>

      <CircleButton
        onPress={completeOnboarding}
        icon="checkmark"
        backgroundColor={lightTheme.colors.success}
        style={styles.fab}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: lightTheme.colors.background },
  title: { fontSize: 24, fontWeight: '600' },
  subtitle: { marginTop: 8 },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
  },
});
