import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { Button, Card, Divider, Menu, Text, TextInput } from 'react-native-paper';
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
  const [menuVisible, setMenuVisible] = useState(false);

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

          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            style={{ width: '82%' }}
            contentStyle={{ backgroundColor: '#F2F5F7', zIndex: 9999 }}
            anchor={
              <TextInput
                mode="outlined"
                label="Role"
                value={roleSelection === 'user' ? 'Regular User' : 'Admin'}
                editable={false}
                onPress={() => setMenuVisible(true)}
                style={styles.input}
                right={<TextInput.Icon icon="menu-down" onPress={() => setMenuVisible(true)} />}
              />
            }
          >
            <Menu.Item
              onPress={() => { setRoleSelection('user'); setMenuVisible(false); }}
              title="Regular User"
              style={{ backgroundColor: '#F2F5F7', width: '100%' }}
              titleStyle={{ color: '#1A1A1A' }}
            />            
            <Divider />
            <Menu.Item
              onPress={() => { setRoleSelection('admin'); setMenuVisible(false); }}
              title="Admin"
              style={{ backgroundColor: '#F2F5F7' }}
              titleStyle={{ color: '#1A1A1A' }}
            />          
            </Menu>

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
  button: {
    marginBottom: 16,
  },
  error: {
    marginVertical: 10,
    color: '#D24242',
  },
});