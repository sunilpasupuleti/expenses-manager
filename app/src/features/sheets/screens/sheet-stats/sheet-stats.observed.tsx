import {Database, Q} from '@nozbe/watermelondb';
import {
  compose,
  withDatabase,
  withObservables,
} from '@nozbe/watermelondb/react';
import moment from 'moment';
import {BaseSheetStatsScreen} from './sheet-stats.screen';

type EnhanceProps = {
  database: Database;
  accountId: string;
  activeType: 'income' | 'expense';
  reportKey: string;
};

const enhance = withObservables<EnhanceProps, {}>(
  ['accountId', 'activeType', 'reportKey'],
  ({database, accountId, activeType, reportKey}) => {
    const baseConditions: Q.Clause[] = [
      Q.where('accountId', accountId),
      Q.where('upcoming', false),
      Q.on('categories', Q.where('type', activeType)),
    ];

    let dateCondition = null;
    const today = moment();

    switch (reportKey) {
      case 'daily':
        dateCondition = Q.where(
          'date',
          Q.gte(today.clone().startOf('day').format('YYYY-MM-DD HH:mm:ss')),
        );
        break;
      case 'weekly':
        dateCondition = Q.where(
          'date',
          Q.gte(today.clone().startOf('week').format('YYYY-MM-DD HH:mm:ss')),
        );
        break;
      case 'lastweek':
        dateCondition = Q.and(
          Q.where(
            'date',
            Q.gte(
              today
                .clone()
                .subtract(1, 'week')
                .startOf('week')
                .format('YYYY-MM-DD HH:mm:ss'),
            ),
          ),
          Q.where(
            'date',
            Q.lte(
              today
                .clone()
                .startOf('week')
                .subtract(1, 'second')
                .format('YYYY-MM-DD HH:mm:ss'),
            ),
          ),
        );
        break;
      case 'monthly':
        dateCondition = Q.where(
          'date',
          Q.gte(today.clone().startOf('month').format('YYYY-MM-DD HH:mm:ss')),
        );
        break;
      case 'yearly':
        dateCondition = Q.where(
          'date',
          Q.gte(today.clone().startOf('year').format('YYYY-MM-DD HH:mm:ss')),
        );
        break;
      default:
        dateCondition = null;
    }

    const queries = [
      Q.experimentalJoinTables(['categories']),
      ...baseConditions,
    ];

    if (dateCondition) {
      queries.push(dateCondition);
    }

    const lastTransactions = database
      .get('transactions')
      .query(...queries, Q.sortBy('date', Q.desc))
      .observeWithColumns(['amount', 'date']);

    return {
      lastTransactions,
    };
  },
);

export const ObservedSheetStats = compose(
  withDatabase,
  enhance,
)(BaseSheetStatsScreen) as React.ComponentType<any>;
