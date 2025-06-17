/* eslint-disable react-hooks/exhaustive-deps */
import React, {createContext, ReactNode, useEffect, useState} from 'react';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import {notificationActions} from '../../store/notification-slice';
import {useDispatch} from 'react-redux';
import schema from './watermelondb_schema';
import migrations from './watermelondb_migrations';
import Database from '@nozbe/watermelondb/Database';
import User from './models/User.model';
import Account from './models/Account.model';
import Transaction from './models/Transaction.model';
import Category from './models/Category.model';
import {Model, Q} from '@nozbe/watermelondb';
import {collectionNames} from './watermelondb_tables';
import {DatabaseProvider} from '@nozbe/watermelondb/react';
import {Text} from '../../components/typography/text.component';
import {DB_NAME} from '../../../config';

type DBContextType = {
  db: Database | null;
  dbError: string | null;
  initializeDB: (reinitilize?: boolean) => void;
  createRecord: (collectionName: string, data: any | any[]) => void;
  updateRecord: (collectionName: string, id: string, updates: any) => void;
  deleteRecord: (collectionName: string, id: string) => void;
  getAllRecords: (collectionName: string) => Promise<Model[]>;
  findRecordById: (
    collectionName: string,
    keyName: string,
    value: string,
  ) => Promise<Model | null>;
  getChildRecords: (
    parentCollection: string | null,
    parentIdKey: string | null,
    parentId: string | null,
    relationName: string | null,
    options?: {
      filters?: Q.Clause[];
      sortBy?: {
        column: string;
        order?: 'asc' | 'desc';
      };
      mapRaw?: boolean;
    },
  ) => Promise<Model[]>;
  deleteAllRecords: (
    includeUserTable?: boolean,
    includeCategoriesTable?: boolean,
  ) => void;
};

export const WatermelonDBContext = createContext<DBContextType>({
  db: null,
  dbError: null,
  initializeDB: () => {},
  createRecord: () => {},
  updateRecord: () => {},
  deleteRecord: () => {},
  getAllRecords: async () => [],
  findRecordById: async () => null,
  getChildRecords: async () => [],
  deleteAllRecords: () => {},
});

