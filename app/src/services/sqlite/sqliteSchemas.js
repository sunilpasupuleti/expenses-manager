export const UserSchema = `
CREATE TABLE IF NOT EXISTS Users (
    uid TEXT PRIMARY KEY UNIQUE,
    active INTEGER DEFAULT 0,
    autoFetchTransactions INTEGER DEFAULT 1,
    brand TEXT,
    dailyBackupEnabled INTEGER  DEFAULT 0,
    displayName TEXT,
    email TEXT,
    fcmToken TEXT,
    lastLogin TEXT,
    model TEXT,
    providerId TEXT,
    phoneNumber TEXT,
    photoURL TEXT,
    platform TEXT,
    timezone TEXT,
    baseCurrency TEXT,
    lastSynced TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
    dailyReminderEnabled INTEGER DEFAULT 0,
    dailyReminderTime TEXT
)
`;

export const AccountsSchema = `
CREATE TABLE IF NOT EXISTS Accounts(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    currency TEXT,
    updatedAt TEXT,
    createdAt TEXT,
    showSummary INTEGER,
    totalBalance REAL,
    totalIncome REAL,
    totalExpense REAL,
    archived INTEGER DEFAULT 0,
    pinned INTEGER DEFAULT 0,
    uid TEXT,
    FOREIGN KEY (uid) REFERENCES Users(uid) ON DELETE CASCADE
)
`;

export const TransactionsSchema = `
CREATE TABLE IF NOT EXISTS Transactions(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    amount REAL,
    notes TEXT,
    type TEXT CHECK (type IN ('income','expense')),
    date TEXT,
    time TEXT,
    accountId INTEGER,
    showTime INTEGER DEFAULT 0,
    upcoming INTEGER DEFAULT 0,
    imageUrl TEXT,
    imageType TEXT,
    imageExtension TEXT,
    categoryId INTEGER,
    FOREIGN KEY (accountId) REFERENCES  Accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (categoryId) REFERENCES Categories(id) ON DELETE CASCADE
)
`;

export const CategoriesSchema = `
CREATE TABLE IF NOT EXISTS Categories(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    color TEXT,
    type TEXT CHECK(type IN ('income','expense')),
    icon TEXT,
    isDefault INTEGER DEFAULT 0,
    uid TEXT,
    FOREIGN KEY (uid) REFERENCES Users(uid) ON DELETE CASCADE
)
`;

export const transactionColumns = [
  'id',
  'amount',
  'notes',
  'type',
  'date',
  'showTime',
  'upcoming',
  'accountId',
  'categoryId',
  'time',
  'imageUrl',
  'imageType',
  'imageExtension',
];

export const categoryColumns = ['id', 'name', 'color', 'type', 'icon'];
export const accountColumns = [
  'id',
  'name',
  'uid',
  'currency',
  'totalIncome',
  'totalExpense',
  'totalBalance',
];
