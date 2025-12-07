import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import CircleButton from '../../components/CircleButton';
import { lightTheme } from '../../theme';

export default function WelcomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: lightTheme.colors.text }]}>Welcome</Text>
      <Text style={[styles.subtitle, { color: lightTheme.colors.muted }]}>Onboarding starts here.</Text>

      <CircleButton
        onPress={() => navigation.navigate('Permissions')}
        icon="arrow-forward"
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
