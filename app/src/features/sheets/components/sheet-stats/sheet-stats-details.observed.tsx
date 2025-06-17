import {Database, Q} from '@nozbe/watermelondb';
import {
  compose,
  withDatabase,
  withObservables,
} from '@nozbe/watermelondb/react';
import moment from 'moment';
import {BaseSheetStatsDetailsScreen} from './sheet-stats-details.screen';

type EnhanceProps = {
  database: Database;
  accountId: string;
  category: any; // adjust to your Category model type
  reportKey: string | null;
  searchKeyword: string;
};

const enhance = withObservables<EnhanceProps, {}>(
  ['accountId', 'category', 'reportKey', 'searchKeyword'],
  ({database, accountId, category, reportKey, searchKeyword}) => {
    const baseConditions: Q.Clause[] = [
      Q.where('accountId', accountId),
      Q.where('upcoming', false),
      Q.where('categoryId', category.id),
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

    if (searchKeyword?.trim()) {
      const keyword = searchKeyword.toLowerCase();
      baseConditions.push(
        Q.or(
          Q.where('notes', Q.like(`%${Q.sanitizeLikeString(keyword)}%`)),
          Q.where('amount', Q.like(`%${Q.sanitizeLikeString(keyword)}%`)),
          Q.on(
            'categories',
            Q.where('name', Q.like(`%${Q.sanitizeLikeString(keyword)}%`)),
          ),
        ),
      );
    }

    const queries = [...baseConditions];
    if (dateCondition) queries.push(dateCondition);

    const transactions = database
      .get('transactions')
      .query(
        Q.experimentalJoinTables(['categories']),
        ...queries,
        Q.sortBy('date', Q.desc),
      )
      .observeWithColumns(['amount', 'date']);

    return {transactions};
  },
);

export const ObservedSheetStatsDetails = compose(
  withDatabase,
  enhance,
)(BaseSheetStatsDetailsScreen) as React.ComponentType<any>;
