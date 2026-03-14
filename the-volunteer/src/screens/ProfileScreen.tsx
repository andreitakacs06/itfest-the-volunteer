import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, IconButton, Text } from 'react-native-paper';
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
                onPress={() => {}}
                style={styles.completeProfileButton}
              >
                Complete profile
              </Button>
            </View>
          </Card.Content>
        </Card>

        <Card style={[styles.card, styles.statCardFullWidth]}>
          <Card.Content style={styles.statContent}>
            <Text variant="titleMedium">Hours</Text>
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
    marginTop: -15
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
