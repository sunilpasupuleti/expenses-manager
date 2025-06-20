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
    isLoanAccount INTEGER DEFAULT 0,
    loanAmount REAL DEFAULT 0,
    useReducingBalance INTEGER DEFAULT 0,
    useEndDate INTEGER DEFAULT 0,
    interestRate REAL DEFAULT 0,
    interestRateMode TEXT,
    loanStartDate TEXT,
    totalPaid REAL DEFAULT 0,
    loanEndDate TEXT,
    repaymentFrequency TEXT,
    loanYears INTEGER DEFAULT 0,
    loanMonths INTEGER DEFAULT 0,
    emi REAL DEFAULT 0,
    totalRepayable REAL DEFAULT 0,
    totalInterest REAL DEFAULT 0,
    totalPayments REAL DEFAULT 0,
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
    isEmiPayment INTEGER DEFAULT 0,
    upcoming INTEGER DEFAULT 0,
    imageUrl TEXT,
    imageType TEXT,
    emiDate TEXT,
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
    isLoanRelated INTEGER DEFAULT 0,
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
  'isEmiPayment',
  'emiDate',
];

export const categoryColumns = [
  'id',
  'name',
  'color',
  'type',
  'icon',
  'isLoanRelated',
];
export const accountColumns = [
  'id',
  'name',
  'uid',
  'currency',
  'totalIncome',
  'totalExpense',
  'totalBalance',
  'isLoanAccount',
  'loanAmount',
  'interestRate',
  'interestRateMode',
  'useReducingBalance',
  'totalPaid',
  'useEndDate',
  'loanStartDate',
  'loanEndDate',
  'loanYears',
  'loanMonths',
  'emi',
  'totalRepayable',
  'totalInterest',
  'totalPayments',
];
