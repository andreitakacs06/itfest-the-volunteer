import React, { useRef } from 'react';
import { StyleSheet, View, Animated, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { PALETTE, RADIUS, SHADOW_LG } from '../utils/theme';

type Milestone = { label: string; hours: number; emoji: string; bg: string; text: string; gradient: string[] };

const MILESTONES: Milestone[] = [
  { label: 'Bronze',   hours: 10,  emoji: '🥉', bg: '#FDF2E9', text: '#935116', gradient: ['#FDF2E9', '#E59866'] },
  { label: 'Silver',   hours: 25,  emoji: '🥈', bg: '#F2F3F4', text: '#566573', gradient: ['#F2F3F4', '#95A5A6'] },
  { label: 'Gold',     hours: 50,  emoji: '🥇', bg: '#FEF9E7', text: '#9A7D0A', gradient: ['#FEF9E7', '#F1C40F'] },
  { label: 'Platinum', hours: 100, emoji: '💎', bg: '#EBF5FB', text: '#1A5276', gradient: ['#EBF5FB', '#5DADE2'] },
];

const getMilestone = (hours: number) => {
  let current: Milestone | null = null;
  for (let i = 0; i < MILESTONES.length; i++) {
    if (hours >= MILESTONES[i].hours) {
      current = MILESTONES[i];
    } else {
      break;
    }
  }
  return current;
};

export const CertificateScreen = () => {
  const { profile } = useAuth();
  const navigation = useNavigation();

  const totalHours = profile?.credits ?? 0;
  const currentMilestone = getMilestone(totalHours);

  // Fallback to "Participant" if they haven't reached Bronze
  const tierName = currentMilestone ? currentMilestone.label : 'Participant';
  const tierEmoji = currentMilestone ? currentMilestone.emoji : '🤝';
  const tierColor = currentMilestone ? currentMilestone.text : PALETTE.blue600;
  const tierBg = currentMilestone ? currentMilestone.bg : PALETTE.blue100;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>✕</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Animated.View
          style={[
            styles.certContainer,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Decorative Background Elements */}
          <View style={[styles.cornerBox, styles.topLeft, { backgroundColor: tierColor }]} />
          <View style={[styles.cornerBox, styles.bottomRight, { backgroundColor: tierColor }]} />
          
          <View style={styles.certInner}>
            <Text style={styles.certTitle}>CERTIFICATE OF APPRECIATION</Text>
            
            <Text style={styles.certSubtitle}>This certificate is proudly presented to</Text>
            
            <Text style={styles.nameText}>{profile?.name || 'Volunteer'}</Text>

            <View style={styles.divider} />

            <Text style={styles.bodyText}>
              In recognition of their dedication, hard work, and invaluable contributions to the community through the "The Volunteer" platform.
            </Text>

            <View style={styles.statsContainer}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{totalHours.toFixed(1)}</Text>
                <Text style={styles.statLabel}>Total Hours Volunteered</Text>
              </View>
              
              <View style={styles.statBox}>
                <View style={[styles.tierBadge, { backgroundColor: tierBg }]}>
                  <Text style={styles.tierEmoji}>{tierEmoji}</Text>
                  <Text style={[styles.tierLabel, { color: tierColor }]}>{tierName} Tier</Text>
                </View>
                <Text style={styles.statLabel}>Current Milestone</Text>
              </View>
            </View>

            <View style={styles.signatures}>
              <View style={styles.signatureBlock}>
                <View style={styles.signatureLine} />
                <Text style={styles.signatureLabel}>ITFest Organization</Text>
              </View>
              <View style={styles.dateBlock}>
                <Text style={styles.dateText}>{new Date().toLocaleDateString()}</Text>
                <Text style={styles.signatureLabel}>Date Issued</Text>
              </View>
            </View>
          </View>
        </Animated.View>
      </View>

      <TouchableOpacity style={styles.shareBtn} activeOpacity={0.8} onPress={() => {}}>
        <Text style={styles.shareBtnText}>Share Achievement</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: PALETTE.slate900 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { fontSize: 18, color: PALETTE.white, fontWeight: '700' },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  certContainer: {
    backgroundColor: PALETTE.white,
    borderRadius: RADIUS.xxl,
    overflow: 'hidden',
    ...SHADOW_LG,
    padding: 10,
  },
  cornerBox: {
    position: 'absolute',
    width: 100,
    height: 100,
    opacity: 0.1,
  },
  topLeft: {
    top: -50,
    left: -50,
    transform: [{ rotate: '45deg' }],
  },
  bottomRight: {
    bottom: -50,
    right: -50,
    transform: [{ rotate: '45deg' }],
  },
  certInner: {
    borderWidth: 2,
    borderColor: PALETTE.slate100,
    borderRadius: RADIUS.xl,
    padding: 24,
    alignItems: 'center',
  },
  certTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: PALETTE.blue700,
    letterSpacing: 2,
    fontFamily: 'SpaceGrotesk_700Bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  certSubtitle: {
    fontSize: 13,
    color: PALETTE.slate500,
    fontFamily: 'SpaceGrotesk_400Regular',
    marginBottom: 8,
  },
  nameText: {
    fontSize: 28,
    fontWeight: '700',
    color: PALETTE.slate900,
    fontFamily: 'SpaceGrotesk_700Bold',
    textAlign: 'center',
    marginVertical: 10,
  },
  divider: {
    width: 60,
    height: 3,
    backgroundColor: PALETTE.slate200,
    borderRadius: 2,
    marginVertical: 20,
  },
  bodyText: {
    fontSize: 14,
    color: PALETTE.slate600,
    textAlign: 'center',
    fontFamily: 'SpaceGrotesk_400Regular',
    lineHeight: 22,
    paddingHorizontal: 10,
    marginBottom: 30,
  },
  statsContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    marginBottom: 40,
  },
  statBox: {
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: PALETTE.slate900,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  statLabel: {
    fontSize: 11,
    color: PALETTE.slate500,
    fontFamily: 'SpaceGrotesk_500Medium',
    textTransform: 'uppercase',
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    gap: 6,
  },
  tierEmoji: { fontSize: 16 },
  tierLabel: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  signatures: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  signatureBlock: {
    alignItems: 'center',
  },
  signatureLine: {
    width: 100,
    height: 1,
    backgroundColor: PALETTE.slate300,
    marginBottom: 6,
  },
  signatureLabel: {
    fontSize: 11,
    color: PALETTE.slate400,
    fontFamily: 'SpaceGrotesk_500Medium',
  },
  dateBlock: {
    alignItems: 'center',
  },
  dateText: {
    fontSize: 13,
    fontWeight: '600',
    color: PALETTE.slate700,
    fontFamily: 'SpaceGrotesk_500Medium',
    marginBottom: 6,
  },
  shareBtn: {
    marginHorizontal: 24,
    marginBottom: 20,
    backgroundColor: PALETTE.blue500,
    borderRadius: RADIUS.lg,
    paddingVertical: 16,
    alignItems: 'center',
  },
  shareBtnText: {
    color: PALETTE.white,
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'SpaceGrotesk_700Bold',
  },
});
