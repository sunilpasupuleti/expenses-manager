import {schemaMigrations} from '@nozbe/watermelondb/Schema/migrations';

export default schemaMigrations({
  migrations: [
    {
      toVersion: 2,
      steps: [
        {
          type: 'add_columns',
          table: 'accounts',
          columns: [
            {
              name: 'totalInterestPaid',
              type: 'number',
              isOptional: true,
            },
          ],
        },
      ],
    },
    // We'll add migration definitions here later
  ],
});
