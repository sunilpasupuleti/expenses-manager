import {Database, Q} from '@nozbe/watermelondb';
import {
  compose,
  withDatabase,
  withObservables,
} from '@nozbe/watermelondb/react';
import {SheetDetailsScreen} from './sheet-details.screen';

type EnhanceProps = {
  database: Database;
  accountId: string;
  searchKeyword?: string;
  filterParams?: {
    status: string;
    fromDate: string;
    toDate: string;
    categoryId: string;
  };
  upcoming?: string;
};

const enhance = withObservables<EnhanceProps, {}>(
  ['accountId', 'searchKeyword', 'filterParams'],
  ({database, accountId, searchKeyword, filterParams}) => {
    const conditions: Q.Clause[] = [Q.where('accountId', accountId)];

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

    if (filterParams?.status && filterParams.fromDate && filterParams.toDate) {
      conditions.push(
        Q.where('date', Q.gte(filterParams.fromDate)),
        Q.where('date', Q.lte(filterParams.toDate)),
      );
    }

    if (filterParams?.categoryId) {
      conditions.push(Q.where('categoryId', filterParams.categoryId));
    }

    const transactions = database
      .get('transactions')
      .query(
        Q.experimentalJoinTables(['categories']),
        ...conditions,
        Q.where('upcoming', false),
        Q.sortBy('date', Q.desc),
      )
      .observeWithColumns(['type', 'category_id', 'date', 'time']);
    const upcomingTransactions = database
      .get('transactions')
      .query(
        Q.experimentalJoinTables(['categories']),
        ...conditions,
        Q.where('upcoming', true),
        Q.sortBy('date', Q.asc),
      )
      .observeWithColumns(['type', 'category_id', 'date', 'time']);

    return {transactions, upcomingTransactions};
  },
);

export const ObservedSheetDetails = compose(
  withDatabase,
  enhance,
)(SheetDetailsScreen) as React.ComponentType<any>;
