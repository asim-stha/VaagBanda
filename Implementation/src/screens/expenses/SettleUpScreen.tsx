import React, { useMemo, useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Line, Polyline, Rect } from 'react-native-svg';

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
  SUCCESS: '#27AE60',
  SUCCESS_DARK: '#1E8E47',
  WARN: '#F39C12',
};

/* ─── ICONS ────────────────────────────────────────────────── */
type IconName = 'back' | 'check' | 'chevron' | 'info' | 'cash' | 'bank' | 'card';

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
    case 'chevron':
      return (
        <Svg {...props}>
          <Polyline points="9 18 15 12 9 6" />
        </Svg>
      );
    case 'info':
      return (
        <Svg {...props}>
          <Circle cx="12" cy="12" r="10" />
          <Line x1="12" y1="16" x2="12" y2="12" />
          <Line x1="12" y1="8" x2="12.01" y2="8" />
        </Svg>
      );
    case 'cash':
      return (
        <Svg {...props}>
          <Rect x="2" y="6" width="20" height="12" rx="2" />
          <Circle cx="12" cy="12" r="3" />
          <Line x1="6" y1="12" x2="6.01" y2="12" />
          <Line x1="18" y1="12" x2="18.01" y2="12" />
        </Svg>
      );
    case 'bank':
      return (
        <Svg {...props}>
          <Path d="M3 10l9-7 9 7v2H3z" />
          <Line x1="5" y1="12" x2="5" y2="20" />
          <Line x1="10" y1="12" x2="10" y2="20" />
          <Line x1="14" y1="12" x2="14" y2="20" />
          <Line x1="19" y1="12" x2="19" y2="20" />
          <Line x1="2" y1="20" x2="22" y2="20" />
        </Svg>
      );
    case 'card':
      return (
        <Svg {...props}>
          <Rect x="2" y="5" width="20" height="14" rx="2" />
          <Line x1="2" y1="10" x2="22" y2="10" />
        </Svg>
      );
    default: return null;
  }
};

/* ─── HELPERS ──────────────────────────────────────────────── */
const fmt = (n: number) => Math.abs(n).toLocaleString('en-US', {
  minimumFractionDigits: 2, maximumFractionDigits: 2,
});

/* ─── DOMAIN TYPES ─────────────────────────────────────────── */
interface Member {
  id: string;
  name: string;
  avatarColor: string;
}

interface Creditor extends Member {
  amountOwed: number; // amount I owe this person
}

type PaymentMethod = 'cash' | 'bank' | 'other';

/* ─── MOCK DATA ────────────────────────────────────────────── */
const MOCK_CREDITORS: Creditor[] = [
  { id: 'u2', name: 'Krishna', avatarColor: COLORS.BLUE,    amountOwed: 800  },
  { id: 'u4', name: 'Bibek',   avatarColor: '#FF6F00',      amountOwed: 2100 },
  { id: 'u5', name: 'Sita',    avatarColor: '#00838F',      amountOwed: 750  },
];

/* ─── AVATAR ───────────────────────────────────────────────── */
const Avatar = ({
  member, size = 36,
}: { member: Member; size?: number }) => (
  <View style={[styles.avatar, {
    width: size, height: size, borderRadius: size / 2,
    backgroundColor: member.avatarColor,
  }]}>
    <Text style={[styles.avatarText, { fontSize: size * 0.4 }]}>
      {member.name.charAt(0).toUpperCase()}
    </Text>
  </View>
);

/* ─── PROPS ────────────────────────────────────────────────── */
interface SettleUpScreenProps {
  groupName?: string;
  groupCurrency?: string;
  creditors?: Creditor[];
  onBack?: () => void;
  onSettle?: (settlement: {
    payeeId: string;
    amount: number;
    method: PaymentMethod;
    note: string;
  }) => void;
}

