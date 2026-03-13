import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import { useCreatorTasks, useHelperTasks } from '../hooks/useTasks';
import { RatingStars } from '../components/RatingStars';
import { completeTaskWithRating, deleteCreatedTask } from '../services/taskService';
import { Task } from '../firebase/types';

type TabKey = 'created' | 'active' | 'history';

const DIFFICULTY_COLORS: Record<string, { bg: string; text: string }> = {
  Easy:   { bg: '#BBF7D0', text: '#065F46' },
  Medium: { bg: '#FDE68A', text: '#92400E' },
  Hard:   { bg: '#FECACA', text: '#7F1D1D' },
};

const CREDIT_PCT: Record<number, string> = { 5: '100%', 4: '88%', 3: '75%', 2: '63%', 1: '50%' };

export const TasksScreen = () => {
  const { firebaseUser } = useAuth();
  const creatorTasks = useCreatorTasks(firebaseUser?.uid);
  const helperTasks  = useHelperTasks(firebaseUser?.uid);

  const [activeTab,     setActiveTab]     = useState<TabKey>('created');
  const [selectedTask,  setSelectedTask]  = useState<Task | null>(null);
  const [rating,        setRating]        = useState(5);
  const [submitting,    setSubmitting]    = useState(false);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  const createdOpen     = useMemo(() => creatorTasks.filter((t) => t.status === 'open'), [creatorTasks]);
  const createdAccepted = useMemo(() => creatorTasks.filter((t) => t.status === 'accepted' && !!t.helperId), [creatorTasks]);
  const activeTasks     = useMemo(() => helperTasks.filter((t) => t.status === 'accepted'), [helperTasks]);
  const historyHelper   = useMemo(() => helperTasks.filter((t) => t.status === 'completed'), [helperTasks]);
  const historyCreated  = useMemo(() => creatorTasks.filter((t) => t.status === 'completed'), [creatorTasks]);

  const tabCounts: Record<TabKey, number> = {
    created: createdOpen.length + createdAccepted.length,
    active:  activeTasks.length,
    history: historyHelper.length + historyCreated.length,
  };

  const onCompleteTask = async () => {
    if (!selectedTask) return;
    try {
      setSubmitting(true);
      await completeTaskWithRating(selectedTask.id, rating);
      setSelectedTask(null);
      setRating(5);
      Alert.alert('Task completed!', 'Helper was rated and credits were applied.');
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

  const DiffBadge = ({ difficulty }: { difficulty: string }) => {
    const c = DIFFICULTY_COLORS[difficulty] ?? { bg: '#F1F5F9', text: '#334155' };
    return (
      <View style={[styles.badge, { backgroundColor: c.bg }]}>
        <Text style={[styles.badgeText, { color: c.text }]}>{difficulty}</Text>
      </View>
    );
  };

  const StatusBadge = ({ label, bg, color }: { label: string; bg: string; color: string }) => (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );

  const renderCreatedCard = (task: Task) => (
    <View key={task.id} style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.badgeRow}>
          <DiffBadge difficulty={task.difficulty} />
          {task.status === 'open'
            ? <StatusBadge label="Open"     bg="#EFF6FF" color="#1D4ED8" />
            : <StatusBadge label="Someone's on it!" bg="#FFF7ED" color="#C2410C" />}
        </View>
        <Text style={styles.creditsLabel}>💰 {task.credits} cr</Text>
      </View>
      <Text style={styles.cardTitle}>{task.title}</Text>
      <Text style={styles.cardDesc} numberOfLines={2}>{task.description}</Text>
      {task.status === 'open' && (
        <TouchableOpacity
          style={styles.btnDelete}
          onPress={() => confirmDeleteTask(task)}
          disabled={deletingTaskId === task.id}
        >
          <Text style={styles.btnDeleteText}>
            {deletingTaskId === task.id ? 'Deleting…' : '🗑  Delete Task'}
          </Text>
        </TouchableOpacity>
      )}
      {task.status === 'accepted' && (
        <TouchableOpacity style={styles.btnRate} onPress={() => setSelectedTask(task)}>
          <Text style={styles.btnRateText}>⭐  Rate & Complete</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderActiveCard = (task: Task) => (
    <View key={task.id} style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.badgeRow}>
          <DiffBadge difficulty={task.difficulty} />
          <StatusBadge label="In Progress" bg="#FFF7ED" color="#C2410C" />
        </View>
        <Text style={styles.creditsLabel}>💰 {task.credits} cr</Text>
      </View>
      <Text style={styles.cardTitle}>{task.title}</Text>
      <Text style={styles.cardDesc} numberOfLines={2}>{task.description}</Text>
      <Text style={styles.metaText}>
        Accepted {task.acceptedAt ? new Date(task.acceptedAt).toLocaleDateString() : '—'}
      </Text>
    </View>
  );

  const renderHistoryCard = (task: Task, isHelper: boolean) => (
    <View key={`${isHelper ? 'h' : 'c'}-${task.id}`} style={[styles.card, styles.cardHistory]}>
      <View style={styles.cardHeader}>
        <View style={styles.badgeRow}>
          <DiffBadge difficulty={task.difficulty} />
          <StatusBadge
            label={isHelper ? 'Helped' : 'Posted'}
            bg={isHelper ? '#EFF6FF' : '#F5F3FF'}
            color={isHelper ? '#1D4ED8' : '#6D28D9'}
          />
        </View>
        <Text style={[styles.creditsLabel, isHelper && styles.creditsGreen]}>
          {isHelper && task.earnedCredits !== undefined ? `+${task.earnedCredits} cr` : `${task.credits} cr`}
        </Text>
      </View>
      <Text style={styles.cardTitle}>{task.title}</Text>
      {isHelper && typeof task.rating === 'number' && (
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((s) => (
            <Text key={s} style={[styles.starChar, s <= task.rating! ? styles.starOn : styles.starOff]}>★</Text>
          ))}
          <Text style={styles.ratingVal}>{task.rating}/5</Text>
        </View>
      )}
      <Text style={styles.metaText}>
        Completed {task.completedAt ? new Date(task.completedAt).toLocaleDateString() : '—'}
      </Text>
    </View>
  );

  const EmptyState = ({ icon, title, sub }: { icon: string; title: string; sub: string }) => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>{icon}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySub}>{sub}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Tasks</Text>
        <Text style={styles.headerSub}>Manage everything in one place</Text>
      </View>

      {/* ── Tab bar ── */}
      <View style={styles.tabBar}>
        {([ 'created', 'active', 'history' ] as TabKey[]).map((tab) => {
          const isActive = activeTab === tab;
          const icon  = tab === 'created' ? '✏️' : tab === 'active' ? '⚡' : '🏅';
          const label = tab === 'created' ? 'Created' : tab === 'active' ? 'Active' : 'History';
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
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

      {/* ── Content ── */}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>

        {activeTab === 'created' && (
          <>
            {createdOpen.length === 0 && createdAccepted.length === 0 && (
              <EmptyState icon="📋" title="No created tasks" sub="Post a task and let volunteers help you!" />
            )}
            {createdAccepted.length > 0 && (
              <>
                <Text style={styles.groupLabel}>AWAITING YOUR RATING</Text>
                {createdAccepted.map(renderCreatedCard)}
              </>
            )}
            {createdOpen.length > 0 && (
              <>
                <Text style={styles.groupLabel}>OPEN REQUESTS</Text>
                {createdOpen.map(renderCreatedCard)}
              </>
            )}
          </>
        )}

        {activeTab === 'active' && (
          activeTasks.length === 0
            ? <EmptyState icon="⚡" title="No active tasks" sub="Browse the map and accept a task to help someone!" />
            : activeTasks.map(renderActiveCard)
        )}

        {activeTab === 'history' && (
          historyHelper.length === 0 && historyCreated.length === 0
            ? <EmptyState icon="🏅" title="No history yet" sub="Completed tasks will appear here." />
            : <>
                {historyHelper.length > 0 && (
                  <>
                    <Text style={styles.groupLabel}>TASKS YOU HELPED WITH</Text>
                    {historyHelper.map((t) => renderHistoryCard(t, true))}
                  </>
                )}
                {historyCreated.length > 0 && (
                  <>
                    <Text style={styles.groupLabel}>TASKS YOU POSTED</Text>
                    {historyCreated.map((t) => renderHistoryCard(t, false))}
                  </>
                )}
              </>
        )}

      </ScrollView>

      {/* ── Rating bottom sheet ── */}
      {selectedTask && (
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.overlayBg} onPress={() => setSelectedTask(null)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Rate the Helper</Text>
            <Text style={styles.sheetTask}>{selectedTask.title}</Text>
            <View style={styles.sheetStars}>
              <RatingStars value={rating} onChange={setRating} size={40} />
            </View>
            <Text style={styles.sheetHint}>
              {CREDIT_PCT[rating] ?? '—'} of credits will be awarded
            </Text>
            <Button
              mode="contained"
              style={styles.sheetSubmit}
              contentStyle={{ paddingVertical: 6 }}
              onPress={onCompleteTask}
              loading={submitting}
              disabled={submitting}
            >
              Submit Rating
            </Button>
            <Button mode="text" onPress={() => setSelectedTask(null)}>
              Cancel
            </Button>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAFBFC' },

  // Header
  header:      { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 14 },
  headerTitle: { fontSize: 30, fontWeight: '700', color: '#0F172A', fontFamily: 'SpaceGrotesk_700Bold' },
  headerSub:   { fontSize: 14, color: '#0A84FF', marginTop: 3, fontFamily: 'SpaceGrotesk_500Medium' },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: '#E8F0FE',
    borderRadius: 16,
    padding: 4,
    marginBottom: 18,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 12,
    gap: 4,
  },
  tabActive: {
    backgroundColor: '#0A84FF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 4,
  },
  tabIcon:          { fontSize: 16 },
  tabLabel:         { fontSize: 13, color: '#4A6FA5', fontFamily: 'SpaceGrotesk_500Medium' },
  tabLabelActive:   { color: '#FFFFFF' },
  tabPill: {
    backgroundColor: 'rgba(10,132,255,0.15)',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  tabPillActive:     { backgroundColor: 'rgba(255,255,255,0.30)' },
  tabPillText:       { fontSize: 10, color: '#0A84FF', fontFamily: 'SpaceGrotesk_500Medium' },
  tabPillTextActive: { color: '#FFFFFF' },

  // Scroll
  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 48 },

  // Group label
  groupLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0A84FF',
    letterSpacing: 1.1,
    marginBottom: 12,
    marginTop: 2,
    fontFamily: 'SpaceGrotesk_500Medium',
  },

  // Task card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 4,
  },
  cardHistory: {},
  cardHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  badgeRow:    { flexDirection: 'row', gap: 6 },
  badge:       { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText:   { fontSize: 12, fontWeight: '700', fontFamily: 'SpaceGrotesk_500Medium' },
  creditsLabel:  { fontSize: 15, fontWeight: '700', color: '#0A84FF', fontFamily: 'SpaceGrotesk_700Bold' },
  creditsGreen:  { color: '#059669' },
  cardTitle:   { fontSize: 18, fontWeight: '700', color: '#0F172A', marginBottom: 6, fontFamily: 'SpaceGrotesk_700Bold' },
  cardDesc:    { fontSize: 14, color: '#475569', lineHeight: 21, fontFamily: 'SpaceGrotesk_400Regular' },
  metaText:    { fontSize: 13, color: '#64748B', marginTop: 8, fontFamily: 'SpaceGrotesk_400Regular' },

  // Stars row (history)
  starsRow:   { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 2 },
  starChar:   { fontSize: 20 },
  starOn:     { color: '#F59E0B' },
  starOff:    { color: '#CBD5E1' },
  ratingVal:  { fontSize: 13, color: '#64748B', marginLeft: 6, fontFamily: 'SpaceGrotesk_500Medium' },

  // Buttons inside cards
  btnDelete: {
    marginTop: 14,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
    alignSelf: 'flex-start',
  },
  btnDeleteText: { fontSize: 14, color: '#DC2626', fontWeight: '700', fontFamily: 'SpaceGrotesk_500Medium' },
  btnRate: {
    marginTop: 14,
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 14,
    backgroundColor: '#0A84FF',
    alignSelf: 'flex-start',
  },
  btnRateText: { fontSize: 15, color: '#FFFFFF', fontWeight: '700', fontFamily: 'SpaceGrotesk_700Bold' },

  // Empty state
  emptyState: { alignItems: 'center', paddingVertical: 64 },
  emptyIcon:  { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#0F172A', fontFamily: 'SpaceGrotesk_700Bold', marginBottom: 8 },
  emptySub:   { fontSize: 15, color: '#64748B', textAlign: 'center', fontFamily: 'SpaceGrotesk_400Regular', paddingHorizontal: 20 },

  // Rating sheet / overlay
  overlay:   { position: 'absolute', inset: 0, justifyContent: 'flex-end' },
  overlayBg: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,23,42,0.45)' },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 28,
    paddingBottom: 44,
    alignItems: 'center',
  },
  sheetHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0', marginBottom: 22 },
  sheetTitle:  { fontSize: 22, fontWeight: '700', color: '#0F172A', fontFamily: 'SpaceGrotesk_700Bold', marginBottom: 4 },
  sheetTask:   { fontSize: 14, color: '#64748B', fontFamily: 'SpaceGrotesk_400Regular', marginBottom: 24, textAlign: 'center' },
  sheetStars:  { marginBottom: 10 },
  sheetHint:   { fontSize: 13, color: '#64748B', marginBottom: 24, fontFamily: 'SpaceGrotesk_400Regular' },
  sheetSubmit: { width: '100%', borderRadius: 14, marginBottom: 6 },
});