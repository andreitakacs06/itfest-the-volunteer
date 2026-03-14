import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import { Task, getTaskHours } from '../firebase/types';
import { PALETTE, RADIUS, REQUESTER_COLORS, SHADOW_MD } from '../utils/theme';
import { CategoryBadge } from './CategoryBadge';

interface TaskCardProps {
  task: Task;
  distanceKm?: number;
  actionText?: string;
  onPressAction?: () => void;
  actionLoading?: boolean;
}

const RequesterPill = ({ type }: { type?: string }) => {
  const key = (type ?? 'general') as keyof typeof REQUESTER_COLORS;
  const colors = REQUESTER_COLORS[key] ?? REQUESTER_COLORS.general;
  return (
    <View style={[styles.pill, { backgroundColor: colors.bg }]}>
      <Text style={[styles.pillText, { color: colors.text }]}>{colors.label}</Text>
    </View>
  );
};

export const TaskCard = ({
  task,
  distanceKm,
  actionText,
  onPressAction,
  actionLoading,
}: TaskCardProps) => {
  const hours = getTaskHours(task);

  return (
    <View style={styles.card}>
      {/* ── Top row: category + hours badge ── */}
      <View style={styles.topRow}>
        <CategoryBadge category={task.category} size="sm" />
        <View style={styles.hoursBadge}>
          <Text style={styles.hoursText}>⏱ {hours}h</Text>
        </View>
      </View>

      {/* ── Title & description ── */}
      <Text style={styles.title} numberOfLines={2}>{task.title}</Text>
      <Text style={styles.desc} numberOfLines={2}>{task.description}</Text>

      {/* ── Footer: requester + distance ── */}
      <View style={styles.footer}>
        <RequesterPill type={task.creatorType} />
        {typeof distanceKm === 'number' && (
          <View style={styles.distanceChip}>
            <Text style={styles.distanceText}>📍 {distanceKm.toFixed(1)} km</Text>
          </View>
        )}
      </View>

      {/* ── CTA button ── */}
      {actionText && onPressAction && (
        <TouchableOpacity
          style={[styles.btn, actionLoading && styles.btnDisabled]}
          onPress={onPressAction}
          disabled={actionLoading}
          activeOpacity={0.85}
        >
          <Text style={styles.btnText}>{actionLoading ? 'Accepting…' : actionText}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: PALETTE.white,
    borderRadius: RADIUS.xl,
    padding: 18,
    ...SHADOW_MD,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  hoursBadge: {
    backgroundColor: PALETTE.blue100,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  hoursText: {
    fontSize: 12,
    fontWeight: '700',
    color: PALETTE.blue700,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: PALETTE.slate900,
    fontFamily: 'SpaceGrotesk_700Bold',
    marginBottom: 5,
  },
  desc: {
    fontSize: 13,
    color: PALETTE.slate500,
    lineHeight: 19,
    fontFamily: 'SpaceGrotesk_400Regular',
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  pill: {
    borderRadius: RADIUS.sm,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'SpaceGrotesk_500Medium',
  },
  distanceChip: {
    backgroundColor: PALETTE.slate100,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  distanceText: {
    fontSize: 11,
    color: PALETTE.slate600,
    fontFamily: 'SpaceGrotesk_500Medium',
  },
  btn: {
    backgroundColor: PALETTE.blue500,
    borderRadius: RADIUS.md,
    paddingVertical: 13,
    alignItems: 'center',
  },
  btnDisabled: {
    backgroundColor: PALETTE.blue400,
  },
  btnText: {
    fontSize: 15,
    fontWeight: '700',
    color: PALETTE.white,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
});
