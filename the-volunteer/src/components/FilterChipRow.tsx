import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import { ALL_CATEGORIES, CATEGORY_META, PALETTE, TaskCategory } from '../utils/theme';

interface FilterChipRowProps {
  selected: TaskCategory | null;
  onSelect: (cat: TaskCategory | null) => void;
}

export const FilterChipRow = ({ selected, onSelect }: FilterChipRowProps) => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={styles.row}
    style={styles.scroll}
  >
    {/* "All" chip */}
    <TouchableOpacity
      style={[styles.chip, selected === null && styles.chipActive]}
      onPress={() => onSelect(null)}
      activeOpacity={0.75}
    >
      <Text style={[styles.chipText, selected === null && styles.chipTextActive]}>All</Text>
    </TouchableOpacity>

    {ALL_CATEGORIES.map((cat) => {
      const meta = CATEGORY_META[cat];
      const isActive = selected === cat;
      return (
        <TouchableOpacity
          key={cat}
          style={[
            styles.chip,
            isActive && { backgroundColor: meta.bg, borderColor: meta.text },
          ]}
          onPress={() => onSelect(isActive ? null : cat)}
          activeOpacity={0.75}
        >
          <View style={styles.chipInner}>
            <Text style={styles.chipEmoji}>{meta.emoji}</Text>
            <Text style={[styles.chipText, isActive && { color: meta.text }]}>
              {meta.label}
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
