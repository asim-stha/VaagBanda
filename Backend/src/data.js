const colors = {
  crimson: '#DC143C',
  blue: '#1A2B5F',
  purple: '#9C27B0',
  orange: '#FF6F00',
  teal: '#00838F',
};

function createSeedData() {
  return {
    users: [
      { id: 'u1', name: 'Asim', email: 'asim@example.com', password: 'password123', avatarColor: colors.crimson },
      { id: 'u2', name: 'Krishna', email: 'krishna@example.com', password: 'password123', avatarColor: colors.blue },
      { id: 'u3', name: 'Riya', email: 'riya@example.com', password: 'password123', avatarColor: colors.purple },
      { id: 'u4', name: 'Bibek', email: 'bibek@example.com', password: 'password123', avatarColor: colors.orange },
      { id: 'u5', name: 'Sita', email: 'sita@example.com', password: 'password123', avatarColor: colors.teal },
    ],
    groups: [
      { id: 'g1', name: 'Pokhara Trip', emoji: '🏔️', currency: 'NPR', createdBy: 'u1', memberIds: ['u1', 'u2', 'u3', 'u4', 'u5'], createdAt: '2026-05-20T09:00:00.000Z' },
      { id: 'g2', name: 'Apartment 304', emoji: '🏠', currency: 'NPR', createdBy: 'u1', memberIds: ['u1', 'u2', 'u3'], createdAt: '2026-05-21T09:00:00.000Z' },
      { id: 'g3', name: 'Friday Pizza Club', emoji: '🍕', currency: 'NPR', createdBy: 'u1', memberIds: ['u1', 'u2', 'u3', 'u4', 'u5'], createdAt: '2026-05-22T09:00:00.000Z' },
      { id: 'g4', name: 'Seoul Vacation', emoji: '✈️', currency: 'KRW', createdBy: 'u1', memberIds: ['u1', 'u2', 'u3', 'u4'], createdAt: '2026-05-23T09:00:00.000Z' },
    ],
    expenses: [
      { id: 'e1', groupId: 'g1', description: 'Hotel - 2 nights', amount: 8000, paidBy: 'u1', category: 'hotel', participantIds: ['u1', 'u2', 'u3', 'u4', 'u5'], shares: { u1: 1600, u2: 1600, u3: 1600, u4: 1600, u5: 1600 }, createdAt: '2026-05-30T08:00:00.000Z' },
      { id: 'e2', groupId: 'g1', description: 'Dinner at lakeside', amount: 2500, paidBy: 'u3', category: 'food', participantIds: ['u1', 'u2', 'u3', 'u4', 'u5'], shares: { u1: 500, u2: 500, u3: 500, u4: 500, u5: 500 }, createdAt: '2026-05-29T19:00:00.000Z' },
      { id: 'e3', groupId: 'g1', description: 'Taxi from airport', amount: 1500, paidBy: 'u4', category: 'transport', participantIds: ['u1', 'u2', 'u3', 'u4', 'u5'], shares: { u1: 300, u2: 300, u3: 300, u4: 300, u5: 300 }, createdAt: '2026-05-28T12:00:00.000Z' },
      { id: 'e4', groupId: 'g1', description: 'Paragliding tickets', amount: 6000, paidBy: 'u1', category: 'tickets', participantIds: ['u1', 'u2', 'u3', 'u4', 'u5'], shares: { u1: 1200, u2: 1200, u3: 1200, u4: 1200, u5: 1200 }, createdAt: '2026-05-27T10:00:00.000Z' },
      { id: 'e5', groupId: 'g1', description: 'Boat ride', amount: 800, paidBy: 'u2', category: 'transport', participantIds: ['u1', 'u2', 'u3', 'u4', 'u5'], shares: { u1: 160, u2: 160, u3: 160, u4: 160, u5: 160 }, createdAt: '2026-05-27T15:00:00.000Z' },
    ],
    settlements: [],
    passwordResetRequests: [],
  };
}

module.exports = { createSeedData };
