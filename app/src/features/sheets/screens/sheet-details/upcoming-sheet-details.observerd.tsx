import {Database, Q} from '@nozbe/watermelondb';
import {
  compose,
  withDatabase,
  withObservables,
} from '@nozbe/watermelondb/react';
import {BaseUpcomingSheetDetails} from './upcoming-sheet-details.screen';

type EnhanceProps = {
  database: Database;
  accountId: string;
  searchKeyword?: string;
};

const enhance = withObservables<EnhanceProps, {}>(
  ['accountId', 'searchKeyword'],
  ({database, accountId, searchKeyword = ''}) => {
    const conditions: Q.Clause[] = [
      Q.where('accountId', accountId),
      Q.where('upcoming', true),
    ];

    if (searchKeyword?.trim()) {
      const keyword = searchKeyword.toLowerCase();
      conditions.push(
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

    const upcomingTransactions = database
      .get('transactions')
      .query(
        Q.experimentalJoinTables(['categories']),
        ...conditions,
        Q.sortBy('date', Q.asc),
      )
      .observeWithColumns(['type', 'category_id', 'date', 'time']);

    return {
      upcomingTransactions,
    };
  },
);

export const ObservedUpcomingSheetDetails = compose(
  withDatabase,
  enhance,
)(BaseUpcomingSheetDetails) as React.ComponentType<any>;
