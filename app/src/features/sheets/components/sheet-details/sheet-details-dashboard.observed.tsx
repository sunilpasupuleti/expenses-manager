import {Database, Q} from '@nozbe/watermelondb';
import {
  compose,
  withDatabase,
  withObservables,
} from '@nozbe/watermelondb/react';
import {BaseSheetDetailsDashboard} from './sheet-details-dashboard';

type EnhanceProps = {
  database: Database;
  accountId: string;
  activeType: string;
};

const enhance = withObservables<EnhanceProps, {}>(
  ['accountId', 'activeType'],
  ({database, accountId, activeType}) => {
    const account = database.get('accounts').findAndObserve(accountId);
    const transactionQuery = [
      Q.where('accountId', accountId),
      Q.where('upcoming', false),
    ];

    if (activeType === 'income' || activeType === 'expense') {
      transactionQuery.push(Q.where('type', activeType));
    }

    const transactions = database
      .get('transactions')
      .query(...transactionQuery, Q.sortBy('date', Q.desc));

    return {
      account,
      transactions,
    };
  },
);

export const ObservedSheetDetailsDashboard = compose(
  withDatabase,
  enhance,
)(BaseSheetDetailsDashboard);
