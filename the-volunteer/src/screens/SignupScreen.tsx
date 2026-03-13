import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export const SignupScreen = () => {
	return (
		<View style={styles.container}>
			<Text style={styles.title}>Signup Screen</Text>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		padding: 16,
		backgroundColor: '#FAFBFC',
	},
	title: {
		fontSize: 24,
		fontWeight: '600',
		color: '#132238',
	},
});
