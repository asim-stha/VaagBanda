import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Line, Polyline } from 'react-native-svg';
import { apiService, GroupSummary } from '../../services/apiService';

const COLORS = {
  CRIMSON: '#DC143C',
  CRIMSON_DARK: '#A01030',
  BLUE: '#1A2B5F',
  BLUE_DARK: '#0F1F4A',
  WHITE: '#FFFFFF',
  GHOST: '#F7F8FB',
  GRAY200: '#E1E5EE',
  GRAY400: '#9AA3B5',
  GRAY600: '#5A6478',
  GRAY800: '#1F2A44',
};

const Icon = ({ name, size = 18, color = COLORS.GRAY400 }: { name: string; size?: number; color?: string }) => {
  const props = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  if (name === 'back') {
    return (
      <Svg {...props}>
        <Line x1="19" y1="12" x2="5" y2="12" />
        <Polyline points="12 19 5 12 12 5" />
      </Svg>
    );
  }
  return null;
};

interface SelectGroupScreenProps {
  onBack: () => void;
  onSelectGroup: (groupInfo: {
    groupId: string;
    groupName: string;
    groupCurrency: string;
    members: Array<{ id: string; name: string; avatarColor: string; balance: number; role: 'admin' | 'member' }>;
    myUserId: string;
  }) => void;
}

export default function SelectGroupScreen({ onBack, onSelectGroup }: SelectGroupScreenProps) {
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingGroupId, setLoadingGroupId] = useState<string | null>(null);

  useEffect(() => {
    apiService.getGroups()
      .then(({ data }) => setGroups(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSelect = async (groupId: string) => {
    setLoadingGroupId(groupId);
    try {
      const { data } = await apiService.getGroup(groupId);
      onSelectGroup({
        groupId: data.id,
        groupName: data.name,
        groupCurrency: data.currency,
        members: data.members,
        myUserId: data.myUserId,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingGroupId(null);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.BLUE_DARK} />
      
      <LinearGradient
        colors={[COLORS.BLUE_DARK, COLORS.BLUE]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.topRow}>
          <TouchableOpacity onPress={onBack} activeOpacity={0.7} style={styles.iconBtn}>
            <Icon name="back" size={18} color={COLORS.WHITE} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select Group</Text>
          <View style={{ width: 36 }} />
        </View>
        <Text style={styles.headerDesc}>Which group is this expense for?</Text>
      </LinearGradient>

      <ScrollView style={styles.scroll} contentContainerStyle={{ padding: 20 }}>
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.CRIMSON} style={{ marginTop: 40 }} />
        ) : groups.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={styles.emptyTitle}>No groups yet</Text>
            <Text style={styles.emptyDesc}>Create a group first to add an expense.</Text>
          </View>
        ) : (
          groups.map(group => (
            <TouchableOpacity
              key={group.id}
              style={styles.groupCard}
              activeOpacity={0.7}
              onPress={() => handleSelect(group.id)}
              disabled={loadingGroupId !== null}
            >
              <View style={styles.groupEmojiWrap}>
                <Text style={styles.groupEmoji}>{group.emoji}</Text>
              </View>
              <View style={styles.groupInfo}>
                <Text style={styles.groupName}>{group.name}</Text>
                <Text style={styles.groupMeta}>{group.memberCount} members</Text>
              </View>
              {loadingGroupId === group.id && (
                <ActivityIndicator size="small" color={COLORS.CRIMSON} />
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.GHOST },
  header: {
    paddingTop: 20,
    paddingHorizontal: 24,
    paddingBottom: 30,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconBtn: {
    width: 36, height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: '700',
  },
  headerDesc: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
  },
  scroll: { flex: 1 },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.WHITE,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#0F2640',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  groupEmojiWrap: {
    width: 48, height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.GHOST,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  groupEmoji: { fontSize: 24 },
  groupInfo: { flex: 1 },
  groupName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.GRAY800,
    marginBottom: 3,
  },
  groupMeta: {
    fontSize: 11,
    color: COLORS.GRAY400,
  },
  emptyState: { alignItems: 'center', marginTop: 40 },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.GRAY800, marginBottom: 6 },
  emptyDesc: { fontSize: 13, color: COLORS.GRAY400, textAlign: 'center' },
});
