import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { Button, Card, RadioButton, Text, TextInput } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/types';
import { signUp } from '../services/authService';
import { UserRole } from '../firebase/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Signup'>;

export const SignupScreen = ({ navigation }: Props) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roleSelection, setRoleSelection] = useState<UserRole>('user');
  const [adminSecret, setAdminSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSignUp = async () => {
    try {
      setLoading(true);
      setError('');

      await signUp({
        name,
        email,
        password,
        roleSelection,
        adminSecret,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to sign up.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.select({ ios: 'padding', android: undefined })}
    >
      <Image source={require('../../assets/volunteer.png')} style={styles.logo} resizeMode="contain" />
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="headlineSmall">Create Account</Text>
          <TextInput mode="outlined" label="Name" value={name} onChangeText={setName} style={styles.input} />
          <TextInput
            mode="outlined"
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
          />
          <TextInput
            mode="outlined"
            label="Password"
            value={password}
            secureTextEntry
            onChangeText={setPassword}
            style={styles.input}
          />

          <Text variant="labelLarge" style={styles.roleLabel}>
            Role
          </Text>
          <RadioButton.Group onValueChange={(value) => setRoleSelection(value as UserRole)} value={roleSelection}>
            <RadioButton.Item label="Regular User" value="user" />
            <RadioButton.Item label="Admin" value="admin" />
          </RadioButton.Group>

          {roleSelection === 'admin' ? (
            <TextInput
              mode="outlined"
              label="Admin Secret Password"
              value={adminSecret}
              secureTextEntry
              onChangeText={setAdminSecret}
              style={styles.input}
            />
          ) : null}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button mode="contained" onPress={onSignUp} loading={loading} disabled={loading}>
            Sign up
          </Button>
          <Button mode="text" onPress={() => navigation.navigate('Login')}>
            Already have an account? Login
          </Button>
        </Card.Content>
      </Card>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#EEF2F5',
    alignItems: 'center',
    justifyContent: 'center',
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
  input: {
    marginBottom: 12,
    backgroundColor: '#F2F5F7',
  },
  roleLabel: {
    marginTop: 8,
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#F2F5F7',
    borderRadius: 8,
  },
  roleText: {
    fontSize: 16,
    color: '#1A1A1A',
  },
  checkMark: {
    fontSize: 18,
    color: 'transparent',
    fontWeight: 'bold',
  },
  checkMarkSelected: {
    color: '#1877F2',
  },
  button: {
    marginBottom: 16,
  },
  error: {
    marginVertical: 10,
    color: '#D24242',
  },
});