import {appSchema} from '@nozbe/watermelondb/Schema';
import {
  accountsTable,
  categoriesTable,
  transactionsTable,
  usersTable,
} from './watermelondb_tables';

export default appSchema({
  version: 1,
  tables: [usersTable, accountsTable, transactionsTable, categoriesTable],
});
