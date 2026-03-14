import React, { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Divider, IconButton, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { addUserCredits, subscribeAllTasks, subscribeAllUsers, deleteTaskById, setUserBanStatus } from '../services/adminService';
import { Task, UserProfile } from '../firebase/types';

export const AdminDashboardScreen = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [creditInputs, setCreditInputs] = useState<Record<string, string>>({});
  const [expandedCreditUserId, setExpandedCreditUserId] = useState<string | null>(null);
  const [submittingCreditUserId, setSubmittingCreditUserId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribeUsers = subscribeAllUsers(setUsers);
    const unsubscribeTasks = subscribeAllTasks(setTasks);

    return () => {
      unsubscribeUsers();
      unsubscribeTasks();
    };
  }, []);

  const analytics = useMemo(() => {
    const completedTasks = tasks.filter((task) => task.status === 'completed').length;
    const totalUsers = users.length;

    return {
      totalTasks: tasks.length,
      completedTasks,
      totalUsers,
    };
  }, [tasks, users]);

  const filteredUsers = useMemo(() => {
    const query = userSearch.trim().toLowerCase();
    if (!query) {
      return users;
    }

    return users.filter((user) => user.name.toLowerCase().includes(query));
  }, [users, userSearch]);

  const onDeleteTask = async (taskId: string) => {
    try {
      await deleteTaskById(taskId);
    } catch (e) {
      Alert.alert('Delete failed', e instanceof Error ? e.message : 'Try again later.');
    }
  };

  const toggleBan = async (user: UserProfile) => {
    try {
      await setUserBanStatus(user.id, !user.banned);
    } catch (e) {
      Alert.alert('Update failed', e instanceof Error ? e.message : 'Try again later.');
    }
  };

  const onAddCredits = async (user: UserProfile) => {
    if (submittingCreditUserId === user.id) {
      return;
    }

    const rawValue = creditInputs[user.id] ?? '';
    const amount = Number(rawValue);

    if (!Number.isFinite(amount) || amount <= 0 || amount > 50) {
      Alert.alert('Invalid amount', 'Enter a number greater than 0 and up to 50.');
      return;
    }

    try {
      setSubmittingCreditUserId(user.id);
      await addUserCredits(user.id, amount);
      setCreditInputs((current) => ({ ...current, [user.id]: '' }));
      setExpandedCreditUserId(null);
      Alert.alert('Credits added', `${amount} credits were added to ${user.name}.`);
    } catch (e) {
      Alert.alert('Add credits failed', e instanceof Error ? e.message : 'Try again later.');
    } finally {
      setSubmittingCreditUserId(null);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        <Text variant="headlineSmall">Admin Dashboard</Text>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium">Analytics</Text>
            <Text>Total tasks: {analytics.totalTasks}</Text>
            <Text>Completed tasks: {analytics.completedTasks}</Text>
            <Text>Number of users: {analytics.totalUsers}</Text>
          </Card.Content>
        </Card>

        <Text variant="titleMedium" style={styles.sectionTitle}>
          Users
        </Text>
        <TextInput
          mode="outlined"
          value={userSearch}
          onChangeText={setUserSearch}
          placeholder="Search users by name"
          style={styles.searchInput}
        />
        <View style={styles.usersPanel}>
          <ScrollView nestedScrollEnabled showsVerticalScrollIndicator>
            {filteredUsers.map((user) => (
              <Card key={user.id} style={[styles.card, styles.userCard]} mode="contained">
                <Card.Content>
                  <View style={styles.userHeaderRow}>
                    <View style={styles.userInfoBlock}>
                      <Text variant="titleSmall">{user.name}</Text>
                      <Text>{user.email}</Text>
                    </View>
                    <IconButton
                      icon={expandedCreditUserId === user.id ? 'close' : 'plus'}
                      size={20}
                      onPress={() =>
                        setExpandedCreditUserId((current) => (current === user.id ? null : user.id))
                      }
                      style={styles.plusButton}
                      accessibilityLabel="Open add credits"
                      disabled={submittingCreditUserId === user.id}
                    />
                  </View>
                  <Text>
                    {user.role} • credits: {user.credits} • streak: {user.dailyStreak}
                  </Text>
                  <Button mode="outlined" onPress={() => toggleBan(user)} style={styles.action}>
                    {user.banned ? 'Unban User' : 'Ban User'}
                  </Button>
                  {expandedCreditUserId === user.id ? (
                    <View style={styles.creditMenu}>
                      <Text variant="labelLarge">Add credits</Text>
                      <View style={styles.creditRow}>
                        <TextInput
                          mode="outlined"
                          value={creditInputs[user.id] ?? ''}
                          onChangeText={(value) => setCreditInputs((current) => ({ ...current, [user.id]: value }))}
                          keyboardType="decimal-pad"
                          placeholder="1-50"
                          style={styles.creditInput}
                          outlineStyle={styles.creditInputOutline}
                        />
                        <Button
                          mode="contained"
                          compact
                          onPress={() => onAddCredits(user)}
                          style={styles.creditAddButton}
                          loading={submittingCreditUserId === user.id}
                          disabled={submittingCreditUserId === user.id}
                        >
                          Add
                        </Button>
                      </View>
                    </View>
                  ) : null}
                </Card.Content>
              </Card>
            ))}
            {filteredUsers.length === 0 ? (
              <Text style={styles.noUsersText}>No users found.</Text>
            ) : null}
          </ScrollView>
        </View>

        <Divider style={styles.divider} />

        <Text variant="titleMedium" style={styles.sectionTitle}>
          Tasks
        </Text>
        {tasks.map((task) => (
          <Card key={task.id} style={styles.card}>
            <Card.Content>
              <Text variant="titleSmall">{task.title}</Text>
              <Text>
                {task.status} • {task.credits} h
              </Text>
              <Button mode="outlined" onPress={() => onDeleteTask(task.id)} style={styles.action}>
                Delete Task
              </Button>
            </Card.Content>
          </Card>
        ))}
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
  sectionTitle: {
    marginTop: 16,
    marginBottom: 8,
  },
  card: {
    borderRadius: 16,
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
  },
  userCard: {
    elevation: 0,
    shadowOpacity: 0,
    borderWidth: 1,
    borderColor: '#E6ECF3',
  },
  searchInput: {
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  usersPanel: {
    maxHeight: 520,
  },
  noUsersText: {
    color: '#667084',
    marginVertical: 8,
  },
  action: {
    marginTop: 10,
  },
  userHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userInfoBlock: {
    flex: 1,
    paddingRight: 8,
  },
  plusButton: {
    margin: 0,
  },
  creditMenu: {
    marginTop: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5ECF4',
    backgroundColor: '#F8FBFF',
    padding: 10,
  },
  creditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  creditInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#FFFFFF',
  },
  creditInputOutline: {
    borderRadius: 12,
  },
  creditAddButton: {
    marginLeft: 8,
    borderRadius: 10,
  },
  divider: {
    marginVertical: 10,
  },
});
