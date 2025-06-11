import {Model} from '@nozbe/watermelondb';
import {field, date, readonly, children} from '@nozbe/watermelondb/decorators';

export default class User extends Model {
  static table = 'users';

  static associations = {
    accounts: {type: 'has_many', foreignKey: 'userId'},
    categories: {type: 'has_many', foreignKey: 'userId'},
  };

  @field('uid') uid;
  @field('active') active;
  @field('autoFetchTransactions') autoFetchTransactions;
  @field('brand') brand;
  @field('dailyBackupEnabled') dailyBackupEnabled;
  @field('displayName') displayName;
  @field('email') email;
  @field('fcmToken') fcmToken;
  @field('lastLogin') lastLogin;
  @field('model') model;
  @field('providerId') providerId;
  @field('phoneNumber') phoneNumber;
  @field('photoURL') photoURL;
  @field('platform') platform;
  @field('timezone') timezone;
  @field('baseCurrency') baseCurrency;
  @field('lastSynced') lastSynced;
  @field('createdAt') createdAt;
  @field('dailyReminderEnabled') dailyReminderEnabled;
  @field('dailyReminderTime') dailyReminderTime;

  @children('accounts') accounts;
  @children('categories') categories;
}
