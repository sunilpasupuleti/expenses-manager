import {Q, Database} from '@nozbe/watermelondb';
import {withDatabase, withObservables} from '@nozbe/watermelondb/react';
import {CategoriesDetails} from './categories-details.component';
import {compose} from '@nozbe/watermelondb/react';

type EnhanceProps = {
  database: Database;
  userId: string;
  activeType: string;
  searchKeyword?: string;
  isLoanRelated?: boolean;
};

// Enhancer to inject the observable categories list
const enhance = withObservables<EnhanceProps, {}>(
  ['activeType', 'userId', 'searchKeyword', 'isLoanRelated'],
  ({
    database,
    userId,
    activeType,
    searchKeyword = '',
    isLoanRelated = false,
  }) => {
    const filters: Q.Clause[] = [
      Q.where('userId', userId),
      Q.where('type', activeType),
    ];

    if (isLoanRelated) {
      filters.push(Q.where('isLoanRelated', true));
    }

    if (searchKeyword.trim().length > 0) {
      filters.push(
        Q.where(
          'name',
          Q.like(`%${Q.sanitizeLikeString(searchKeyword.toLowerCase())}%`),
        ),
      );
    }

    const query = database
      .get('categories')
      .query(...filters, Q.sortBy('name', Q.asc));

    return {
      categories: query,
    };
  },
);

// Export the enhanced observed component
export const ObservedCategoriesDetails = compose(
  withDatabase,
  enhance,
)(CategoriesDetails) as React.ComponentType<any>;
