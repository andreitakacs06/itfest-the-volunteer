import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Dialog, Icon, IconButton, Portal, RadioButton, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import { logout, updateUserProfile } from '../services/authService';
import { RatingStars } from '../components/RatingStars';

export const ProfileScreen = () => {
  const { profile, firebaseUser } = useAuth();
  const initials =
    profile?.name
      ?.trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || 'V';

  const [isDialogVisible, setDialogVisible] = useState(false);
  const [accountType, setAccountType] = useState<'persoana fizica' | 'persoana juridica'>('persoana fizica');
  const [name, setName] = useState(profile?.name ?? '');
  const [city, setCity] = useState('');
  const [age, setAge] = useState('');
  const [phone, setPhone] = useState('');
  const [cui, setCui] = useState('');
  const [jro, setJro] = useState('');
  const [caen, setCaen] = useState('');

  const openCompleteProfileDialog = () => {
    const rawProfile = profile as any;

    setName(profile?.name ?? '');
    setAccountType(rawProfile?.accountType ?? 'persoana fizica');
    setCity(rawProfile?.city ?? '');
    setAge(rawProfile?.age ? String(rawProfile.age) : '');
    setPhone(rawProfile?.phone ?? '');
    setCui(rawProfile?.cui ?? '');
    setJro(rawProfile?.jro ?? '');
    setCaen(rawProfile?.caen ?? '');
    setDialogVisible(true);
  };

  const closeCompleteProfileDialog = () => setDialogVisible(false);

  const canSaveProfile = useMemo(() => {
    if (!firebaseUser) return false;

    if (accountType === 'persoana fizica') {
      return Boolean(name.trim() && city.trim() && age.trim() && phone.trim());
    }

    return Boolean(name.trim() && cui.trim() && jro.trim() && caen.trim());
  }, [firebaseUser, accountType, name, city, age, phone, cui, jro, caen]);

  const handleSaveProfile = async () => {
    if (!firebaseUser) return;

    const updates: Record<string, unknown> = {
      accountType,
      name: name.trim(),
    };

    if (accountType === 'persoana fizica') {
      updates.city = city.trim();
      updates.age = Number(age);
      updates.phone = phone.trim();
    } else {
      updates.cui = cui.trim();
      updates.jro = jro.trim();
      updates.caen = caen.trim();
    }

    try {
      await updateUserProfile(firebaseUser.uid, updates);
      closeCompleteProfileDialog();
    } catch (error) {
      Alert.alert('Error', (error as Error).message || 'Failed to save profile.');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.headerRow}>
              <View style={styles.avatarCircle}>
                <Text variant="titleLarge" style={styles.avatarInitials}>
                  {initials}
                </Text>
              </View>
              <View style={styles.identityBlock}>
                <View style={styles.nameRow}>
                  <Text variant="headlineSmall">{profile?.name ?? 'Volunteer'}</Text>
                  <IconButton icon="exit-to-app" size={22} onPress={logout} accessibilityLabel="Logout" />
                </View>
                <View style={styles.ratingLine}>
                  <Text style={styles.star}>★</Text>
                  <Text variant="bodyMedium" style={styles.ratingValue}>
                    {(Number(profile?.rating ?? 0)).toFixed(1)}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.profileActionsRow}>
              <Button
                mode="contained"
                icon="plus"
                onPress={openCompleteProfileDialog}
                style={styles.completeProfileButton}
              >
                Complete profile
              </Button>
            </View>
          </Card.Content>
        </Card>

        <Portal>
          <Dialog visible={isDialogVisible} onDismiss={closeCompleteProfileDialog}>
            <Dialog.Title>Complete profile</Dialog.Title>
            <Dialog.Content>
              <Text variant="bodyMedium" style={styles.dialogLabel}>
                Select account type
              </Text>
              <RadioButton.Group value={accountType} onValueChange={(value) => setAccountType(value as any)}>
                <RadioButton.Item label="Persoana fizica" value="persoana fizica" />
                <RadioButton.Item label="Persoana juridica" value="persoana juridica" />
              </RadioButton.Group>

              <TextInput
                label="Name"
                value={name}
                onChangeText={setName}
                style={styles.dialogInput}
              />

              {accountType === 'persoana fizica' ? (
                <>
                  <TextInput
                    label="City"
                    value={city}
                    onChangeText={setCity}
                    style={styles.dialogInput}
                  />
                  <TextInput
                    label="Age"
                    keyboardType="numeric"
                    value={age}
                    onChangeText={setAge}
                    style={styles.dialogInput}
                  />
                  <TextInput
                    label="Phone number"
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={setPhone}
                    style={styles.dialogInput}
                  />
                </>
              ) : (
                <>
                  <TextInput
                    label="CUI / CIF"
                    value={cui}
                    onChangeText={setCui}
                    style={styles.dialogInput}
                  />
                  <TextInput
                    label="J/RO"
                    value={jro}
                    onChangeText={setJro}
                    style={styles.dialogInput}
                  />
                  <TextInput
                    label="CAEN"
                    value={caen}
                    onChangeText={setCaen}
                    style={styles.dialogInput}
                  />
                </>
              )}
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={closeCompleteProfileDialog}>Cancel</Button>
              <Button disabled={!canSaveProfile} onPress={handleSaveProfile}>
                Save
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>

        <Card style={[styles.card, styles.statCardFullWidth]}>
          <Card.Content style={styles.statContent}>
            <View style={styles.statHeaderRow}>
              <Text variant="titleMedium">Hours</Text>
              <Icon source="clock-outline" size={20} color="#667084" />
            </View>
            <Text variant="displaySmall">{profile?.credits ?? 0}</Text>
            <Text variant="bodySmall" style={styles.meta}>
              Completed tasks: {profile?.completedTasks ?? 0}
            </Text>
          </Card.Content>
        </Card>

        <Card style={[styles.card, styles.certificateCard]}>
          <Card.Content>
            <Text variant="titleMedium">Certficates</Text>
            <Text variant="displaySmall">0</Text>
          </Card.Content>
        </Card>

        <Button
          mode="contained"
          icon="certificate"
          onPress={() => {}}
          style={styles.generateCertificateButton}
        >
          Generate certificate
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FAFBFC',
  },
  screen: {
    flex: 1,
    backgroundColor: '#FAFBFC',
  },
  content: {
    padding: 16,
  },
  card: {
    marginBottom: 12,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E7EEF7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarInitials: {
    color: '#315C8A',
    fontWeight: '700',
  },
  identityBlock: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ratingLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -15,
  },
  statHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  star: {
    color: '#000',
    fontSize: 18,
    marginRight: 6,
  },
  ratingValue: {
    color: '#000',
  },
  profileActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
  },
  completeProfileButton: {
    marginLeft: 12,
  },
  generateCertificateButton: {
    marginTop: 12,
  },
  dialogLabel: {
    marginBottom: 8,
  },
  dialogInput: {
    marginTop: 12,
  },
  statCardFullWidth: {
    minHeight: 180,
    marginBottom: 0,
  },
  statContent: {
    flex: 1,
  },
  meta: {
    marginTop: 6,
    color: '#667084',
  },
  certificateCard: {
    marginTop: 20,
    minHeight: 180,
    marginBottom: 12,
  },
});
