import _ from 'lodash';
import moment from 'moment';

// Function to group transactions by date
export const groupTransactionsByDate = transactions => {
  return _.groupBy(transactions, transaction => {
    return moment(transaction.date).format('YYYY-MM-DD');
  });
};

// Function to process and transform rows into the expected result format
export const transformSheetDetails = rows => {
  // Group transactions by date
  const groupedTransactions = _.groupBy(rows, 'date');

  return _.map(groupedTransactions, (transactions, date) => {
    const totalIncome = _.sumBy(transactions, t =>
      t.type === 'income' ? t.amount : 0,
    );
    const totalExpense = _.sumBy(transactions, t =>
      t.type === 'expense' ? t.amount : 0,
    );

    return {
      date,
      totalIncome: totalIncome || 0,
      totalExpense: totalExpense || 0,
      transactions: transactions
        .map(transaction => ({
          id: transaction.id,
          amount: transaction.amount,
          notes: transaction.notes,
          type: transaction.type,
          date: transaction.date,
          showTime: transaction.showTime,
          upcoming: transaction.upcoming,
          accountId: transaction.accountId,
          categoryId: transaction.categoryId,
          time: transaction.time,
          imageUrl: transaction.imageUrl,
          imageType: transaction.imageType,
          imageExtension: transaction.imageExtension,
          isEmiPayment: transaction.isEmiPayment,
          emiDate: transaction.emiDate,
          category: {
            id: transaction.categoryId,
            name: transaction.categoryName,
            color: transaction.categoryColor,
            type: transaction.categoryType,
            icon: transaction.categoryIcon,
          },
        }))
        .reverse(), // Reverse to maintain correct order
    };
  });
};

export const transformSheetDetailsDashboard = rows => {
  // Calculate total balance by summing all amounts in rows
  const totalBalance = _.sumBy(rows, 'amount');

  // Group transactions by category
  const groupedTransactions = _.groupBy(rows, 'categoryId');

  // Map and calculate totalAmount, totalIncome, totalExpense, and totalPercentage
  let transformedData = _.map(
    groupedTransactions,
    (transactions, categoryId) => {
      const totalAmount = _.sumBy(transactions, 'amount');
      const totalIncome = _.sumBy(transactions, t =>
        t.type === 'income' ? t.amount : 0,
      );
      const totalExpense = _.sumBy(transactions, t =>
        t.type === 'expense' ? t.amount : 0,
      );

      const firstTransaction = transactions[0]; // All transactions in this group share the same category

      // Calculate the total percentage for this category
      const totalPercentage = totalBalance
        ? ((totalAmount / totalBalance) * 100).toFixed(2)
        : 0;

      return {
        category: {
          id: categoryId,
          name: firstTransaction.categoryName,
          color: firstTransaction.categoryColor,
          type: firstTransaction.categoryType,
          icon: firstTransaction.categoryIcon,
        },
        transactions: transactions.reverse(), // Reverse the transactions if needed
        totalAmount,
        totalIncome,
        totalExpense,
        totalPercentage: parseFloat(totalPercentage), // Parse percentage as float for correct sorting
      };
    },
  );

  // Sort the data by totalPercentage in descending order
  transformedData = _.orderBy(transformedData, ['totalPercentage'], ['desc']);

  return transformedData;
};

export const transformSheetDetailsTrends = rows => {
  // Group by the dateKey (date for 14 days, month for 12 months)
  const groupedData = _.groupBy(rows, 'dateKey');

  // Map the grouped data into the desired structure
  return _.map(groupedData, (transactions, dateKey) => ({
    date: dateKey,
    totalAmount: _.sumBy(transactions, 'amount'), // Calculate total amount by summing amounts
    transactions: transactions.map(t => ({
      id: t.id,
      amount: t.amount,
      type: t.type,
      date: t.date,
      category: {
        id: t.categoryId,
        name: t.categoryName,
        color: t.categoryColor,
        icon: t.categoryIcon,
      },
    })),
  }));
};

