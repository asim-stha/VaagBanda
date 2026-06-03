import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Line, Polyline } from 'react-native-svg';

/* ─── BRAND TOKENS ─────────────────────────────────────────── */
const COLORS = {
  CRIMSON: '#DC143C',
  CRIMSON_DARK: '#A01030',
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

/* ─── ICONS ────────────────────────────────────────────────── */
type IconName = 'back' | 'check' | 'search' | 'plus' | 'x' | 'mail';

const Icon = ({
  name, size = 18, color = COLORS.GRAY400,
}: { name: IconName; size?: number; color?: string }) => {
  const props = {
    width: size, height: size, viewBox: '0 0 24 24',
    fill: 'none', stroke: color, strokeWidth: 2,
    strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
  };
  switch (name) {
    case 'back':
      return (
        <Svg {...props}>
          <Line x1="19" y1="12" x2="5" y2="12" />
          <Polyline points="12 19 5 12 12 5" />
        </Svg>
      );
    case 'check':
      return (
        <Svg {...props}>
          <Polyline points="20 6 9 17 4 12" />
        </Svg>
      );
    case 'search':
      return (
        <Svg {...props}>
          <Circle cx="11" cy="11" r="8" />
          <Line x1="21" y1="21" x2="16.65" y2="16.65" />
        </Svg>
      );
    case 'plus':
      return (
        <Svg {...props}>
          <Line x1="12" y1="5" x2="12" y2="19" />
          <Line x1="5" y1="12" x2="19" y2="12" />
        </Svg>
      );
    case 'x':
      return (
        <Svg {...props}>
          <Line x1="18" y1="6" x2="6" y2="18" />
          <Line x1="6" y1="6" x2="18" y2="18" />
        </Svg>
      );
    case 'mail':
      return (
        <Svg {...props}>
          <Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
          <Polyline points="22,6 12,13 2,6" />
        </Svg>
      );
    default: return null;
  }
};

/* ─── CONSTANTS (from SRS §4.2.1 categories + §4.7 currencies) ── */
const EMOJI_OPTIONS = [
  '🏔️', '🏠', '🍕', '✈️', '🎬', '🎂',
  '🏖️', '🚗', '🎓', '💼', '🎉', '🛒',
  '🍻', '☕', '⚽', '🎵',
];

interface CategoryOption {
  key: string;
  label: string;
  emoji: string;
}

const CATEGORIES: CategoryOption[] = [
  { key: 'trip',      label: 'Trip',      emoji: '✈️' },
  { key: 'household', label: 'Household', emoji: '🏠' },
  { key: 'event',     label: 'Event',     emoji: '🎉' },
  { key: 'couple',    label: 'Couple',    emoji: '💕' },
  { key: 'other',     label: 'Other',     emoji: '📦' },
];

interface CurrencyOption {
  code: string;
  label: string;
}

const CURRENCIES: CurrencyOption[] = [
  { code: 'NPR', label: 'Nepalese Rupee' },
  { code: 'USD', label: 'US Dollar' },
  { code: 'EUR', label: 'Euro' },
  { code: 'INR', label: 'Indian Rupee' },
  { code: 'KRW', label: 'Korean Won' },
  { code: 'JPY', label: 'Japanese Yen' },
];

/* ─── DOMAIN TYPES ─────────────────────────────────────────── */
interface Contact {
  id: string;
  name: string;
  email: string;
  avatarColor: string;
  isRegistered: boolean; // false → will receive a join invitation per SRS §4.2.3
}

const AVATAR_PALETTE = ['#DC143C', '#1A2B5F', '#9C27B0', '#FF6F00', '#00838F', '#5E35B1', '#D81B60', '#43A047'];

function colorFromId(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length];
}

/* ─── AVATAR ───────────────────────────────────────────────── */
const Avatar = ({
  contact, size = 36,
}: { contact: Contact; size?: number }) => (
  <View style={[styles.avatar, {
    width: size, height: size, borderRadius: size / 2,
    backgroundColor: contact.avatarColor,
  }]}>
    <Text style={[styles.avatarText, { fontSize: size * 0.4 }]}>
      {contact.name.charAt(0).toUpperCase()}
    </Text>
  </View>
);

