import React, { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useAuth } from '../hooks/useAuth';
import { useCreatorTasks, useHelperTasks } from '../hooks/useTasks';
import { RatingStars } from '../components/RatingStars';
import { CategoryBadge } from '../components/CategoryBadge';
import { FilterChipRow } from '../components/FilterChipRow';
import { RequesterTypeFilterRow } from '../components/RequesterTypeFilterRow';
import { StreakBadge } from '../components/StreakBadge';
import { submitTaskRating, deleteCreatedTask } from '../services/taskService';
import { getUserProfile } from '../services/authService';
import { Task, RequesterType, getTaskHours } from '../firebase/types';
import { PALETTE, RADIUS, REQUESTER_COLORS, SHADOW_MD, SHADOW_SM, TaskCategory } from '../utils/theme';
import { formatHours, formatLocationDetails, formatReverseGeocodedLocation } from '../utils/format';

type TabKey = 'created' | 'active' | 'history';

const RequesterPill = ({ type, name }: { type?: string; name?: string }) => {
  const key = (type ?? 'general') as keyof typeof REQUESTER_COLORS;
  const c = REQUESTER_COLORS[key] ?? REQUESTER_COLORS.general;
  return (
    <View style={[pill.root, { backgroundColor: c.bg, flexDirection: 'row', alignItems: 'center', gap: 4 }]}>
      <Text style={[pill.text, { color: c.text }]}>{c.label}</Text>
      {name && <Text style={[pill.name, { color: c.text }]}>•  {name}</Text>}
    </View>
  );
};
const pill = StyleSheet.create({
  root: { borderRadius: RADIUS.sm, paddingHorizontal: 9, paddingVertical: 4 },
  text: { fontSize: 11, fontWeight: '700', fontFamily: 'SpaceGrotesk_500Medium' },
  name: { fontSize: 11, fontFamily: 'SpaceGrotesk_400Regular', opacity: 0.8 },
});

const StatusPill = ({ label, bg, color }: { label: string; bg: string; color: string }) => (
  <View style={[pill.root, { backgroundColor: bg }]}>
    <Text style={[pill.text, { color }]}>{label}</Text>
  </View>
);

