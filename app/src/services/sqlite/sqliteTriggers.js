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
    totalBalance = (
        (SELECT COALESCE(SUM(amount), 0) FROM Transactions WHERE type = 'income' AND accountId = NEW.accountId AND upcoming = 0 ) -
        (SELECT COALESCE(SUM(amount), 0) FROM Transactions WHERE type = 'expense' AND accountId = NEW.accountId AND upcoming = 0)
    )
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
    totalBalance = (
        (SELECT COALESCE(SUM(amount), 0) FROM Transactions WHERE type = 'income' AND accountId = NEW.accountId AND upcoming = 0) -
        (SELECT COALESCE(SUM(amount), 0) FROM Transactions WHERE type = 'expense' AND accountId = NEW.accountId AND upcoming = 0)
    )
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
    totalBalance = (
        (SELECT COALESCE(SUM(amount), 0) FROM Transactions WHERE type = 'income' AND accountId = OLD.accountId AND upcoming = 0) -
        (SELECT COALESCE(SUM(amount), 0) FROM Transactions WHERE type = 'expense' AND accountId = OLD.accountId AND upcoming = 0)
    )
    WHERE id = OLD.accountId;
END;
`;
