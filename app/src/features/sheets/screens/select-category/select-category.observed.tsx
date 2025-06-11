// select-category.observed.tsx
import {Database, Q} from '@nozbe/watermelondb';
import {
  compose,
  withDatabase,
  withObservables,
} from '@nozbe/watermelondb/react';
import {BaseSelectCategoryScreen} from './select-category.screen';

type EnhanceProps = {
  database: Database;
  userId: string;
  type: string;
  searchKeyword?: string;
  isLoanRelated?: boolean;
};

const enhance = withObservables<EnhanceProps, {}>(
  ['userId', 'type', 'searchKeyword', 'isLoanRelated'],
  ({database, userId, type, searchKeyword = '', isLoanRelated = false}) => {
    const filters: Q.Clause[] = [
      Q.where('userId', userId),
      Q.where('type', type),
    ];

    if (isLoanRelated) {
      filters.push(Q.where('isLoanRelated', true));
    } else {
      filters.push(Q.where('isLoanRelated', false));
    }

    if (searchKeyword.trim().length > 0) {
      filters.push(
        Q.where(
          'name',
          Q.like(`%${Q.sanitizeLikeString(searchKeyword.toLowerCase())}%`),
        ),
      );
    }

    const categories = database
      .get('categories')
      .query(...filters, Q.sortBy('name', Q.asc));

    return {categories};
  },
);

export const ObservedSelectCategoryScreen = compose(
  withDatabase,
  enhance,
)(BaseSelectCategoryScreen) as React.ComponentType<any>;
