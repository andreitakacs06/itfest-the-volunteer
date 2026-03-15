import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import { RequesterType } from '../firebase/types';
import { PALETTE } from '../utils/theme';

interface RequesterTypeFilterRowProps {
  selected: RequesterType | null;
  onSelect: (type: RequesterType | null) => void;
}

const TYPES: { type: RequesterType | null; label: string; emoji: string }[] = [
  { type: null, label: 'All types', emoji: '🔍' },
  { type: 'physical', label: 'Individuals', emoji: '👤' },
  { type: 'juridic', label: 'NGO / Org', emoji: '🏢' },
];

export const RequesterTypeFilterRow = ({ selected, onSelect }: RequesterTypeFilterRowProps) => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={styles.row}
    style={styles.scroll}
  >
    {TYPES.map(({ type, label, emoji }) => {
      const isActive = selected === type;
      return (
        <TouchableOpacity
          key={type ?? 'all'}
          style={[
            styles.chip,
            isActive && styles.chipActive,
          ]}
          onPress={() => onSelect(type)}
          activeOpacity={0.75}
        >
          <View style={styles.chipInner}>
            <Text style={styles.chipEmoji}>{emoji}</Text>
            <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
              {label}
            </Text>
          </View>
        </TouchableOpacity>
      );
    })}
  </ScrollView>
);

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 0,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  chip: {
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: PALETTE.slate200,
    backgroundColor: PALETTE.white,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  chipActive: {
    backgroundColor: PALETTE.blue500,
    borderColor: PALETTE.blue500,
  },
  chipInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  chipEmoji: {
    fontSize: 13,
  },
  chipText: {
    fontSize: 13,
    color: PALETTE.slate600,
    fontFamily: 'SpaceGrotesk_500Medium',
  },
  chipTextActive: {
    color: PALETTE.white,
  },
});