/* ─── PROPS ────────────────────────────────────────────────── */
interface CreateGroupScreenProps {
  onBack?: () => void;
  onCreate?: (group: {
    name: string;
    description: string;
    emoji: string;
    category: string;
    currency: string;
    memberIds: string[]; // creator is implicit as admin
  }) => void;
}

/* ─── MAIN SCREEN ──────────────────────────────────────────── */
const CreateGroupScreen: React.FC<CreateGroupScreenProps> = ({
  onBack,
  onCreate,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [emoji, setEmoji] = useState('🏔️');
  const [category, setCategory] = useState('trip');
  const [currency, setCurrency] = useState('NPR');
  const [search, setSearch] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]); // contact ids
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const currentId = user?.id ?? '';

        const { data, error } = await supabase
          .from('profiles')
          .select('user_id, full_name, avatar_color')
          .neq('user_id', currentId);

        if (!cancelled && !error && data) {
          setContacts(data.map((p: any) => ({
            id: p.user_id,
            name: p.full_name || 'Unknown',
            email: '',
            avatarColor: p.avatar_color || colorFromId(p.user_id),
            isRegistered: true,
          })));
        }
      } finally {
        if (!cancelled) setLoadingContacts(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Filter contacts by search
  const filteredContacts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q)
    );
  }, [search, contacts]);

  // Validation
  const canCreate = name.trim().length >= 2;

  const toggleMember = (id: string) => {
    setSelectedMembers(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleCreate = () => {
    if (!canCreate) return;
    onCreate?.({
      name: name.trim(),
      description: description.trim(),
      emoji,
      category,
      currency,
      memberIds: selectedMembers,
    });
  };

  const selectedCategoryObj = CATEGORIES.find(c => c.key === category) ?? CATEGORIES[0];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.BLUE_DARK} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ─── HEADER ─── */}
          <LinearGradient
            colors={[COLORS.BLUE_DARK, COLORS.BLUE, COLORS.BLUE_MID]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <View style={styles.blob} />

            <View style={styles.topRow}>
              <TouchableOpacity
                onPress={onBack}
                activeOpacity={0.7}
                style={styles.iconBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Icon name="back" size={18} color={COLORS.WHITE} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>New Group</Text>
              <TouchableOpacity
                onPress={handleCreate}
                disabled={!canCreate}
                activeOpacity={0.7}
                style={[styles.saveBtn, !canCreate && styles.saveBtnDisabled]}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={[styles.saveBtnText, !canCreate && styles.saveBtnTextDisabled]}>
                  Create
                </Text>
              </TouchableOpacity>
            </View>

            {/* Big emoji preview */}
            <TouchableOpacity
              onPress={() => setShowEmojiPicker(!showEmojiPicker)}
              activeOpacity={0.7}
              style={styles.emojiPreview}
            >
              <Text style={styles.emojiBig}>{emoji}</Text>
              <View style={styles.emojiBadge}>
                <Icon name="check" size={11} color={COLORS.WHITE} />
              </View>
            </TouchableOpacity>
            <Text style={styles.emojiHint}>
              {showEmojiPicker ? 'Pick an icon for your group' : 'Tap to change icon'}
            </Text>
          </LinearGradient>

          {/* ─── EMOJI PICKER ROW ─── */}
          {showEmojiPicker && (
            <View style={styles.emojiPickerCard}>
              <View style={styles.emojiGrid}>
                {EMOJI_OPTIONS.map(e => {
                  const active = e === emoji;
                  return (
                    <TouchableOpacity
                      key={e}
                      onPress={() => {
                        setEmoji(e);
                        setShowEmojiPicker(false);
                      }}
                      activeOpacity={0.7}
                      style={[styles.emojiTile, active && styles.emojiTileActive]}
                    >
                      <Text style={styles.emojiTileText}>{e}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* ─── SHEET ─── */}
          <View style={styles.sheet}>
            {/* Group name */}
            <Text style={styles.label}>Group name *</Text>
            <View style={styles.field}>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g. Pokhara Trip"
                placeholderTextColor={COLORS.GRAY400}
                style={styles.fieldInput}
                maxLength={50}
              />
            </View>

            {/* Description (optional) */}
            <Text style={styles.label}>Description (optional)</Text>
            <View style={styles.field}>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="A few words about this group"
                placeholderTextColor={COLORS.GRAY400}
                style={styles.fieldInput}
                maxLength={120}
              />
            </View>

            {/* Category */}
            <Text style={styles.label}>Category</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 4 }}
              style={styles.categoryScroll}
            >
              {CATEGORIES.map(c => {
                const active = c.key === category;
                return (
                  <TouchableOpacity
                    key={c.key}
                    onPress={() => setCategory(c.key)}
                    activeOpacity={0.7}
                    style={[styles.categoryChip, active && styles.categoryChipActive]}
                  >
                    <Text style={styles.categoryChipEmoji}>{c.emoji}</Text>
                    <Text style={[
                      styles.categoryChipLabel,
                      active && styles.categoryChipLabelActive,
                    ]}>
                      {c.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Currency */}
            <Text style={[styles.label, { marginTop: 8 }]}>Default currency</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 4 }}
              style={styles.currencyScroll}
            >
              {CURRENCIES.map(c => {
                const active = c.code === currency;
                return (
                  <TouchableOpacity
                    key={c.code}
                    onPress={() => setCurrency(c.code)}
                    activeOpacity={0.7}
                    style={[styles.currencyChip, active && styles.currencyChipActive]}
                  >
                    <Text style={[
                      styles.currencyCode,
                      active && styles.currencyCodeActive,
                    ]}>
                      {c.code}
                    </Text>
                    <Text style={[
                      styles.currencyLabel,
                      active && styles.currencyLabelActive,
                    ]}>
                      {c.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Selected members chips */}
            <View style={styles.membersHeader}>
              <Text style={styles.label}>
                Members
              </Text>
              <Text style={styles.membersCount}>
                {selectedMembers.length + 1} selected (you + {selectedMembers.length})
              </Text>
            </View>

            {/* You (always included as admin) */}
            <View style={styles.youCard}>
              <View style={[styles.avatar, { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.CRIMSON }]}>
                <Text style={[styles.avatarText, { fontSize: 16 }]}>Y</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.youName}>You</Text>
                <Text style={styles.youLabel}>Group admin</Text>
              </View>
              <View style={styles.adminBadge}>
                <Text style={styles.adminBadgeText}>ADMIN</Text>
              </View>
            </View>

            {/* Search box */}
            <View style={styles.searchBox}>
              <Icon name="search" size={16} color={COLORS.GRAY400} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search by name or email"
                placeholderTextColor={COLORS.GRAY400}
                style={styles.searchInput}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Icon name="x" size={14} color={COLORS.GRAY400} />
                </TouchableOpacity>
              )}
            </View>

            {/* Contact list */}
            <View style={styles.contactList}>
              {loadingContacts ? (
                <ActivityIndicator style={{ paddingVertical: 24 }} color={COLORS.CRIMSON} />
              ) : filteredContacts.length === 0 ? (
                <View style={styles.contactEmpty}>
                  <Text style={styles.contactEmojiBig}>🔍</Text>
                  <Text style={styles.contactEmptyTitle}>
                    No matches for "{search}"
                  </Text>
                  <Text style={styles.contactEmptyDesc}>
                    They'll be invited by email to join VaagBanda
                  </Text>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={styles.inviteByEmailBtn}
                  >
                    <Icon name="mail" size={14} color={COLORS.CRIMSON} />
                    <Text style={styles.inviteByEmailText}>
                      Invite by email
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                filteredContacts.map((c, idx) => {
                  const selected = selectedMembers.includes(c.id);
                  const isLast = idx === filteredContacts.length - 1;
                  return (
                    <TouchableOpacity
                      key={c.id}
                      onPress={() => toggleMember(c.id)}
                      activeOpacity={0.7}
                      style={[
                        styles.contactRow,
                        !isLast && styles.contactRowBorder,
                      ]}
                    >
                      <Avatar contact={c} size={40} />
                      <View style={styles.contactInfo}>
                        <View style={styles.contactNameRow}>
                          <Text style={styles.contactName}>{c.name}</Text>
                          {!c.isRegistered && (
                            <View style={styles.invitePill}>
                              <Text style={styles.invitePillText}>WILL INVITE</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.contactEmail}>{c.email}</Text>
                      </View>
                      <View style={[
                        styles.checkbox,
                        selected && styles.checkboxChecked,
                      ]}>
                        {selected && (
                          <Icon name="check" size={12} color={COLORS.WHITE} />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>

            {/* Bottom create button */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleCreate}
              disabled={!canCreate}
              style={{ marginTop: 24 }}
            >
              {canCreate ? (
                <LinearGradient
                  colors={[COLORS.CRIMSON, COLORS.CRIMSON_DARK]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.bottomBtn}
                >
                  <Icon name="plus" size={16} color={COLORS.WHITE} />
                  <Text style={styles.bottomBtnText}>
                    Create group{selectedMembers.length > 0 ? ` & invite ${selectedMembers.length}` : ''}
                  </Text>
                </LinearGradient>
              ) : (
                <View style={[styles.bottomBtn, styles.bottomBtnDisabled]}>
                  <Text style={styles.bottomBtnTextDisabled}>
                    Enter a group name to continue
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

/* ─── STYLES ───────────────────────────────────────────────── */
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.GHOST },
  scroll: { flex: 1 },

  /* HEADER */
  header: {
    paddingTop: 20,
    paddingHorizontal: 24,
    paddingBottom: 26,
    overflow: 'hidden',
  },
  blob: {
    position: 'absolute',
    top: -40, right: -40,
    width: 160, height: 160,
    borderRadius: 9999,
    backgroundColor: 'rgba(220,20,60,0.18)',
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
    letterSpacing: -0.2,
  },
  saveBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: COLORS.CRIMSON,
  },
  saveBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  saveBtnText: {
    color: COLORS.WHITE,
    fontSize: 13,
    fontWeight: '700',
  },
  saveBtnTextDisabled: {
    color: 'rgba(255,255,255,0.50)',
  },

  /* EMOJI PREVIEW */
  emojiPreview: {
    alignSelf: 'center',
    marginTop: 14,
    width: 78,
    height: 78,
    borderRadius: 20,
    backgroundColor: COLORS.WHITE,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 8,
  },
  emojiBig: {
    fontSize: 44,
  },
  emojiBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 22, height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.CRIMSON,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.BLUE_DARK,
  },
  emojiHint: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },

  /* EMOJI PICKER */
  emojiPickerCard: {
    backgroundColor: COLORS.WHITE,
    marginHorizontal: 20,
    marginTop: -14,
    borderRadius: 16,
    padding: 12,
    shadowColor: '#0F2640',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 4,
    zIndex: 5,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
  },
  emojiTile: {
    width: 46,
    height: 46,
    borderRadius: 10,
    backgroundColor: COLORS.GHOST,
    borderWidth: 1.5,
    borderColor: COLORS.GRAY200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiTileActive: {
    borderColor: COLORS.CRIMSON,
    backgroundColor: 'rgba(220,20,60,0.08)',
  },
  emojiTileText: {
    fontSize: 26,
  },

  /* SHEET */
  sheet: {
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 20,
  },

  /* LABEL */
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.GRAY600,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },

  /* TEXT FIELD */
  field: {
    backgroundColor: COLORS.WHITE,
    borderWidth: 1.5,
    borderColor: COLORS.GRAY200,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
  },
  fieldInput: {
    fontSize: 15,
    color: COLORS.GRAY800,
    fontWeight: '500',
    padding: 0,
  },

  /* CATEGORY CHIPS */
  categoryScroll: {
    marginBottom: 14,
    marginHorizontal: -22,
    paddingHorizontal: 22,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: COLORS.WHITE,
    borderWidth: 1.5,
    borderColor: COLORS.GRAY200,
    marginRight: 8,
  },
  categoryChipActive: {
    borderColor: COLORS.CRIMSON,
    backgroundColor: 'rgba(220,20,60,0.06)',
  },
  categoryChipEmoji: {
    fontSize: 16,
  },
  categoryChipLabel: {
    fontSize: 13,
    color: COLORS.GRAY600,
    fontWeight: '600',
  },
  categoryChipLabelActive: {
    color: COLORS.CRIMSON,
    fontWeight: '700',
  },

  /* CURRENCY CHIPS */
  currencyScroll: {
    marginBottom: 16,
    marginHorizontal: -22,
    paddingHorizontal: 22,
  },
  currencyChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: COLORS.WHITE,
    borderWidth: 1.5,
    borderColor: COLORS.GRAY200,
    marginRight: 8,
    minWidth: 110,
  },
  currencyChipActive: {
    borderColor: COLORS.CRIMSON,
    backgroundColor: 'rgba(220,20,60,0.06)',
  },
  currencyCode: {
    fontSize: 14,
    color: COLORS.GRAY800,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  currencyCodeActive: {
    color: COLORS.CRIMSON,
  },
  currencyLabel: {
    fontSize: 10,
    color: COLORS.GRAY600,
    fontWeight: '500',
    marginTop: 2,
  },
  currencyLabelActive: {
    color: COLORS.CRIMSON_DARK,
  },

  /* MEMBERS */
  membersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  membersCount: {
    fontSize: 11,
    color: COLORS.GRAY400,
    fontWeight: '600',
    letterSpacing: 0.3,
  },

  /* YOU CARD */
  youCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: COLORS.CRIMSON,
  },
  youName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.GRAY800,
  },
  youLabel: {
    fontSize: 11,
    color: COLORS.GRAY600,
    marginTop: 2,
  },
  adminBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: COLORS.CRIMSON,
  },
  adminBadgeText: {
    fontSize: 9,
    color: COLORS.WHITE,
    fontWeight: '800',
    letterSpacing: 0.8,
  },

  /* AVATAR */
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: COLORS.WHITE,
    fontWeight: '700',
  },

  /* SEARCH */
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderWidth: 1.5,
    borderColor: COLORS.GRAY200,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.GRAY800,
    fontWeight: '500',
    padding: 0,
  },

  /* CONTACT LIST */
  contactList: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.GRAY200,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  contactRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY100,
  },
  contactInfo: {
    flex: 1,
    marginLeft: 12,
  },
  contactNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.GRAY800,
  },
  contactEmail: {
    fontSize: 11,
    color: COLORS.GRAY600,
    marginTop: 2,
  },
  invitePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    backgroundColor: 'rgba(243,156,18,0.18)',
  },
  invitePillText: {
    fontSize: 8,
    color: '#A0660C',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  checkbox: {
    width: 22, height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.GRAY400,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.CRIMSON,
    borderColor: COLORS.CRIMSON,
  },

  /* CONTACT EMPTY */
  contactEmpty: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 24,
  },
  contactEmojiBig: {
    fontSize: 36,
    marginBottom: 10,
  },
  contactEmptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.GRAY800,
    marginBottom: 4,
    textAlign: 'center',
  },
  contactEmptyDesc: {
    fontSize: 12,
    color: COLORS.GRAY600,
    textAlign: 'center',
  },
  inviteByEmailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(220,20,60,0.08)',
    marginTop: 12,
  },
  inviteByEmailText: {
    fontSize: 12,
    color: COLORS.CRIMSON,
    fontWeight: '700',
  },

  /* BOTTOM BUTTON */
  bottomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 14,
    shadowColor: COLORS.CRIMSON,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
  bottomBtnText: {
    color: COLORS.WHITE,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  bottomBtnDisabled: {
    backgroundColor: COLORS.GRAY200,
    shadowOpacity: 0,
    elevation: 0,
  },
  bottomBtnTextDisabled: {
    color: COLORS.GRAY400,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

export default CreateGroupScreen;