export const WatermelonDBContextProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [db, setDb] = useState<Database | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const dispatch = useDispatch();

  useEffect(() => {
    const init = async () => {
      try {
        await initializeDB();
      } catch (error) {
        // Error already handled by setDbError
      } finally {
        console.log(
          '---------------Watermeleon DB Connected successfully------------------',
        );
        setIsLoading(false); // <--- Set loading to false after initialization attempt
      }
    };
    init();
  }, []);
  useEffect(() => {
    if (dbError) {
      console.log(dbError, 'DB ERROR');

      dispatch(
        notificationActions.showToast({
          status: 'error',
          message: dbError,
        }),
      );
    }
  }, [dbError]);

  const initializeDB = async (
    reinitilize: boolean = false,
  ): Promise<Database | void> => {
    return new Promise<Database | void>(async (resolve, reject) => {
      try {
        if (db && !reinitilize) {
          return resolve(); // resolve with void if DB already exists and reinit is not needed
        }

        const adapter = new SQLiteAdapter({
          schema: schema,
          migrations: migrations,
          dbName: DB_NAME,
          jsi: true,

          onSetUpError: (error: Error) => {
            throw error;
          },
        });

        const database = new Database({
          adapter: adapter,
          modelClasses: [User, Account, Transaction, Category],
        });

        setDb(database);
        resolve(database);
      } catch (error: any) {
        reject(error);
        setDbError(error.message || error.toString());
      }
    });
  };

  const createRecord = async (
    collectionName: string,
    data: Record<string, any> | Record<string, any>[],
  ): Promise<Model | void> => {
    return new Promise(async (resolve, reject) => {
      try {
        if (!db) return [];

        const collection = await db.get(collectionName);
        await db.write(async () => {
          if (Array.isArray(data)) {
            const batchRecords = data.map(item =>
              collection.prepareCreate((record: any) => {
                Object.keys(item).forEach(key => {
                  record[key] = item[key];
                });
              }),
            );

            await db.batch(...batchRecords);
            return resolve();
          } else {
            let newRecord: Model | null = null;
            newRecord = await collection.create((record: any) => {
              Object.keys(data).forEach(key => {
                record[key] = data[key];
              });
            });

            return resolve(newRecord);
          }
        });
      } catch (error: any) {
        console.error(`Create error in ${collectionName}:`, error);
        setDbError(error.message || error.toString());
        reject(error);
      }
    });
  };

  const updateRecord = (
    collectionName: string,
    id: string,
    updates: Record<string, any>,
  ): Promise<Model | null> => {
    return new Promise(async (resolve, reject) => {
      try {
        if (!db) return resolve(null);

        const collection = await db.get(collectionName);
        const record = await collection.find(id);

        await db.write(async () => {
          await record.update((rec: any) => {
            Object.keys(updates).forEach(key => {
              rec[key] = updates[key];
            });
          });
        });

        return resolve(record); // return updated record
      } catch (error: any) {
        console.error(`Update error in ${collectionName}:`, error);
        setDbError(error.message || error.toString());
        reject(error);
      }
    });
  };
  const deleteRecord = async (
    collectionName: string,
    id: string,
  ): Promise<void> => {
    try {
      if (!db) return [];

      const collection = await db.get(collectionName);
      const record = await collection.find(id);
      await db.write(async () => {
        await record.markAsDeleted(); // Soft delete
      });
    } catch (error: any) {
      console.error(`Delete error in ${collectionName}:`, error);
      setDbError(error.message || error.toString());
    }
  };

  const deleteAllRecords = async (
    includeUserTable: boolean = false,
    includeCategoriesTable: boolean = true,
  ): Promise<void> => {
    try {
      if (!db) return;

      await db.write(async () => {
        const filteredCollections = collectionNames.filter(name => {
          if (name === 'users' && !includeUserTable) return false;
          if (name === 'categories' && !includeCategoriesTable) return false;
          return true; // keep Accounts and Transactions or others
        });
        for (const name of filteredCollections) {
          const collection = await db.get(name);
          const records = await collection.query().fetch();
          for (const record of records) {
            await record.markAsDeleted();
            await record.destroyPermanently();
          }
        }
      });
    } catch (error: any) {
      console.error('Error deleting all records:', error);
      setDbError(error.message || error.toString());
    }
  };

  const getAllRecords = async (collectionName: string): Promise<any[]> => {
    try {
      if (!db) return [];
      const collection = await db.get(collectionName);
      const records = await collection.query().fetch();
      return records;
    } catch (error: any) {
      console.error(`Fetch error in ${collectionName}:`, error);
      setDbError(error.message || error.toString());
      return [];
    }
  };

  const getChildRecords = async (
    parentCollection: string | null = null,
    parentIdKey: string | null = null,
    parentId: string | null = null,
    relationName: string | null = null,
    options?: {
      filters?: Q.Clause[];
      sortBy?: {column: string; order?: 'asc' | 'desc'};
      mapRaw?: boolean;
    },
  ): Promise<Model[]> => {
    try {
      if (
        !db ||
        !parentCollection ||
        !parentId ||
        !relationName ||
        !parentIdKey
      )
        return [];
      if (parentCollection && parentId && relationName) {
        const parentCollectionRef = await db.get(parentCollection);

        const parentList = await parentCollectionRef
          .query(Q.where(parentIdKey, parentId))
          .fetch();

        const parent = parentList[0];
        if (!parent) return [];

        let relation = (parent as any)[relationName];

        if (!relation || typeof relation.fetch !== 'function') return [];

        const clauses: Q.Clause[] = [];
        if (options?.filters?.length) {
          clauses.push(...options.filters);
        }
        if (options?.sortBy) {
          clauses.push(
            Q.sortBy(
              options.sortBy.column,
              options.sortBy.order === 'desc' ? Q.desc : Q.asc,
            ),
          );
        }

        const extendedQuery = clauses.length
          ? relation.extend(...clauses)
          : relation;

        const childrenData = await extendedQuery.fetch();

        return options?.mapRaw ? childrenData.map(c => c._raw) : childrenData;
      }
    } catch (error: any) {
      console.error(`Fetch child error in ${parentCollection}:`, error);
      setDbError(error.message || error.toString());
      return [];
    }
    return [];
  };

  const findRecordById = (
    collectionName: string,
    keyName: string = 'id',
    value: string,
  ): Promise<any | null> => {
    return new Promise(async (resolve, reject) => {
      try {
        if (!db) return resolve(null);

        const collection = await db.get(collectionName);
        const records = await collection.query(Q.where(keyName, value)).fetch();

        if (!records.length) return resolve(null);

        return resolve(records[0]);
      } catch (error: any) {
        console.error(`Find error in ${collectionName}:`, error);
        setDbError(error.message || error.toString());
        return reject(error);
      }
    });
  };

  if (isLoading) {
    // You can render a loading spinner or splash screen here
    return (
      <WatermelonDBContext.Provider
        value={{
          db: db, // still null at this point, but functions won't be called directly by children yet
          dbError,
          initializeDB,
          createRecord,
          updateRecord,
          deleteRecord,
          deleteAllRecords,
          getAllRecords,
          findRecordById,
          getChildRecords,
        }}>
        {/* Render a loading indicator */}
        <Text>Loading database...</Text>
        {/* Or a more complex splash screen component */}
      </WatermelonDBContext.Provider>
    );
  } else {
    return (
      <WatermelonDBContext.Provider
        value={{
          db: db,
          dbError,
          initializeDB,
          createRecord,
          updateRecord,
          deleteRecord,
          deleteAllRecords,
          getAllRecords,
          findRecordById,
          getChildRecords,
        }}>
        <DatabaseProvider database={db!}>{children}</DatabaseProvider>
      </WatermelonDBContext.Provider>
    );
  }
};
