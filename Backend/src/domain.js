const categoryEmoji = {
  food: '🍽️',
  transport: '🚕',
  hotel: '🏨',
  tickets: '🎟️',
  shopping: '🛍️',
  fuel: '⛽',
  utility: '🧾',
  settlement: '✓',
  other: '📦',
};

function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarColor: user.avatarColor,
  };
}

function round2(value) {
  return Math.round(Number(value) * 100) / 100;
}

function userBalanceInGroup(db, groupId, userId) {
  const expenses = db.expenses.filter((expense) => expense.groupId === groupId);
  const settlements = db.settlements.filter((settlement) => settlement.groupId === groupId);
  let balance = 0;

  for (const expense of expenses) {
    if (expense.paidBy === userId) {
      balance += Number(expense.amount);
    }
    balance -= Number(expense.shares[userId] || 0);
  }

  for (const settlement of settlements) {
    if (settlement.payerId === userId) {
      balance += Number(settlement.amount);
    }
    if (settlement.payeeId === userId) {
      balance -= Number(settlement.amount);
    }
  }

  return round2(balance);
}

function formatRelativeDate(isoDate) {
  const then = new Date(isoDate).getTime();
  const now = Date.now();
  const diffMs = Math.max(0, now - then);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);

  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;

  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(isoDate));
}

function groupSummary(db, group, userId) {
  const groupExpenses = db.expenses.filter((expense) => expense.groupId === group.id);
  const groupSettlements = db.settlements.filter((settlement) => settlement.groupId === group.id);
  const lastEvent = [...groupExpenses, ...groupSettlements]
    .map((event) => event.createdAt)
    .sort()
    .at(-1);

  return {
    id: group.id,
    name: group.name,
    emoji: group.emoji,
    currency: group.currency,
    memberCount: group.memberIds.length,
    lastActivity: lastEvent ? formatRelativeDate(lastEvent) : 'No activity yet',
    myBalance: userBalanceInGroup(db, group.id, userId),
  };
}

function expenseView(db, expense, myUserId) {
  const payer = db.users.find((user) => user.id === expense.paidBy);
  const myShare = expense.paidBy === myUserId
    ? round2(Number(expense.amount) - Number(expense.shares[myUserId] || 0))
    : round2(-Number(expense.shares[myUserId] || 0));

  return {
    id: expense.id,
    description: expense.description,
    amount: expense.amount,
    paidBy: expense.paidBy,
    paidByName: expense.paidBy === myUserId ? 'You' : payer?.name || 'Unknown',
    date: formatRelativeDate(expense.createdAt),
    emoji: categoryEmoji[expense.category] || categoryEmoji.other,
    myShare,
    participantCount: expense.participantIds.length,
  };
}

function groupDetail(db, groupId, userId) {
  const group = db.groups.find((item) => item.id === groupId);
  if (!group) return null;

  return {
    id: group.id,
    name: group.name,
    emoji: group.emoji,
    currency: group.currency,
    myUserId: userId,
    members: group.memberIds
      .map((memberId) => db.users.find((user) => user.id === memberId))
      .filter(Boolean)
      .map((user) => ({
        id: user.id,
        name: user.name,
        avatarColor: user.avatarColor,
        balance: userBalanceInGroup(db, group.id, user.id),
      })),
    expenses: db.expenses
      .filter((expense) => expense.groupId === group.id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map((expense) => expenseView(db, expense, userId)),
  };
}

function creditorsForUser(db, groupId, userId) {
  const group = db.groups.find((item) => item.id === groupId);
  if (!group) return [];

  return group.memberIds
    .filter((memberId) => memberId !== userId)
    .map((memberId) => {
      const balance = userBalanceInGroup(db, groupId, memberId);
      const member = db.users.find((user) => user.id === memberId);
      return {
        id: memberId,
        name: member?.name || 'Unknown',
        avatarColor: member?.avatarColor || '#5A6478',
        amountOwed: balance > 0 ? balance : 0,
      };
    })
    .filter((creditor) => creditor.amountOwed > 0);
}

module.exports = {
  publicUser,
  round2,
  userBalanceInGroup,
  groupSummary,
  groupDetail,
  creditorsForUser,
};
