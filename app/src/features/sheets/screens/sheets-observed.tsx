import {Q, Database} from '@nozbe/watermelondb';
import {withDatabase, withObservables} from '@nozbe/watermelondb/react';
import {compose} from '@nozbe/watermelondb/react';
import {SheetsScreen} from './sheets.screen';

type EnhanceProps = {
  database: Database;
  userId: string;
  searchKeyword?: string;
};

const enhance = withObservables<EnhanceProps, {}>(
  ['userId', 'searchKeyword'],
  ({database, userId, searchKeyword = ''}) => {
    const baseClause: Q.Clause[] = [Q.where('userId', userId)];

    if (searchKeyword.trim()) {
      baseClause.push(
        Q.where(
          'name',
          Q.like(`%${Q.sanitizeLikeString(searchKeyword.toLowerCase())}%`),
        ),
      );
    }

    const pinnedSheets = database
      .get('accounts')
      .query(
        ...baseClause,
        Q.where('pinned', true),
        Q.where('isLoanAccount', false),
        Q.where('archived', false),
        Q.sortBy('updated_at', Q.desc),
      )
      .observeWithColumns(['totalBalance', 'totalIncome', 'totalExpense']);

    const regularSheets = database
      .get('accounts')
      .query(
        ...baseClause,
        Q.where('pinned', false),
        Q.where('archived', false),
        Q.where('isLoanAccount', false),
        Q.sortBy('updated_at', Q.desc),
      )
      .observeWithColumns(['totalBalance', 'totalIncome', 'totalExpense']);

    const loanSheets = database
      .get('accounts')
      .query(
        ...baseClause,
        Q.where('isLoanAccount', true),
        Q.where('archived', false),
        Q.sortBy('updated_at', Q.desc),
      )
      .observeWithColumns(['totalBalance', 'totalIncome', 'totalExpense']);

    const archivedSheets = database
      .get('accounts')
      .query(
        ...baseClause,
        Q.where('archived', true),
        Q.sortBy('updated_at', Q.desc),
      )
      .observeWithColumns(['totalBalance', 'totalIncome', 'totalExpense']);

    return {
      regularSheets,
      pinnedSheets,
      loanSheets,
      archivedSheets,
    };
  },
);

export const ObservedSheets = compose(
  withDatabase,
  enhance,
)(SheetsScreen) as React.ComponentType<any>;