/* ─── MAIN SCREEN ──────────────────────────────────────────── */
const SettleUpScreen: React.FC<SettleUpScreenProps> = ({
  groupName = 'Pokhara Trip',
  groupCurrency = 'NPR',
  creditors = MOCK_CREDITORS,
  onBack,
  onSettle,
}) => {
  type Step = 'pick' | 'form' | 'done';
  const [step, setStep] = useState<Step>('pick');
  const [selected, setSelected] = useState<Creditor | null>(null);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [note, setNote] = useState('');

  const totalOwed = useMemo(
    () => creditors.reduce((acc, c) => acc + c.amountOwed, 0),
    [creditors]
  );

  // Numeric amount
  const amountNum = useMemo(() => {
    const parsed = parseFloat(amount.replace(/,/g, ''));
    return isNaN(parsed) ? 0 : parsed;
  }, [amount]);

  // SRS §4.5.3: amount must be > 0 and cannot exceed owed
  const amountOk = selected
    ? amountNum > 0 && amountNum <= selected.amountOwed + 0.01
    : false;

  const handleAmountChange = (text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 2) return;
    setAmount(cleaned);
  };

  const handlePickCreditor = (c: Creditor) => {
    setSelected(c);
    setAmount(c.amountOwed.toFixed(2)); // default to full settlement
    setStep('form');
  };

  const handleConfirm = () => {
    if (!selected || !amountOk) return;
    onSettle?.({
      payeeId: selected.id,
      amount: amountNum,
      method,
      note: note.trim(),
    });
    setStep('done');
  };

  const handleDone = () => {
    // Reset for next time and exit
    setStep('pick');
    setSelected(null);
    setAmount('');
    setNote('');
    setMethod('cash');
    onBack?.();
  };

  const handleBackPress = () => {
    if (step === 'form') {
      setStep('pick');
      setSelected(null);
    } else {
      onBack?.();
    }
  };

  const isPartial = selected && amountNum > 0 && amountNum < selected.amountOwed;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.BLUE_DARK} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ─── HEADER ─── */}
          <LinearGradient
            colors={[COLORS.BLUE_DARK, COLORS.BLUE]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <View style={styles.blob} />

            <View style={styles.topRow}>
              <TouchableOpacity
                onPress={handleBackPress}
                activeOpacity={0.7}
                style={styles.iconBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Icon name="back" size={18} color={COLORS.WHITE} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Settle Up</Text>
              <View style={{ width: 36 }} />
            </View>
            <Text style={styles.groupContext} numberOfLines={1}>
              in {groupName}
            </Text>
          </LinearGradient>

          {/* ═══════════════════════════════════════════════════
              STEP 1 — PICK A CREDITOR
              ═══════════════════════════════════════════════════ */}
          {step === 'pick' && (
            <View style={styles.sheet}>
              {creditors.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyEmoji}>🎉</Text>
                  <Text style={styles.emptyTitle}>You're all squared up</Text>
                  <Text style={styles.emptyDesc}>
                    You don't owe anyone in this group. Nice!
                  </Text>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={onBack}
                    style={{ marginTop: 18 }}
                  >
                    <LinearGradient
                      colors={[COLORS.BLUE, COLORS.BLUE_DARK]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.bottomBtn}
                    >
                      <Text style={styles.bottomBtnText}>Back to group</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  {/* Total owed summary */}
                  <View style={styles.summaryCard}>
                    <Text style={styles.summaryLabel}>YOU OWE IN TOTAL</Text>
                    <Text style={styles.summaryAmount}>
                      {fmt(totalOwed)} <Text style={styles.summaryCurrency}>{groupCurrency}</Text>
                    </Text>
                    <Text style={styles.summarySub}>
                      Across {creditors.length} {creditors.length === 1 ? 'person' : 'people'}
                    </Text>
                  </View>

                  {/* Scope reminder — SRS §4.5.1, §5.5 */}
                  <View style={styles.infoCard}>
                    <Icon name="info" size={16} color={COLORS.BLUE} />
                    <Text style={styles.infoText}>
                      VaagBanda only records that you paid externally. Make the actual
                      payment outside the app (cash, bank transfer, etc).
                    </Text>
                  </View>

                  {/* Creditor list */}
                  <Text style={styles.sectionLabel}>WHO ARE YOU PAYING?</Text>
                  <View style={styles.creditorList}>
                    {creditors.map((c, idx) => {
                      const isLast = idx === creditors.length - 1;
                      return (
                        <TouchableOpacity
                          key={c.id}
                          onPress={() => handlePickCreditor(c)}
                          activeOpacity={0.7}
                          style={[
                            styles.creditorRow,
                            !isLast && styles.creditorRowBorder,
                          ]}
                        >
                          <Avatar member={c} size={40} />
                          <View style={styles.creditorInfo}>
                            <Text style={styles.creditorName}>{c.name}</Text>
                            <Text style={styles.creditorLabel}>You owe</Text>
                          </View>
                          <View style={styles.creditorAmount}>
                            <Text style={styles.creditorAmountText}>
                              {fmt(c.amountOwed)}
                            </Text>
                            <Text style={styles.creditorCurrency}>{groupCurrency}</Text>
                          </View>
                          <Icon name="chevron" size={16} color={COLORS.GRAY400} />
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              )}
            </View>
          )}

          {/* ═══════════════════════════════════════════════════
              STEP 2 — SETTLEMENT FORM
              ═══════════════════════════════════════════════════ */}
          {step === 'form' && selected && (
            <View style={styles.sheet}>
              {/* Recipient card */}
              <View style={styles.recipientCard}>
                <Avatar member={selected} size={52} />
                <View style={styles.recipientInfo}>
                  <Text style={styles.recipientLabel}>PAYING</Text>
                  <Text style={styles.recipientName}>{selected.name}</Text>
                  <Text style={styles.recipientOwed}>
                    You owe {fmt(selected.amountOwed)} {groupCurrency}
                  </Text>
                </View>
              </View>

              {/* Amount input */}
              <Text style={styles.label}>Amount</Text>
              <View style={styles.amountBox}>
                <Text style={styles.amountCurrency}>{groupCurrency}</Text>
                <TextInput
                  value={amount}
                  onChangeText={handleAmountChange}
                  placeholder="0.00"
                  placeholderTextColor={COLORS.GRAY400}
                  keyboardType="decimal-pad"
                  style={styles.amountInput}
                  maxLength={12}
                />
              </View>

              {/* Quick-fill row */}
              <View style={styles.quickFillRow}>
                <TouchableOpacity
                  onPress={() => setAmount(selected.amountOwed.toFixed(2))}
                  activeOpacity={0.7}
                  style={[
                    styles.quickFillBtn,
                    !isPartial && styles.quickFillBtnActive,
                  ]}
                >
                  <Text style={[
                    styles.quickFillText,
                    !isPartial && styles.quickFillTextActive,
                  ]}>
                    Full ({fmt(selected.amountOwed)})
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setAmount((selected.amountOwed / 2).toFixed(2))}
                  activeOpacity={0.7}
                  style={styles.quickFillBtn}
                >
                  <Text style={styles.quickFillText}>Half</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setAmount('')}
                  activeOpacity={0.7}
                  style={styles.quickFillBtn}
                >
                  <Text style={styles.quickFillText}>Custom</Text>
                </TouchableOpacity>
              </View>

              {/* Partial indicator */}
              {isPartial && amountOk && (
                <View style={styles.partialBanner}>
                  <Icon name="info" size={13} color={COLORS.WARN} />
                  <Text style={styles.partialText}>
                    Partial settlement. Remaining {fmt(selected.amountOwed - amountNum)} {groupCurrency} will stay outstanding.
                  </Text>
                </View>
              )}

              {/* Over-amount error */}
              {amountNum > selected.amountOwed + 0.01 && (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorText}>
                    Cannot exceed {fmt(selected.amountOwed)} {groupCurrency} (the amount owed)
                  </Text>
                </View>
              )}

              {/* Payment method */}
              <Text style={[styles.label, { marginTop: 18 }]}>Payment method</Text>
              <View style={styles.methodRow}>
                {([
                  { key: 'cash',  label: 'Cash',     icon: 'cash' as IconName },
                  { key: 'bank',  label: 'Bank',     icon: 'bank' as IconName },
                  { key: 'other', label: 'Other',    icon: 'card' as IconName },
                ] as const).map(m => {
                  const active = method === m.key;
                  return (
                    <TouchableOpacity
                      key={m.key}
                      onPress={() => setMethod(m.key)}
                      activeOpacity={0.7}
                      style={[
                        styles.methodTile,
                        active && styles.methodTileActive,
                      ]}
                    >
                      <Icon
                        name={m.icon}
                        size={20}
                        color={active ? COLORS.CRIMSON : COLORS.GRAY600}
                      />
                      <Text style={[
                        styles.methodLabel,
                        active && styles.methodLabelActive,
                      ]}>
                        {m.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Optional note */}
              <Text style={[styles.label, { marginTop: 18 }]}>Note (optional)</Text>
              <View style={styles.field}>
                <TextInput
                  value={note}
                  onChangeText={setNote}
                  placeholder="e.g. Paid via eSewa"
                  placeholderTextColor={COLORS.GRAY400}
                  style={styles.fieldInput}
                  maxLength={120}
                />
              </View>

              {/* Confirm button */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleConfirm}
                disabled={!amountOk}
                style={{ marginTop: 22 }}
              >
                {amountOk ? (
                  <LinearGradient
                    colors={[COLORS.SUCCESS, COLORS.SUCCESS_DARK]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.bottomBtn}
                  >
                    <Icon name="check" size={16} color={COLORS.WHITE} />
                    <Text style={styles.bottomBtnText}>
                      Record settlement of {amount ? fmt(amountNum) : '0.00'} {groupCurrency}
                    </Text>
                  </LinearGradient>
                ) : (
                  <View style={[styles.bottomBtn, styles.bottomBtnDisabled]}>
                    <Text style={styles.bottomBtnTextDisabled}>
                      Enter an amount to continue
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* ═══════════════════════════════════════════════════
              STEP 3 — SUCCESS
              ═══════════════════════════════════════════════════ */}
          {step === 'done' && selected && (
            <View style={styles.sheet}>
              <View style={styles.successWrap}>
                <View style={styles.successCircle}>
                  <Icon name="check" size={42} color={COLORS.SUCCESS} />
                </View>

                <Text style={styles.successTitle}>Settlement recorded!</Text>

                <Text style={styles.successDesc}>
                  You paid <Text style={styles.successBold}>{fmt(amountNum)} {groupCurrency}</Text> to{' '}
                  <Text style={styles.successBold}>{selected.name}</Text>.
                </Text>

                {/* Detail card */}
                <View style={styles.detailCard}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailKey}>To</Text>
                    <View style={styles.detailValueWithAvatar}>
                      <Avatar member={selected} size={24} />
                      <Text style={styles.detailValue}>{selected.name}</Text>
                    </View>
                  </View>
                  <View style={styles.detailDivider} />
                  <View style={styles.detailRow}>
                    <Text style={styles.detailKey}>Amount</Text>
                    <Text style={styles.detailValue}>
                      {fmt(amountNum)} {groupCurrency}
                    </Text>
                  </View>
                  <View style={styles.detailDivider} />
                  <View style={styles.detailRow}>
                    <Text style={styles.detailKey}>Via</Text>
                    <Text style={styles.detailValue}>
                      {method === 'cash' ? 'Cash' : method === 'bank' ? 'Bank Transfer' : 'Other'}
                    </Text>
                  </View>
                  {note.trim() !== '' && (
                    <>
                      <View style={styles.detailDivider} />
                      <View style={styles.detailRow}>
                        <Text style={styles.detailKey}>Note</Text>
                        <Text style={styles.detailValue} numberOfLines={2}>
                          {note}
                        </Text>
                      </View>
                    </>
                  )}
                </View>

                <Text style={styles.notifyHint}>
                  {selected.name} will be notified of this settlement.
                </Text>

                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handleDone}
                  style={{ marginTop: 24, width: '100%' }}
                >
                  <LinearGradient
                    colors={[COLORS.CRIMSON, COLORS.CRIMSON_DARK]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.bottomBtn}
                  >
                    <Text style={styles.bottomBtnText}>Back to group</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}
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
    paddingBottom: 24,
    overflow: 'hidden',
  },
  blob: {
    position: 'absolute',
    top: -40, right: -40,
    width: 150, height: 150,
    borderRadius: 9999,
    backgroundColor: 'rgba(39,174,96,0.20)',
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
  groupContext: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },

  /* SHEET */
  sheet: {
    backgroundColor: COLORS.GHOST,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 24,
    flex: 1,
  },

  /* SUMMARY CARD (step 1) */
  summaryCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: '#0F2640',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.GRAY600,
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.CRIMSON,
    letterSpacing: -0.5,
  },
  summaryCurrency: {
    fontSize: 14,
    color: COLORS.GRAY600,
    fontWeight: '600',
  },
  summarySub: {
    fontSize: 12,
    color: COLORS.GRAY600,
    marginTop: 4,
  },

  /* INFO CARD */
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(26,43,95,0.06)',
    borderLeftWidth: 3,
    borderLeftColor: COLORS.BLUE,
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.GRAY600,
    lineHeight: 17,
  },

  /* SECTION LABEL */
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.GRAY600,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
  },

  /* CREDITOR LIST */
  creditorList: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#0F2640',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  creditorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  creditorRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY100,
  },
  creditorInfo: {
    flex: 1,
    marginLeft: 12,
  },
  creditorName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.GRAY800,
  },
  creditorLabel: {
    fontSize: 11,
    color: COLORS.GRAY600,
    marginTop: 2,
  },
  creditorAmount: {
    alignItems: 'flex-end',
    marginRight: 8,
  },
  creditorAmountText: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.CRIMSON,
    letterSpacing: -0.2,
  },
  creditorCurrency: {
    fontSize: 9,
    color: COLORS.GRAY400,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: 1,
  },

  /* RECIPIENT CARD (step 2) */
  recipientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: COLORS.WHITE,
    borderRadius: 14,
    padding: 16,
    marginBottom: 18,
    shadowColor: '#0F2640',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  recipientInfo: {
    flex: 1,
  },
  recipientLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.GRAY600,
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  recipientName: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.GRAY800,
    letterSpacing: -0.3,
  },
  recipientOwed: {
    fontSize: 12,
    color: COLORS.CRIMSON,
    fontWeight: '600',
    marginTop: 2,
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

  /* AMOUNT BOX */
  amountBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
    backgroundColor: COLORS.WHITE,
    borderWidth: 1.5,
    borderColor: COLORS.GRAY200,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  amountCurrency: {
    fontSize: 13,
    color: COLORS.GRAY600,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  amountInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.GRAY800,
    letterSpacing: -0.5,
    padding: 0,
  },

  /* QUICK FILL */
  quickFillRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  quickFillBtn: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: COLORS.WHITE,
    borderWidth: 1.5,
    borderColor: COLORS.GRAY200,
    alignItems: 'center',
  },
  quickFillBtnActive: {
    borderColor: COLORS.SUCCESS,
    backgroundColor: 'rgba(39,174,96,0.08)',
  },
  quickFillText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.GRAY600,
    letterSpacing: 0.3,
  },
  quickFillTextActive: {
    color: COLORS.SUCCESS,
  },

  /* BANNERS */
  partialBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(243,156,18,0.10)',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },
  partialText: {
    flex: 1,
    fontSize: 11,
    color: COLORS.WARN,
    fontWeight: '600',
    lineHeight: 15,
  },
  errorBanner: {
    backgroundColor: 'rgba(220,20,60,0.08)',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },
  errorText: {
    fontSize: 11,
    color: COLORS.CRIMSON,
    fontWeight: '700',
  },

  /* METHOD TILES */
  methodRow: {
    flexDirection: 'row',
    gap: 10,
  },
  methodTile: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.WHITE,
    borderWidth: 1.5,
    borderColor: COLORS.GRAY200,
    alignItems: 'center',
    gap: 6,
  },
  methodTileActive: {
    borderColor: COLORS.CRIMSON,
    backgroundColor: 'rgba(220,20,60,0.06)',
  },
  methodLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.GRAY600,
  },
  methodLabelActive: {
    color: COLORS.CRIMSON,
    fontWeight: '700',
  },

  /* TEXT FIELD */
  field: {
    backgroundColor: COLORS.WHITE,
    borderWidth: 1.5,
    borderColor: COLORS.GRAY200,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  fieldInput: {
    fontSize: 14,
    color: COLORS.GRAY800,
    fontWeight: '500',
    padding: 0,
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

  /* BOTTOM BUTTON */
  bottomBtn: {
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: COLORS.SUCCESS,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
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

  /* EMPTY STATE */
  emptyState: {
    alignItems: 'center',
    paddingVertical: 50,
    paddingHorizontal: 30,
    backgroundColor: COLORS.WHITE,
    borderRadius: 14,
  },
  emptyEmoji: {
    fontSize: 56,
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.GRAY800,
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 13,
    color: COLORS.GRAY600,
    textAlign: 'center',
    lineHeight: 19,
  },

  /* SUCCESS STATE */
  successWrap: {
    alignItems: 'center',
    paddingTop: 14,
  },
  successCircle: {
    width: 90, height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(39,174,96,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    borderWidth: 2,
    borderColor: COLORS.SUCCESS,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.GRAY800,
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  successDesc: {
    fontSize: 13,
    color: COLORS.GRAY600,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
    marginBottom: 18,
  },
  successBold: {
    fontWeight: '700',
    color: COLORS.GRAY800,
  },
  detailCard: {
    width: '100%',
    backgroundColor: COLORS.WHITE,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.GRAY200,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailKey: {
    fontSize: 11,
    color: COLORS.GRAY600,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 13,
    color: COLORS.GRAY800,
    fontWeight: '700',
    flex: 1,
    textAlign: 'right',
  },
  detailValueWithAvatar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailDivider: {
    height: 1,
    backgroundColor: COLORS.GRAY100,
  },
  notifyHint: {
    fontSize: 11,
    color: COLORS.GRAY400,
    fontStyle: 'italic',
    marginTop: 14,
    textAlign: 'center',
  },
});

export default SettleUpScreen;