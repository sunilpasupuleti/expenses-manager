import {Database, Q} from '@nozbe/watermelondb';
import {
  compose,
  withDatabase,
  withObservables,
} from '@nozbe/watermelondb/react';
import {BaseSheetTrendsScreen} from './sheet-trends.screen';
import moment from 'moment';

type EnhanceProps = {
  database: Database;
  accountId: string;
  activeType: 'income' | 'expense';
};

const enhance = withObservables<EnhanceProps, {}>(
  ['accountId', 'activeType'],
  ({database, accountId, activeType}) => {
    const baseConditions = [
      Q.where('accountId', accountId),
      Q.where('upcoming', false),
      Q.on('categories', Q.where('type', activeType)),
    ];

    const last14daysCutoff = moment()
      .subtract(13, 'days')
      .startOf('day')
      .format('YYYY-MM-DD HH:mm:ss');
    const last12monthsCutoff = moment()
      .subtract(11, 'months')
      .startOf('month')
      .format('YYYY-MM-DD HH:mm:ss');

    const last14DaysTransactions = database
      .get('transactions')
      .query(
        Q.experimentalJoinTables(['categories']),
        ...baseConditions,
        Q.where('date', Q.gte(last14daysCutoff)),
        Q.sortBy('date', Q.asc),
      )
      .observeWithColumns(['amount', 'date']);

    const last12MonthsTransactions = database
      .get('transactions')
      .query(
        Q.experimentalJoinTables(['categories']),
        ...baseConditions,
        Q.where('date', Q.gte(last12monthsCutoff)),
        Q.sortBy('date', Q.asc),
      )
      .observeWithColumns(['amount', 'date']);

    return {
      last14DaysTransactions,
      last12MonthsTransactions,
    };
  },
);

export const ObservedSheetTrends = compose(
  withDatabase,
  enhance,
)(BaseSheetTrendsScreen) as React.ComponentType<any>;
