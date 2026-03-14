import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { PALETTE } from '../utils/theme';

interface StreakBadgeProps {
  streak: number;
  size?: 'sm' | 'lg';
}

export const StreakBadge = ({ streak, size = 'sm' }: StreakBadgeProps) => {
  if (!streak || streak < 1) return null;
  const isLarge = size === 'lg';

  return (
    <View style={[styles.badge, isLarge && styles.badgeLg]}>
      <Text style={[styles.flame, isLarge && styles.flameLg]}>🔥</Text>
      <Text style={[styles.count, isLarge && styles.countLg]}>
        {streak}
        {isLarge ? ' day streak' : ''}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    gap: 3,
  },
  badgeLg: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 5,
  },
  flame: {
    fontSize: 13,
  },
  flameLg: {
    fontSize: 18,
  },
  count: {
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.orange600,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  countLg: {
    fontSize: 15,
  },
});
