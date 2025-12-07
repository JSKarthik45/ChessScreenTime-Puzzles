import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Image } from 'react-native';
import { useThemeColors } from '../theme/ThemeContext';

// Ultra-minimal splash: fade + gentle scale of logo.png, rounded, quick dopamine pop.
export default function AnimatedSplash({ onFinish, duration = 900 }) {
	const colors = useThemeColors();
	const fade = useRef(new Animated.Value(0)).current;
	const scale = useRef(new Animated.Value(0.92)).current;

	useEffect(() => {
		Animated.sequence([
			Animated.parallel([
				Animated.timing(fade, { toValue: 1, duration: 380, easing: Easing.out(Easing.quad), useNativeDriver: true }),
				Animated.timing(scale, { toValue: 1, duration: 620, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
			]),
			Animated.delay(220),
			Animated.timing(fade, { toValue: 0, duration: 300, easing: Easing.in(Easing.quad), useNativeDriver: true }),
		]).start(() => onFinish?.());
	}, [fade, scale, onFinish]);

	return (
		<Animated.View style={[styles.container, { backgroundColor: colors.background, opacity: fade }]}>      
			<Animated.View style={{ transform: [{ scale }] }}>
				<Image source={require('../../assets/logo.png')} style={styles.logo} />
			</Animated.View>
		</Animated.View>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
	logo: { width: 300, height: 300, borderRadius: 32, shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } },
});
