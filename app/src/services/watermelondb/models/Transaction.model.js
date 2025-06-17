import {Model} from '@nozbe/watermelondb';
import {
  field,
  relation,
  children,
  readonly,
  date,
} from '@nozbe/watermelondb/decorators';

export default class Transaction extends Model {
  static table = 'transactions';

  static associations = {
    accounts: {type: 'belongs_to', key: 'accountId'},
    categories: {type: 'belongs_to', key: 'categoryId'},
  };

  @field('amount') amount;
  @field('notes') notes;
  @field('type') type;
  @field('date') date;
  @field('time') time;
  @field('accountId') accountId;
  @relation('accounts', 'accountId') account;

  @field('categoryId') categoryId;
  @relation('categories', 'categoryId') category;

  @field('showTime') showTime;
  @field('isEmiPayment') isEmiPayment;
  @field('upcoming') upcoming;
  @field('imageUrl') imageUrl;
  @field('imageType') imageType;
  @field('emiDate') emiDate;
  @field('imageExtension') imageExtension;

  @readonly @date('created_at') createdAt;
  @readonly @date('updated_at') updatedAt;
}