export const transformSheetDetailsAnalytics = (rows, totalBalance) => {
  // Ensure totalBalance is a valid number
  totalBalance = totalBalance || 0;

  // Group transactions by category
  const groupedTransactions = _.groupBy(rows, 'categoryId');

  // Map the grouped transactions into the required format
  const transformedData = _.map(
    groupedTransactions,
    (transactions, categoryId) => {
      const totalAmount = _.sumBy(transactions, 'totalAmount') || 0;
      const totalIncome =
        _.sumBy(transactions, t => (t.type === 'income' ? t.amount : 0)) || 0;
      const totalExpense =
        _.sumBy(transactions, t => (t.type === 'expense' ? t.amount : 0)) || 0;

      const firstTransaction = transactions[0]; // All transactions in this group share the same category

      // Calculate totalPercentage
      const totalPercentage = totalBalance
        ? parseFloat(((totalAmount / totalBalance) * 100).toFixed(2))
        : 0;

      return {
        category: {
          id: categoryId,
          name: firstTransaction?.categoryName || 'Unknown',
          color: firstTransaction?.categoryColor || '#000000',
          type: firstTransaction?.categoryType || 'unknown',
          icon: firstTransaction?.categoryIcon || 'unknown',
        },
        transactions: transactions.map(transaction => ({
          id: transaction.id,
          amount: transaction.amount || 0,
          notes: transaction.notes || '',
          date: transaction.date || '',
          categoryId: transaction.categoryId,
        })),
        totalAmount: totalAmount,
        totalIncome: totalIncome,
        totalExpense: totalExpense,
        totalPercentage: isNaN(totalPercentage) ? 0 : totalPercentage, // Prevent NaN
      };
    },
  );

  // Sort the result by totalPercentage in descending order
  return _.orderBy(transformedData, ['totalPercentage'], ['desc']);
};

export const transformSheetExcelExportData = rows => {
  const groupedData = _.groupBy(rows, 'accountId');

  return _.map(groupedData, (transactions, accountId) => {
    const firstTransaction = transactions[0]; // All transactions share the same account info

    // Calculate total income and total expense from transactions
    const totalIncome = _.sumBy(transactions, t =>
      t.transactionType === 'income' ? t.transactionAmount : 0,
    );
    const totalExpense = _.sumBy(transactions, t =>
      t.transactionType === 'expense' ? t.transactionAmount : 0,
    );

    return {
      account: {
        id: accountId,
        name: firstTransaction.accountName,
        currency: firstTransaction.accountCurrency,
        totalIncome: totalIncome,
        totalExpense: totalExpense,
      },
      transactions: transactions.map(t => ({
        id: t.transactionId,
        amount: t.transactionAmount,
        date: t.transactionDate,
        notes: t.transactionNotes,
        type: t.transactionType,
        category: {
          id: t.categoryId,
          name: t.categoryName,
          color: t.categoryColor,
          icon: t.categoryIcon,
        },
      })),
      totalIncome,
      totalExpense,
    };
  });
};
// for backup
export const transformAccountAndTransactionData = rows => {
  // Group transactions by accountId
  const groupedByAccount = _.groupBy(rows, 'accountId');

  // Process results to map transactions to accounts
  return _.map(groupedByAccount, (transactions, accountId) => {
    // Get account details from the first transaction in the group
    const account = {
      id: accountId,
      name: transactions[0].accountName,
      type: transactions[0].accountType,
      balance: transactions[0].accountBalance,
    };

    // Map each transaction for this account
    const processedTransactions = transactions.map(transaction => ({
      id: transaction.transactionId,
      amount: transaction.transactionAmount,
      date: transaction.transactionDate,
      notes: transaction.transactionNotes,
      type: transaction.transactionType,
      category: {
        id: transaction.categoryId,
        name: transaction.categoryName,
        color: transaction.categoryColor,
        type: transaction.categoryType,
        icon: transaction.categoryIcon,
      },
    }));

    // Return the final account with transactions
    return {
      account,
      transactions: _.orderBy(processedTransactions, 'date'),
      totalAmount: _.sumBy(processedTransactions, 'amount'),
    };
  });
};

// Function to count upcoming transactions
export const countUpcomingTransactions = rows => {
  return _.filter(rows, {upcoming: 1}).length;
};
