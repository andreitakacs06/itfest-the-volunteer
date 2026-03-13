import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Card, IconButton, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import { logout } from '../services/authService';
import { RatingStars } from '../components/RatingStars';

export const ProfileScreen = () => {
  const { profile } = useAuth();
  const initials =
    profile?.name
      ?.trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('') || 'V';

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
                <Text variant="bodyMedium">{profile?.email}</Text>
                <View style={styles.ratingWrap}>
                  <RatingStars value={profile?.rating ?? 0} />
                </View>
              </View>
            </View>
          </Card.Content>
        </Card>

        <View style={styles.statsRow}>
          <Card style={[styles.card, styles.statCard]}>
            <Card.Content style={styles.statContent}>
              <Text variant="titleMedium">Credits</Text>
              <Text variant="displaySmall">{profile?.credits ?? 0}</Text>
              <Text variant="bodySmall" style={styles.meta}>
                Completed tasks: {profile?.completedTasks ?? 0}
              </Text>
            </Card.Content>
          </Card>

          <Card style={[styles.card, styles.statCard]}>
            <Card.Content style={styles.statContent}>
              <Text variant="titleMedium">Daily Streak</Text>
              <Text variant="displaySmall">
                {profile?.dailyStreak ?? 0} <Text style={{ fontSize: 24 }}>🔥</Text>
              </Text>
            </Card.Content>
          </Card>
        </View>
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
  ratingWrap: {
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  statCard: {
    flex: 1,
    minHeight: 120,
    marginBottom: 0,
  },
  statContent: {
    flex: 1,
  },
  meta: {
    marginTop: 6,
    color: '#667084',
  },
});
