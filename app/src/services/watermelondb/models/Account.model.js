import {Model} from '@nozbe/watermelondb';
import {
  field,
  relation,
  children,
  date,
  readonly,
} from '@nozbe/watermelondb/decorators';

export default class Account extends Model {
  static table = 'accounts';

  static associations = {
    transactions: {type: 'has_many', foreignKey: 'accountId'},
    user: {type: 'belongs_to', key: 'userId'},
  };

  @field('name') name;
  @field('currency') currency;
  @field('showSummary') showSummary;
  @field('totalBalance') totalBalance;
  @field('totalIncome') totalIncome;
  @field('totalExpense') totalExpense;
  @field('archived') archived;
  @field('pinned') pinned;
  @field('userId') userId;
  @relation('users', 'userId') user;
  @field('isLoanAccount') isLoanAccount;
  @field('loanAmount') loanAmount;
  @field('useReducingBalance') useReducingBalance;
  @field('useEndDate') useEndDate;
  @field('interestRate') interestRate;
  @field('interestRateMode') interestRateMode;
  @field('loanStartDate') loanStartDate;
  @field('loanEndDate') loanEndDate;
  @field('repaymentFrequency') repaymentFrequency;
  @field('loanYears') loanYears;
  @field('loanMonths') loanMonths;
  @field('emi') emi;
  @field('totalPaid') totalPaid;
  @field('totalRepayable') totalRepayable;
  @field('totalInterest') totalInterest;
  @field('totalInterestPaid') totalInterestPaid;
  @field('totalPayments') totalPayments;

  @readonly @date('created_at') createdAt;
  @readonly @date('updated_at') updatedAt;

  @children('transactions') transactions;
}
