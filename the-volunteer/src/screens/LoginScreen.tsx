import React, { useState } from 'react';
import { Image, Platform, StyleSheet, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Button, Card, Text, TextInput } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/types';
import { login } from '../services/authService';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export const LoginScreen = ({ navigation }: Props) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onLogin = async () => {
    try {
      setLoading(true);
      setError('');
      await login(email, password);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAwareScrollView
      style={styles.screen}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      enableOnAndroid={true}
      extraScrollHeight={Platform.OS === 'ios' ? 20 : 0}
    >
        <Image source={require('../../assets/volunteer.png')} style={styles.logo} resizeMode="contain" />
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="headlineSmall">The Volunteer</Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Hyper-local help, powered by your neighborhood.
            </Text>
            <TextInput
              mode="outlined"
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              returnKeyType="next"
              blurOnSubmit={false}
              style={styles.input}
            />
            <TextInput
              mode="outlined"
              label="Password"
              value={password}
              secureTextEntry
              onChangeText={setPassword}
              returnKeyType="done"
              onSubmitEditing={onLogin}
              style={styles.input}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Button mode="contained" onPress={onLogin} loading={loading} disabled={loading}>
              Login
            </Button>
            <View style={styles.spacer} />
            <Button mode="text" onPress={() => navigation.navigate('Signup')}>
              Create an account
            </Button>
          </Card.Content>
        </Card>
    </KeyboardAwareScrollView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#EEF2F5',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 16,
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 18,
    color: '#8E9BAA',
  },
  input: {
    marginBottom: 12,
    backgroundColor: '#F2F5F7',
  },
  button: {
    marginBottom: 16,
  },
  error: {
    marginBottom: 10,
    color: '#D24242',
  },
  spacer: {
    height: 6,
  },
});