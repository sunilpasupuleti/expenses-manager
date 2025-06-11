import {Model} from '@nozbe/watermelondb';
import {field, children, relation} from '@nozbe/watermelondb/decorators';

export default class Category extends Model {
  static table = 'categories';

  static associations = {
    transactions: {type: 'has_many', foreignKey: 'categoryId'},
    user: {type: 'belongs_to', key: 'userId'},
  };

  @field('name') name;
  @field('color') color;
  @field('type') type;
  @field('icon') icon;
  @field('isDefault') isDefault;
  @field('userId') userId;
  @relation('users', 'userId') user;
  @field('isLoanRelated') isLoanRelated;

  @children('transactions') transactions;
}
