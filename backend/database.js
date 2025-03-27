async function getTransactions(account = null, year = null, month = null) {
    let query = `    
        SELECT t.*,
        da.name AS debit_name,
        ca.name AS credit_name
        FROM transactions AS t
        JOIN accounts AS da ON t.debit_account_id = da.id
        JOIN accounts AS ca ON t.credit_account_id = ca.id
    `;

    const conditions = [];
    if (account) {
        conditions.push(
            `(t.debit_account_id = ${account} OR t.credit_account_id = ${account})`
        );
    }

    if (year) {
        conditions.push(
            `strftime('%Y', t.effective_date) = CAST(${year} AS TEXT)`
        );
    }

    if (month) {
        conditions.push(
            `CAST(strftime('%m', t.effective_date) AS INTEGER) = CAST(${month} AS INTEGER)`
        );
    }

    if (conditions.length) {
        query += ` WHERE ${conditions.join(" AND ")}`;
    }

    query += ` ORDER BY t.effective_date DESC`;
    return query;
}

module.exports = { getTransactions };
