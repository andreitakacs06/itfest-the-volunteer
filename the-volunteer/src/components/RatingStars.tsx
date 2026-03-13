import React from 'react';
import { StyleSheet, View } from 'react-native';
import { IconButton, Text } from 'react-native-paper';

interface RatingStarsProps {
  value: number;
  onChange?: (rating: number) => void;
  size?: number;
}

export const RatingStars = ({ value, onChange, size = 22 }: RatingStarsProps) => (
  <View style={styles.row}>
    {Array.from({ length: 5 }).map((_, index) => {
      const star = index + 1;
      return (
        <IconButton
          key={star}
          icon={star <= value ? 'star' : 'star-outline'}
          iconColor={star <= value ? '#F9B949' : '#B7C0CC'}
          size={size}
          onPress={onChange ? () => onChange(star) : undefined}
          disabled={!onChange}
          style={styles.icon}
        />
      );
    })}
    {!onChange ? <Text variant="labelMedium">{value.toFixed(1)}</Text> : null}
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginHorizontal: 0,
    marginVertical: 0,
  },
});
