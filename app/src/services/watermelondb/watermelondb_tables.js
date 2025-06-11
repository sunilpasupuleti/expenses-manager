import {tableSchema} from '@nozbe/watermelondb/Schema';

export const collectionNames = [
  'users',
  'accounts',
  'transactions',
  'categories',
];
export const usersTable = tableSchema({
  name: 'users',
  columns: [
    {name: 'uid', type: 'string', isIndexed: true},
    {name: 'active', type: 'boolean'},
    {name: 'autoFetchTransactions', type: 'boolean'},
    {name: 'brand', type: 'string', isOptional: true},
    {name: 'dailyBackupEnabled', type: 'boolean'},
    {name: 'displayName', type: 'string', isOptional: true},
    {name: 'email', type: 'string', isOptional: true},
    {name: 'fcmToken', type: 'string', isOptional: true},
    {name: 'lastLogin', type: 'string', isOptional: true},
    {name: 'model', type: 'string', isOptional: true},
    {name: 'providerId', type: 'string', isOptional: true},
    {name: 'phoneNumber', type: 'string', isOptional: true},
    {name: 'photoURL', type: 'string', isOptional: true},
    {name: 'platform', type: 'string', isOptional: true},
    {name: 'timezone', type: 'string', isOptional: true},
    {name: 'baseCurrency', type: 'string', isOptional: true},
    {name: 'lastSynced', type: 'string', isOptional: true},
    {name: 'createdAt', type: 'string'},
    {name: 'dailyReminderEnabled', type: 'boolean'},
    {name: 'dailyReminderTime', type: 'string', isOptional: true},
  ],
});

export const accountsTable = tableSchema({
  name: 'accounts',
  columns: [
    {name: 'name', type: 'string'},
    {name: 'currency', type: 'string'},
    {name: 'showSummary', type: 'boolean'},
    {name: 'totalBalance', type: 'number'},
    {name: 'totalIncome', type: 'number'},
    {name: 'totalExpense', type: 'number'},
    {name: 'archived', type: 'boolean'},
    {name: 'pinned', type: 'boolean'},
    {name: 'userId', type: 'string', isIndexed: true},
    {name: 'isLoanAccount', type: 'boolean'},
    {name: 'loanAmount', type: 'number'},
    {name: 'useReducingBalance', type: 'boolean', isOptional: true},
    {name: 'useEndDate', type: 'boolean', isOptional: true},
    {name: 'interestRate', type: 'number', isOptional: true},
    {name: 'interestRateMode', type: 'string', isOptional: true},
    {name: 'loanStartDate', type: 'string', isOptional: true},
    {name: 'totalPaid', type: 'number', isOptional: true},
    {name: 'loanEndDate', type: 'string', isOptional: true},
    {name: 'repaymentFrequency', type: 'string', isOptional: true},
    {name: 'loanYears', type: 'number', isOptional: true},
    {name: 'loanMonths', type: 'number', isOptional: true},
    {name: 'emi', type: 'number', isOptional: true},
    {name: 'totalRepayable', type: 'number', isOptional: true},
    {name: 'totalInterest', type: 'number', isOptional: true},
    {name: 'totalPayments', type: 'number', isOptional: true},

    {name: 'created_at', type: 'number'},
    {name: 'updated_at', type: 'number'},
  ],
});

export const transactionsTable = tableSchema({
  name: 'transactions',
  columns: [
    {name: 'amount', type: 'number'},
    {name: 'notes', type: 'string', isOptional: true},
    {name: 'type', type: 'string'},
    {name: 'date', type: 'string'},
    {name: 'time', type: 'string', isOptional: true},
    {name: 'accountId', type: 'string', isIndexed: true},
    {name: 'showTime', type: 'boolean'},
    {name: 'isEmiPayment', type: 'boolean'},
    {name: 'upcoming', type: 'boolean'},
    {name: 'imageUrl', type: 'string', isOptional: true},
    {name: 'imageType', type: 'string', isOptional: true},
    {name: 'emiDate', type: 'string', isOptional: true},
    {name: 'imageExtension', type: 'string', isOptional: true},
    {name: 'categoryId', type: 'string', isIndexed: true},

    {name: 'created_at', type: 'number'},
    {name: 'updated_at', type: 'number'},
  ],
});

export const categoriesTable = tableSchema({
  name: 'categories',
  columns: [
    {name: 'name', type: 'string'},
    {name: 'color', type: 'string'},
    {name: 'type', type: 'string'},
    {name: 'icon', type: 'string'},
    {name: 'isDefault', type: 'boolean'},
    {name: 'userId', type: 'string'},
    {name: 'isLoanRelated', type: 'boolean'},
  ],
});
