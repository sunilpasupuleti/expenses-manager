export const triggerNames = [
  'update_accounts_after_insert',
  'update_accounts_after_update',
  'update_accounts_after_delete',
  'update_loan_account_on_edit',
];

export const AccountsInsertTrigger = `
CREATE TRIGGER IF NOT EXISTS update_accounts_after_insert
AFTER INSERT ON Transactions
BEGIN
    UPDATE Accounts
    SET totalIncome = (
        SELECT COALESCE(SUM(amount), 0) FROM Transactions WHERE type = 'income' AND accountId = NEW.accountId AND upcoming = 0
    ),
    totalExpense = (
        SELECT COALESCE(SUM(amount), 0) FROM Transactions WHERE type = 'expense' AND accountId = NEW.accountId AND upcoming = 0
    ),
    totalPaid = (
      SELECT COALESCE(SUM(amount), 0)
      FROM Transactions
      WHERE type = 'expense' AND accountId = NEW.accountId AND upcoming = 0
    ),
    totalBalance = CASE
      WHEN isLoanAccount = 1 THEN totalRepayable - totalPaid
      ELSE totalIncome - totalExpense
    END
    WHERE id = NEW.accountId;
END;
`;

export const AccountsUpdateTrigger = `
CREATE TRIGGER IF NOT EXISTS update_accounts_after_update
AFTER UPDATE ON Transactions
BEGIN
    UPDATE Accounts
    SET totalIncome = (
        SELECT COALESCE(SUM(amount), 0) FROM Transactions WHERE type = 'income' AND accountId = NEW.accountId AND upcoming = 0
    ),
    totalExpense = (
        SELECT COALESCE(SUM(amount), 0) FROM Transactions WHERE type = 'expense' AND accountId = NEW.accountId AND upcoming = 0
    ),
    totalPaid = (
      SELECT COALESCE(SUM(amount), 0)
      FROM Transactions
      WHERE type = 'expense' AND accountId = NEW.accountId AND upcoming = 0
    ),
    totalBalance = CASE
      WHEN isLoanAccount = 1 THEN totalRepayable - totalPaid
      ELSE totalIncome - totalExpense
    END
    WHERE id = NEW.accountId;
END;
`;

export const AccountsDeleteTrigger = `
CREATE TRIGGER IF NOT EXISTS update_accounts_after_delete
AFTER DELETE ON Transactions
BEGIN
    UPDATE Accounts
    SET totalIncome = (
        SELECT COALESCE(SUM(amount), 0) FROM Transactions WHERE type = 'income' AND accountId = OLD.accountId AND upcoming = 0
    ),
    totalExpense = (
        SELECT COALESCE(SUM(amount), 0) FROM Transactions WHERE type = 'expense' AND accountId = OLD.accountId AND upcoming = 0
    ),
    totalPaid = (
      SELECT COALESCE(SUM(amount), 0)
      FROM Transactions
      WHERE type = 'expense' AND accountId = OLD.accountId AND upcoming = 0
    ),
    totalBalance = CASE
      WHEN isLoanAccount = 1 THEN totalRepayable - totalPaid
      ELSE totalIncome - totalExpense
    END
    WHERE id = OLD.accountId;

END;
`;

export const LoanAccountEditTrigger = `
CREATE TRIGGER IF NOT EXISTS update_loan_account_on_edit
AFTER UPDATE ON Accounts
WHEN NEW.isLoanAccount = 1
BEGIN
  UPDATE Accounts
  SET totalBalance = NEW.totalRepayable - NEW.totalPaid
  WHERE id = NEW.id;
END;
`;
