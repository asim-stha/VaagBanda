
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { apiService } from '../../services/apiService';

/* ─── BRAND TOKENS ─────────────────────────────────────────── */
const COLORS = {
  CRIMSON: '#DC143C',
  BLUE: '#1A2B5F',
  BLUE_DARK: '#0F1F4A',
  BLUE_MID: '#2B3F75',
  WHITE: '#FFFFFF',
  GHOST: '#F7F8FB',
  GRAY100: '#EEF1F6',
  GRAY200: '#E1E5EE',
  GRAY400: '#9AA3B5',
  GRAY600: '#5A6478',
  GRAY800: '#1F2A44',
};

/* ─── NOTIFICATION TYPES ───────────────────────────────────── */
interface Notification {
  id: string;
  icon: string;
  text: string;
  time: string;
  read: boolean;
}

/* ─── PROPS ────────────────────────────────────────────────── */
interface ActivityScreenProps {
  onNotificationTap?: (id: string) => void;
}

/* ─── MAIN COMPONENT ───────────────────────────────────────── */
const ActivityScreen: React.FC<ActivityScreenProps> = ({ onNotificationTap }) => {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiService.getActivity()
      .then(({ data }) => {
        setItems(data.map(item => ({ ...item, read: false })));
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const unreadCount = items.filter(n => !n.read).length;

  const markAllRead = () => {
    setItems(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleTap = (id: string) => {
    setItems(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    onNotificationTap?.(id);
  };

  return (
    <View style={styles.root}>
      {/* Header — navy gradient matching mockup */}
      <LinearGradient
        colors={[COLORS.BLUE_DARK, COLORS.BLUE_MID]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Activity</Text>
            <Text style={styles.headerSub}>Stay in the loop with what's happening</Text>
          </View>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={markAllRead} activeOpacity={0.7} style={styles.markReadBtn}>
              <Text style={styles.markReadText}>Mark all read</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Unread count pill */}
        {unreadCount > 0 && (
          <View style={styles.unreadPill}>
            <Text style={styles.unreadText}>
              {unreadCount} new {unreadCount === 1 ? 'notification' : 'notifications'}
            </Text>
          </View>
        )}
      </LinearGradient>

      {/* Notification list */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyDesc}>Loading activity…</Text>
          </View>
        ) : items.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🔕</Text>
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={styles.emptyDesc}>
              When someone adds an expense or settles up, you'll see it here
            </Text>
          </View>
        ) : (
          items.map(n => (
            <TouchableOpacity
              key={n.id}
              onPress={() => handleTap(n.id)}
              activeOpacity={0.7}
              style={[
                styles.notifCard,
                !n.read && styles.notifCardUnread,
              ]}
            >
              <Text style={styles.notifIcon}>{n.icon}</Text>
              <View style={styles.notifContent}>
                <Text style={[
                  styles.notifText,
                  !n.read && styles.notifTextUnread,
                ]}>
                  {n.text}
                </Text>
                <Text style={styles.notifTime}>{n.time}</Text>
              </View>
              {!n.read && <View style={styles.notifDot} />}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
};

/* ─── STYLES ───────────────────────────────────────────────── */
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.GHOST },

  /* HEADER */
  header: {
    paddingTop: 20,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitle: {
    color: COLORS.WHITE,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSub: {
    color: 'rgba(255,255,255,0.70)',
    fontSize: 12,
    marginTop: 2,
  },
  markReadBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.18)',
    marginTop: 4,
  },
  markReadText: {
    color: COLORS.WHITE,
    fontSize: 11,
    fontWeight: '700',
  },
  unreadPill: {
    alignSelf: 'flex-start',
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.CRIMSON,
  },
  unreadText: {
    color: COLORS.WHITE,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  /* LIST */
  list: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },

  /* NOTIFICATION CARD */
  notifCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.GRAY100,
  },
  notifCardUnread: {
    borderLeftWidth: 3,
    borderLeftColor: COLORS.CRIMSON,
    backgroundColor: 'rgba(220,20,60,0.03)',
  },
  notifIcon: {
    fontSize: 22,
    marginTop: 1,
  },
  notifContent: {
    flex: 1,
  },
  notifText: {
    fontSize: 13,
    color: COLORS.GRAY800,
    lineHeight: 18,
  },
  notifTextUnread: {
    fontWeight: '600',
  },
  notifTime: {
    fontSize: 11,
    color: COLORS.GRAY400,
    marginTop: 4,
  },
  notifDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.CRIMSON,
    marginTop: 6,
  },

  /* EMPTY STATE */
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 30,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.GRAY800,
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 13,
    color: COLORS.GRAY600,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default ActivityScreen;