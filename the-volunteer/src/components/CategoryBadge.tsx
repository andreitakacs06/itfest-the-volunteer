import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { CATEGORY_META, TaskCategory } from '../utils/theme';

interface CategoryBadgeProps {
  category?: TaskCategory;
  size?: 'sm' | 'md';
}

export const CategoryBadge = ({ category, size = 'md' }: CategoryBadgeProps) => {
  const cat = category ?? 'Other';
  const meta = CATEGORY_META[cat];
  const isSmall = size === 'sm';

  return (
    <View style={[styles.pill, { backgroundColor: meta.bg }, isSmall && styles.pillSm]}>
      <Text style={[styles.emoji, isSmall && styles.emojiSm]}>{meta.emoji}</Text>
      <Text style={[styles.label, { color: meta.text }, isSmall && styles.labelSm]}>
        {meta.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 4,
    alignSelf: 'flex-start',
  },
  pillSm: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 3,
  },
  emoji: {
    fontSize: 13,
  },
  emojiSm: {
    fontSize: 11,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'SpaceGrotesk_500Medium',
  },
  labelSm: {
    fontSize: 11,
  },
});
