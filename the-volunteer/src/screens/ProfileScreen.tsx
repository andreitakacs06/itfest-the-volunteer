import React, { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Button, Dialog, Portal, RadioButton, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../hooks/useAuth';
import { logout, updateUserProfile } from '../services/authService';
import { StreakBadge } from '../components/StreakBadge';
import { PALETTE, RADIUS, SHADOW_MD, SHADOW_SM } from '../utils/theme';
import { RootStackParamList } from '../navigation/types';

// ─── Milestone tiers ──────────────────────────────────────────────────────────
type Milestone = { label: string; hours: number; emoji: string; bg: string; text: string };

const MILESTONES: Milestone[] = [
  { label: 'Bronze',   hours: 10,  emoji: '🥉', bg: '#FDF2E9', text: '#935116' },
  { label: 'Silver',   hours: 25,  emoji: '🥈', bg: '#F2F3F4', text: '#566573' },
  { label: 'Gold',     hours: 50,  emoji: '🥇', bg: '#FEF9E7', text: '#9A7D0A' },
  { label: 'Platinum', hours: 100, emoji: '💎', bg: '#EBF5FB', text: '#1A5276' },
];

const getMilestone = (hours: number) => {
  let current: Milestone | null = null;
  let next: Milestone | null = MILESTONES[0] ?? null;
  for (let i = 0; i < MILESTONES.length; i++) {
    if (hours >= MILESTONES[i].hours) {
      current = MILESTONES[i];
      next    = MILESTONES[i + 1] ?? null;
    } else {
      next = MILESTONES[i];
      break;
    }
  }
  return { current, next };
};

// ─── Main screen ───────────────────────────────────────────────────────────────
export const ProfileScreen = () => {
  const { profile, firebaseUser } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const initials =
    profile?.name
      ?.trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || 'V';

  const [isDialogVisible, setDialogVisible] = useState(false);
  const [accountType, setAccountType] = useState<'persoana fizica' | 'persoana juridica'>('persoana fizica');
  const [name, setName]   = useState(profile?.name ?? '');
  const [city, setCity]   = useState('');
  const [age,  setAge]    = useState('');
  const [phone, setPhone] = useState('');
  const [cui,  setCui]    = useState('');
  const [jro,  setJro]    = useState('');
  const [caen, setCaen]   = useState('');

  const openDialog = () => {
    const raw = profile as any;
    setName(profile?.name ?? '');
    setAccountType(raw?.accountType ?? 'persoana fizica');
    setCity(raw?.city ?? '');
    setAge(raw?.age ? String(raw.age) : '');
    setPhone(raw?.phone ?? '');
    setCui(raw?.cui ?? '');
    setJro(raw?.jro ?? '');
    setCaen(raw?.caen ?? '');
    setDialogVisible(true);
  };

  const canSave = useMemo(() => {
    if (!firebaseUser) return false;
    if (accountType === 'persoana fizica') return Boolean(name.trim() && city.trim() && age.trim() && phone.trim());
    return Boolean(name.trim() && cui.trim() && jro.trim() && caen.trim());
  }, [firebaseUser, accountType, name, city, age, phone, cui, jro, caen]);

  const handleSave = async () => {
    if (!firebaseUser) return;
    const updates: Record<string, unknown> = {
      accountType,
      name: name.trim(),
      requesterType: accountType === 'persoana fizica' ? 'physical' : 'juridic',
    };
    if (accountType === 'persoana fizica') {
      updates.city  = city.trim();
      updates.age   = Number(age);
      updates.phone = phone.trim();
    } else {
      updates.cui  = cui.trim();
      updates.jro  = jro.trim();
      updates.caen = caen.trim();
    }
    try {
      await updateUserProfile(firebaseUser.uid, updates);
      setDialogVisible(false);
    } catch (error) {
      Alert.alert('Error', (error as Error).message || 'Failed to save profile.');
    }
  };

  // ── Hours progress ────────────────────────────────────────────────────────────
  const totalHours = profile?.credits ?? 0;
  const { current: curMilestone, next: nextMilestone } = getMilestone(totalHours);
  const prevHours  = curMilestone?.hours ?? 0;
  const nextHours  = nextMilestone?.hours ?? prevHours;
  const progress   = nextMilestone
    ? Math.min((totalHours - prevHours) / (nextHours - prevHours), 1)
    : 1;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* ── Profile header card ── */}
        <View style={s.profileCard}>
          {/* Avatar + logout */}
          <View style={s.avatarRow}>
            <View style={s.avatarCircle}>
              <Text style={s.avatarInitials}>{initials}</Text>
            </View>
            <View style={s.identity}>
              <Text style={s.userName}>{profile?.name ?? 'Volunteer'}</Text>
              {/* Star rating */}
              <View style={s.ratingRow}>
                {[1,2,3,4,5].map((star) => (
                  <Text
                    key={star}
                    style={star <= Math.round(profile?.rating ?? 0) ? s.starOn : s.starOff}
                  >★</Text>
                ))}
                <Text style={s.ratingNum}>{(Number(profile?.rating ?? 0)).toFixed(1)}</Text>
              </View>
              <StreakBadge streak={profile?.dailyStreak ?? 0} size="lg" />
            </View>
            <TouchableOpacity style={s.logoutBtn} onPress={logout} activeOpacity={0.7}>
              <Text style={s.logoutIcon}>⎋</Text>
            </TouchableOpacity>
          </View>

          {/* Stats row */}
          <View style={s.statsRow}>
            <View style={s.statItem}>
              <Text style={s.statValue}>{totalHours}</Text>
              <Text style={s.statLabel}>Total Hours</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statItem}>
              <Text style={s.statValue}>{profile?.completedTasks ?? 0}</Text>
              <Text style={s.statLabel}>Tasks Done</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statItem}>
              <Text style={s.statValue}>{profile?.dailyStreak ?? 0}</Text>
              <Text style={s.statLabel}>Day Streak</Text>
            </View>
          </View>

          <TouchableOpacity style={s.editProfileBtn} onPress={openDialog} activeOpacity={0.85}>
            <Text style={s.editProfileText}>✏️  Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* ── Volunteer hours milestone card ── */}
        <View style={s.milestoneCard}>
          <View style={s.milestoneHeader}>
            <Text style={s.milestoneTitle}>Volunteer Progress</Text>
            {curMilestone && (
              <View style={[s.milestoneBadge, { backgroundColor: curMilestone.bg }]}>
                <Text style={s.milestoneBadgeEmoji}>{curMilestone.emoji}</Text>
                <Text style={[s.milestoneBadgeLabel, { color: curMilestone.text }]}>
                  {curMilestone.label}
                </Text>
              </View>
            )}
          </View>

          {nextMilestone ? (
            <>
              <Text style={s.milestoneDesc}>
                {totalHours}h / {nextMilestone.hours}h to reach {nextMilestone.emoji} {nextMilestone.label}
              </Text>
              <View style={s.progressTrack}>
                <View style={[s.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
              </View>
              <Text style={s.milestoneHint}>
                {nextMilestone.hours - totalHours} more hour{nextMilestone.hours - totalHours === 1 ? '' : 's'} to go!
              </Text>
            </>
          ) : (
            <>
              <Text style={s.milestoneDesc}>You've reached the highest tier! 🎉</Text>
              <View style={s.progressTrack}>
                <View style={[s.progressFill, { width: '100%' }]} />
              </View>
            </>
          )}

          {/* Tier roadmap */}
          <View style={s.tierRow}>
            {MILESTONES.map((m) => {
              const reached = totalHours >= m.hours;
              return (
                <View key={m.label} style={[s.tier, reached && { backgroundColor: m.bg }]}>
                  <Text style={s.tierEmoji}>{m.emoji}</Text>
                  <Text style={[s.tierLabel, reached && { color: m.text }]}>{m.hours}h</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* ── Certificate button ── */}
        <TouchableOpacity
          style={s.certCard}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Certificate')}
        >
          <View style={s.certLeft}>
            <Text style={s.certIcon}>🎓</Text>
            <View>
              <Text style={s.certTitle}>Volunteer Certificate</Text>
              <Text style={s.certSub}>Tap to view your verifiable certificate</Text>
            </View>
          </View>
        </TouchableOpacity>

      </ScrollView>

      {/* ── Edit profile dialog ── */}
      <Portal>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, justifyContent: 'center' }}
          pointerEvents="box-none"
        >
          <Dialog visible={isDialogVisible} onDismiss={() => setDialogVisible(false)}>
            <Dialog.Title>Edit Profile</Dialog.Title>
            <Dialog.Content>
              <KeyboardAwareScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                style={{ maxHeight: 360 }}
                enableOnAndroid={true}
              >
                <Text variant="bodyMedium" style={{ marginBottom: 8 }}>Account type</Text>
                <RadioButton.Group value={accountType} onValueChange={(value) => setAccountType(value as any)}>
                  <RadioButton.Item label="Persoana fizică" value="persoana fizica" />
                  <RadioButton.Item label="Persoana juridică" value="persoana juridica" />
                </RadioButton.Group>

                <TextInput mode="outlined" label="Name" value={name} onChangeText={setName} style={s.dialogInput} />

                {accountType === 'persoana fizica' ? (
                  <>
                    <TextInput mode="outlined" label="City"         value={city}  onChangeText={setCity}  style={s.dialogInput} />
                    <TextInput mode="outlined" label="Age"          value={age}   onChangeText={setAge}   style={s.dialogInput} keyboardType="numeric" />
                    <TextInput mode="outlined" label="Phone number" value={phone} onChangeText={setPhone} style={s.dialogInput} keyboardType="phone-pad" />
                  </>
                ) : (
                  <>
                    <TextInput mode="outlined" label="CUI / CIF" value={cui}  onChangeText={setCui}  style={s.dialogInput} />
                    <TextInput mode="outlined" label="J/RO"      value={jro}  onChangeText={setJro}  style={s.dialogInput} />
                    <TextInput mode="outlined" label="CAEN"      value={caen} onChangeText={setCaen} style={s.dialogInput} />
                  </>
                )}
              </KeyboardAwareScrollView>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setDialogVisible(false)}>Cancel</Button>
              <Button disabled={!canSave} onPress={handleSave}>Save</Button>
            </Dialog.Actions>
          </Dialog>
        </KeyboardAvoidingView>
      </Portal>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: PALETTE.slate50 },
  content: { padding: 20, paddingTop: 8, paddingBottom: 48 },

  // Profile card
  profileCard: {
    backgroundColor: PALETTE.white,
    borderRadius: RADIUS.xxl,
    padding: 20,
    marginBottom: 16,
    ...SHADOW_MD,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    marginBottom: 16,
  },
  avatarCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#E7EEF7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 26,
    fontWeight: '700',
    color: '#315C8A',
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  identity: { flex: 1, gap: 5 },
  userName: {
    fontSize: 20,
    fontWeight: '700',
    color: PALETTE.slate900,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 1 },
  starOn:    { fontSize: 16, color: PALETTE.amber500 },
  starOff:   { fontSize: 16, color: PALETTE.slate300 },
  ratingNum: { fontSize: 13, color: PALETTE.slate500, marginLeft: 5, fontFamily: 'SpaceGrotesk_500Medium' },
  logoutBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: PALETTE.slate100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutIcon: { fontSize: 17, color: PALETTE.slate600 },

  // Stats
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.slate50,
    borderRadius: RADIUS.lg,
    paddingVertical: 14,
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  statItem:    { flex: 1, alignItems: 'center', gap: 2 },
  statValue:   { fontSize: 22, fontWeight: '700', color: PALETTE.slate900, fontFamily: 'SpaceGrotesk_700Bold' },
  statLabel:   { fontSize: 11, color: PALETTE.slate500, fontFamily: 'SpaceGrotesk_400Regular' },
  statDivider: { width: 1, height: 30, backgroundColor: PALETTE.slate200 },

  editProfileBtn: {
    backgroundColor: PALETTE.blue100,
    borderRadius: RADIUS.lg,
    paddingVertical: 12,
    alignItems: 'center',
  },
  editProfileText: { fontSize: 14, fontWeight: '600', color: PALETTE.blue700, fontFamily: 'SpaceGrotesk_500Medium' },

  // Milestone card
  milestoneCard: {
    backgroundColor: PALETTE.white,
    borderRadius: RADIUS.xxl,
    padding: 20,
    marginBottom: 16,
    ...SHADOW_SM,
  },
  milestoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  milestoneTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: PALETTE.slate900,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  milestoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.md,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 4,
  },
  milestoneBadgeEmoji: { fontSize: 14 },
  milestoneBadgeLabel: { fontSize: 12, fontWeight: '700', fontFamily: 'SpaceGrotesk_700Bold' },
  milestoneDesc: { fontSize: 13, color: PALETTE.slate600, fontFamily: 'SpaceGrotesk_400Regular', marginBottom: 10 },
  progressTrack: {
    height: 8,
    backgroundColor: PALETTE.slate100,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: PALETTE.blue500,
    borderRadius: 4,
  },
  milestoneHint: { fontSize: 12, color: PALETTE.slate400, fontFamily: 'SpaceGrotesk_400Regular', marginBottom: 14 },
  tierRow: { flexDirection: 'row', gap: 8 },
  tier: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    backgroundColor: PALETTE.slate50,
  },
  tierEmoji: { fontSize: 18 },
  tierLabel: { fontSize: 11, color: PALETTE.slate500, fontFamily: 'SpaceGrotesk_500Medium' },

  // Certificate card
  certCard: {
    backgroundColor: PALETTE.white,
    borderRadius: RADIUS.xl,
    padding: 18,
    ...SHADOW_SM,
  },
  certLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  certIcon: { fontSize: 32 },
  certTitle: { fontSize: 15, fontWeight: '700', color: PALETTE.slate900, fontFamily: 'SpaceGrotesk_700Bold' },
  certSub:   { fontSize: 12, color: PALETTE.slate400, fontFamily: 'SpaceGrotesk_400Regular', marginTop: 2 },

  // Dialog
  dialogInput: { marginTop: 10 },
});