// ─── Main screen ───────────────────────────────────────────────────────────────
export const TasksScreen = () => {
  const { firebaseUser, profile } = useAuth();
  const creatorTasks = useCreatorTasks(firebaseUser?.uid);
  const helperTasks  = useHelperTasks(firebaseUser?.uid);

  const [activeTab,      setActiveTab]      = useState<TabKey>('created');
  const [selectedTask,   setSelectedTask]   = useState<Task | null>(null);
  const [rating,         setRating]         = useState(5);
  const [submitting,     setSubmitting]     = useState(false);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<TaskCategory | null>(null);
  const [requesterTypeFilter, setRequesterTypeFilter] = useState<RequesterType | null>(null);
  const [helperNamesById, setHelperNamesById] = useState<Record<string, string>>({});
  const [taskAddresses, setTaskAddresses] = useState<Record<string, string>>({});

  // ── Task buckets ─────────────────────────────────────────────────────────────
  const createdOpen     = useMemo(() => creatorTasks.filter((t) => t.status === 'open'),                       [creatorTasks]);
  const createdAccepted = useMemo(() => creatorTasks.filter((t) => t.status === 'accepted' && !!t.helperId),   [creatorTasks]);
  const activeTasks     = useMemo(() => helperTasks.filter((t) => t.status === 'accepted'),                    [helperTasks]);
  const historyHelper   = useMemo(() => helperTasks.filter((t) => t.status === 'completed'),                   [helperTasks]);
  const historyCreated  = useMemo(() => creatorTasks.filter((t) => t.status === 'completed'),                  [creatorTasks]);

  useEffect(() => {
    let cancelled = false;

    const missingHelperIds = Array.from(
      new Set(
        createdAccepted
          .map((task) => task.helperId)
          .filter((helperId): helperId is string => Boolean(helperId))
          .filter((helperId) => !helperNamesById[helperId] && !createdAccepted.some((task) => task.helperId === helperId && !!task.helperName))
      )
    );

    if (missingHelperIds.length === 0) {
      return;
    }

    const loadHelperNames = async () => {
      const entries = await Promise.all(
        missingHelperIds.map(async (helperId) => {
          try {
            const helperProfile = await getUserProfile(helperId);
            return [helperId, helperProfile?.name ?? 'Volunteer'] as const;
          } catch {
            return [helperId, 'Volunteer'] as const;
          }
        })
      );

      if (cancelled) {
        return;
      }

      setHelperNamesById((current) => ({
        ...current,
        ...Object.fromEntries(entries),
      }));
    };

    void loadHelperNames();

    return () => {
      cancelled = true;
    };
  }, [createdAccepted, helperNamesById]);

  useEffect(() => {
    let cancelled = false;

    const acceptedTasks = [...createdAccepted, ...activeTasks];
    const missingAddresses = acceptedTasks.filter(
      (task) => !formatLocationDetails(task.locationDetails) && !taskAddresses[task.id]
    );

    if (missingAddresses.length === 0) {
      return;
    }

    const loadAddresses = async () => {
      const entries = await Promise.all(
        missingAddresses.map(async (task) => {
          try {
            const [details] = await Location.reverseGeocodeAsync(task.location);
            return [task.id, formatReverseGeocodedLocation(details) ?? ''] as const;
          } catch {
            return [task.id, ''] as const;
          }
        })
      );

      if (cancelled) {
        return;
      }

      setTaskAddresses((current) => ({
        ...current,
        ...Object.fromEntries(entries.filter(([, value]) => value)),
      }));
    };

    void loadAddresses();

    return () => {
      cancelled = true;
    };
  }, [activeTasks, createdAccepted, taskAddresses]);

  const applyFilter = (tc: Task[]) => {
    let res = tc;
    if (categoryFilter) res = res.filter((t) => t.category === categoryFilter);
    if (requesterTypeFilter) res = res.filter((t) => t.creatorType === requesterTypeFilter);
    return res;
  };

  const tabCounts: Record<TabKey, number> = {
    created: createdOpen.length + createdAccepted.length,
    active:  activeTasks.length,
    history: historyHelper.length + historyCreated.length,
  };

  // ── Actions ──────────────────────────────────────────────────────────────────
  const onCompleteTask = async () => {
    if (!selectedTask) return;
    try {
      setSubmitting(true);
      await submitTaskRating(selectedTask.id, rating);
      setSelectedTask(null);
      setRating(5);
      Alert.alert('✅ Task completed!', 'The volunteer has been rated and received the full task hours.');
    } catch (e) {
      Alert.alert('Could not complete task', e instanceof Error ? e.message : 'Try again later.');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDeleteTask = (task: Task) => {
    Alert.alert('Delete task', `Delete "${task.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { void onDeleteTask(task); } },
    ]);
  };

  const onDeleteTask = async (task: Task) => {
    try {
      setDeletingTaskId(task.id);
      await deleteCreatedTask(task.id);
    } catch (e) {
      Alert.alert('Could not delete task', e instanceof Error ? e.message : 'Try again later.');
    } finally {
      setDeletingTaskId(null);
    }
  };

  // ─── Card renderers ──────────────────────────────────────────────────────────
  const renderCreatedCard = (task: Task) => {
    const hours = getTaskHours(task);
    const isAccepted = task.status === 'accepted';
    const acceptedByName = task.helperName ?? (task.helperId ? helperNamesById[task.helperId] : undefined);
    const acceptedByLabel = isAccepted
      ? acceptedByName
        ? `🙋 Accepted by ${acceptedByName}`
        : '🙋 Accepted by a volunteer'
      : null;
    const locationText = formatLocationDetails(task.locationDetails) ?? taskAddresses[task.id] ?? null;

    return (
      <View key={task.id} style={styles.card}>
        {/* top row */}
        <View style={styles.cardTop}>
          <CategoryBadge category={task.category} size="sm" />
          <View style={styles.cardTopRight}>
            <View style={styles.hoursBadge}>
              <Text style={styles.hoursText}>⏱ {formatHours(hours)}h</Text>
            </View>
            <StatusPill
              label={isAccepted ? "Someone's on it!" : 'Open'}
              bg={isAccepted ? PALETTE.orange100 : PALETTE.blue100}
              color={isAccepted ? PALETTE.orange600 : PALETTE.blue700}
            />
          </View>
        </View>

        <Text style={styles.cardTitle}>{task.title}</Text>
        <Text style={styles.cardDesc} numberOfLines={2}>{task.description}</Text>

        {isAccepted && (acceptedByLabel || locationText) ? (
          <View style={styles.contactStrip}>
            {acceptedByLabel ? <Text style={styles.contactText}>{acceptedByLabel}</Text> : null}
            {locationText ? <Text style={styles.contactText}>📍 {locationText}</Text> : null}
          </View>
        ) : null}

        <View style={styles.cardFooter}>
          <RequesterPill type={task.creatorType} name={
            task.creatorName || (task.requesterDetails && 'organizationName' in task.requesterDetails ? task.requesterDetails.organizationName : undefined)
          } />
          {task.createdAt ? (
            <Text style={styles.metaText}>
              {new Date(task.createdAt).toLocaleDateString()}
            </Text>
          ) : null}
        </View>

        {/* Actions */}
        {task.status === 'open' && (
          <TouchableOpacity
            style={styles.btnDelete}
            onPress={() => confirmDeleteTask(task)}
            disabled={deletingTaskId === task.id}
            activeOpacity={0.8}
          >
            <Text style={styles.btnDeleteText}>
              {deletingTaskId === task.id ? 'Deleting…' : '🗑  Delete Task'}
            </Text>
          </TouchableOpacity>
        )}
        {task.status === 'accepted' && (
          <TouchableOpacity
            style={styles.btnRate}
            onPress={() => { setSelectedTask(task); setRating(5); }}
            activeOpacity={0.85}
          >
            <Text style={styles.btnRateText}>⭐  Rate & Complete</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderActiveCard = (task: Task) => {
    const hours = getTaskHours(task);
    const daysSince = task.acceptedAt
      ? Math.floor((Date.now() - task.acceptedAt) / 86_400_000)
      : null;
    const locationText = formatLocationDetails(task.locationDetails) ?? taskAddresses[task.id] ?? null;

    // physical contact info
    const rd = task.requesterDetails as any;
    const hasPhone = rd?.contactPhone;
    const hasOrg   = rd?.organizationName;

    return (
      <View key={task.id} style={[styles.card, styles.cardActive]}>
        <View style={styles.cardTop}>
          <CategoryBadge category={task.category} size="sm" />
          <View style={styles.hoursBadge}>
            <Text style={styles.hoursText}>⏱ {formatHours(hours)}h</Text>
          </View>
        </View>
        <Text style={styles.cardTitle}>{task.title}</Text>
        <Text style={styles.cardDesc} numberOfLines={2}>{task.description}</Text>

        {/* Contact strip */}
        {(locationText || hasPhone || hasOrg) && (
          <View style={styles.contactStrip}>
            {locationText && <Text style={styles.contactText}>📍 {locationText}</Text>}
            {hasPhone && <Text style={styles.contactText}>📞 {rd.contactPhone}</Text>}
            {hasOrg   && <Text style={styles.contactText}>🏢 {rd.organizationName}</Text>}
          </View>
        )}

        <View style={styles.cardFooter}>
          <StatusPill label="In Progress" bg={PALETTE.orange100} color={PALETTE.orange600} />
          {daysSince !== null && (
            <Text style={styles.metaText}>
              {daysSince === 0 ? 'Accepted today' : `Accepted ${daysSince}d ago`}
            </Text>
          )}
        </View>
      </View>
    );
  };

  const renderHistoryCard = (task: Task, isHelper: boolean) => {
    const hours     = getTaskHours(task);
    const earned    = task.earnedHours ?? task.earnedCredits;
    const displayH  = isHelper && earned !== undefined ? earned : hours;

    return (
      <View key={`${isHelper ? 'h' : 'c'}-${task.id}`} style={[styles.card, styles.cardHistory]}>
        <View style={styles.cardTop}>
          <CategoryBadge category={task.category} size="sm" />
          <View style={[
            styles.hoursBadge,
            isHelper && earned !== undefined && styles.hoursBadgeEarned,
          ]}>
            <Text style={[styles.hoursText, isHelper && earned !== undefined && styles.hoursTextEarned]}>
              {isHelper && earned !== undefined ? `+${formatHours(displayH)}h earned` : `${formatHours(displayH)}h`}
            </Text>
          </View>
        </View>

        <Text style={styles.cardTitle}>{task.title}</Text>

        {/* Rating stars (for helpers) */}
        {isHelper && typeof task.rating === 'number' && (
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((s) => (
              <Text key={s} style={s <= task.rating! ? styles.starOn : styles.starOff}>★</Text>
            ))}
            <Text style={styles.ratingVal}>{task.rating}/5</Text>
          </View>
        )}

        <View style={styles.cardFooter}>
          <StatusPill
            label={isHelper ? 'Helped' : 'Posted'}
            bg={isHelper ? PALETTE.blue100 : PALETTE.purple100}
            color={isHelper ? PALETTE.blue700 : '#6D28D9'}
          />
          {task.completedAt && (
            <Text style={styles.metaText}>{new Date(task.completedAt).toLocaleDateString()}</Text>
          )}
        </View>
      </View>
    );
  };

  const EmptyState = ({ icon, title, sub }: { icon: string; title: string; sub: string }) => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>{icon}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySub}>{sub}</Text>
    </View>
  );

  const showFilter = activeTab === 'created' || activeTab === 'history';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Your Tasks</Text>
            <Text style={styles.headerSub}>
              {formatHours(profile?.credits ?? 0)} volunteer hours accumulated
            </Text>
          </View>
          <StreakBadge streak={profile?.dailyStreak ?? 0} />
        </View>
      </View>

      {/* ── Tab bar ── */}
      <View style={styles.tabBar}>
        {(['created', 'active', 'history'] as TabKey[]).map((tab) => {
          const isActive = activeTab === tab;
          const icon  = tab === 'created' ? '✏️' : tab === 'active' ? '⚡' : '🏅';
          const label = tab === 'created' ? 'Created' : tab === 'active' ? 'Active' : 'History';
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => { setActiveTab(tab); setCategoryFilter(null); setRequesterTypeFilter(null); }}
            >
              <Text style={styles.tabIcon}>{icon}</Text>
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{label}</Text>
              {tabCounts[tab] > 0 && (
                <View style={[styles.tabPill, isActive && styles.tabPillActive]}>
                  <Text style={[styles.tabPillText, isActive && styles.tabPillTextActive]}>
                    {tabCounts[tab]}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Category & Type filters (not on Active tab) ── */}
      {showFilter && (
        <View style={{ paddingBottom: 8 }}>
          <FilterChipRow selected={categoryFilter} onSelect={setCategoryFilter} />
          <View style={{ marginTop: -4 }}>
            <RequesterTypeFilterRow selected={requesterTypeFilter} onSelect={setRequesterTypeFilter} />
          </View>
        </View>
      )}

      {/* ── Content ── */}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {activeTab === 'created' && (() => {
          const openFiltered     = applyFilter(createdOpen);
          const acceptedFiltered = applyFilter(createdAccepted);
          if (openFiltered.length === 0 && acceptedFiltered.length === 0)
            return <EmptyState icon="📋" title="No created tasks" sub="Post a task and let volunteers help you!" />;
          return (
            <>
              {acceptedFiltered.length > 0 && (
                <>
                  <Text style={styles.groupLabel}>AWAITING YOUR RATING</Text>
                  {acceptedFiltered.map(renderCreatedCard)}
                </>
              )}
              {openFiltered.length > 0 && (
                <>
                  <Text style={styles.groupLabel}>OPEN REQUESTS</Text>
                  {openFiltered.map(renderCreatedCard)}
                </>
              )}
            </>
          );
        })()}

        {activeTab === 'active' && (
          activeTasks.length === 0
            ? <EmptyState icon="⚡" title="No active tasks" sub="Browse the map and accept a task to help someone!" />
            : activeTasks.map(renderActiveCard)
        )}

        {activeTab === 'history' && (() => {
          const hHelper  = applyFilter(historyHelper);
          const hCreated = applyFilter(historyCreated);
          if (hHelper.length === 0 && hCreated.length === 0)
            return <EmptyState icon="🏅" title="No history yet" sub="Completed tasks will appear here." />;
          return (
            <>
              {hHelper.length > 0 && (
                <>
                  <Text style={styles.groupLabel}>TASKS YOU HELPED WITH</Text>
                  {hHelper.map((t) => renderHistoryCard(t, true))}
                </>
              )}
              {hCreated.length > 0 && (
                <>
                  <Text style={styles.groupLabel}>TASKS YOU POSTED</Text>
                  {hCreated.map((t) => renderHistoryCard(t, false))}
                </>
              )}
            </>
          );
        })()}

      </ScrollView>

      {/* ── Rating bottom sheet ── */}
      {selectedTask && (
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.overlayBg} onPress={() => setSelectedTask(null)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />

            <CategoryBadge category={selectedTask.category} />

            <Text style={styles.sheetTitle}>Rate the Volunteer</Text>
            <Text style={styles.sheetTask}>{selectedTask.title}</Text>

            <View style={styles.sheetStars}>
              <RatingStars value={rating} onChange={setRating} size={44} />
            </View>

            <View style={styles.sheetHintBox}>
              <Text style={styles.sheetHintLabel}>Hours to be awarded</Text>
              <Text style={styles.sheetHintValue}>
                {formatHours(getTaskHours(selectedTask))}h
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.sheetSubmit, submitting && styles.sheetSubmitDisabled]}
              onPress={onCompleteTask}
              disabled={submitting}
              activeOpacity={0.85}
            >
              <Text style={styles.sheetSubmitText}>{submitting ? 'Submitting…' : 'Submit Rating'}</Text>
            </TouchableOpacity>

            <Button mode="text" onPress={() => setSelectedTask(null)} textColor={PALETTE.slate500}>
              Cancel
            </Button>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: PALETTE.slate50 },

  // Header
  header:    { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle:{ fontSize: 30, fontWeight: '700', color: PALETTE.slate900, fontFamily: 'SpaceGrotesk_700Bold' },
  headerSub: { fontSize: 13, color: PALETTE.blue500, marginTop: 2, fontFamily: 'SpaceGrotesk_500Medium' },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: '#E8F0FE',
    borderRadius: RADIUS.lg,
    padding: 4,
    marginBottom: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    gap: 4,
  },
  tabActive: {
    backgroundColor: PALETTE.blue500,
    ...SHADOW_SM,
  },
  tabIcon:         { fontSize: 15 },
  tabLabel:        { fontSize: 12, color: '#4A6FA5', fontFamily: 'SpaceGrotesk_500Medium' },
  tabLabelActive:  { color: PALETTE.white },
  tabPill:         { backgroundColor: 'rgba(10,132,255,0.15)', borderRadius: 9, minWidth: 17, height: 17, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  tabPillActive:   { backgroundColor: 'rgba(255,255,255,0.30)' },
  tabPillText:     { fontSize: 10, color: PALETTE.blue500, fontFamily: 'SpaceGrotesk_500Medium' },
  tabPillTextActive:{ color: PALETTE.white },

  // Scroll
  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 48 },

  // Group label
  groupLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: PALETTE.blue500,
    letterSpacing: 1.1,
    marginBottom: 10,
    marginTop: 4,
    fontFamily: 'SpaceGrotesk_500Medium',
  },

  // Card base
  card: {
    backgroundColor: PALETTE.white,
    borderRadius: RADIUS.xl,
    padding: 16,
    marginBottom: 12,
    ...SHADOW_SM,
  },
  cardActive: {
    borderLeftWidth: 3,
    borderLeftColor: PALETTE.orange600,
  },
  cardHistory: {},

  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTopRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  hoursBadge: {
    backgroundColor: PALETTE.blue100,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  hoursBadgeEarned: {
    backgroundColor: PALETTE.green100,
  },
  hoursText: {
    fontSize: 11,
    fontWeight: '700',
    color: PALETTE.blue700,
    fontFamily: 'SpaceGrotesk_700Bold',
  },
  hoursTextEarned: {
    color: PALETTE.green700,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: PALETTE.slate900,
    fontFamily: 'SpaceGrotesk_700Bold',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 13,
    color: PALETTE.slate500,
    lineHeight: 19,
    fontFamily: 'SpaceGrotesk_400Regular',
    marginBottom: 10,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontSize: 12,
    color: PALETTE.slate400,
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  contactStrip: {
    backgroundColor: PALETTE.slate50,
    borderRadius: RADIUS.md,
    padding: 10,
    marginBottom: 10,
    gap: 3,
  },
  contactText: {
    fontSize: 13,
    color: PALETTE.slate700,
    fontFamily: 'SpaceGrotesk_500Medium',
  },

  // Stars (history)
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginBottom: 8,
  },
  starOn:    { fontSize: 18, color: PALETTE.amber500 },
  starOff:   { fontSize: 18, color: PALETTE.slate300 },
  ratingVal: { fontSize: 12, color: PALETTE.slate500, marginLeft: 4, fontFamily: 'SpaceGrotesk_500Medium' },

  // Action buttons in cards
  btnDelete: {
    marginTop: 12,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: PALETTE.red300,
    backgroundColor: PALETTE.red100,
    alignSelf: 'flex-start',
  },
  btnDeleteText: { fontSize: 13, color: PALETTE.red600, fontWeight: '700', fontFamily: 'SpaceGrotesk_500Medium' },
  btnRate: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: RADIUS.lg,
    backgroundColor: PALETTE.blue500,
    alignSelf: 'flex-start',
    ...SHADOW_SM,
  },
  btnRateText: { fontSize: 14, color: PALETTE.white, fontWeight: '700', fontFamily: 'SpaceGrotesk_700Bold' },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon:  { fontSize: 60, marginBottom: 14 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: PALETTE.slate900, fontFamily: 'SpaceGrotesk_700Bold', marginBottom: 8 },
  emptySub:   { fontSize: 14, color: PALETTE.slate500, textAlign: 'center', fontFamily: 'SpaceGrotesk_400Regular', paddingHorizontal: 24, lineHeight: 21 },

  // Purple (for history)
  purple100: { backgroundColor: '#F5F3FF' },

  // Rating sheet
  overlay:   { position: 'absolute', inset: 0, justifyContent: 'flex-end' },
  overlayBg: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,23,42,0.50)' },
  sheet: {
    backgroundColor: PALETTE.white,
    borderTopLeftRadius: RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    padding: 28,
    paddingBottom: 44,
    alignItems: 'center',
    gap: 6,
  },
  sheetHandle:  { width: 36, height: 4, borderRadius: 2, backgroundColor: PALETTE.slate200, marginBottom: 12 },
  sheetTitle:   { fontSize: 22, fontWeight: '700', color: PALETTE.slate900, fontFamily: 'SpaceGrotesk_700Bold' },
  sheetTask:    { fontSize: 13, color: PALETTE.slate500, fontFamily: 'SpaceGrotesk_400Regular', textAlign: 'center', paddingHorizontal: 16 },
  sheetStars:   { paddingVertical: 8 },
  sheetHintBox: {
    backgroundColor: PALETTE.blue100,
    borderRadius: RADIUS.lg,
    paddingHorizontal: 18,
    paddingVertical: 12,
    alignItems: 'center',
    width: '100%',
    marginBottom: 6,
  },
  sheetHintLabel:{ fontSize: 12, color: PALETTE.blue600, fontFamily: 'SpaceGrotesk_500Medium' },
  sheetHintValue:{ fontSize: 18, fontWeight: '700', color: PALETTE.blue700, fontFamily: 'SpaceGrotesk_700Bold', marginTop: 2 },
  sheetSubmit: {
    width: '100%',
    backgroundColor: PALETTE.blue500,
    borderRadius: RADIUS.lg,
    paddingVertical: 15,
    alignItems: 'center',
    ...SHADOW_MD,
  },
  sheetSubmitDisabled: { backgroundColor: PALETTE.blue400, shadowOpacity: 0, elevation: 0 },
  sheetSubmitText:     { fontSize: 16, fontWeight: '700', color: PALETTE.white, fontFamily: 'SpaceGrotesk_700Bold' },
});