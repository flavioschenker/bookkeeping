const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const app = express();
const db = new sqlite3.Database("./accounting.db");

// Create tables
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    effective_date DATE NOT NULL,
    booked_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    debit_account_id INTEGER NOT NULL,
    credit_account_id INTEGER NOT NULL,
    amount DECIMAL(65,2) NOT NULL,
    description TEXT,
    FOREIGN KEY(debit_account_id) REFERENCES accounts(id),
    FOREIGN KEY(credit_account_id) REFERENCES accounts(id)
  )`);
});

app.use(express.json());
app.use(express.static("../frontend"));

// Insert new Account
app.post("/accounts", (req, res) => {
  const { name, type } = req.body;
  console.log(req.body);

  db.run(
    `INSERT INTO accounts (name, type) VALUES (?, ?)`,
    [name, type],
    function (err) {
      if (err) {
        return res.status(500).send(err.message);
      } else {
        console.log(
          `New Account added: {id: ${this.lastID}, name: ${name}, type: ${type}}`
        );
        res.json({ id: this.lastID, name: name, type: type });
      }
    }
  );
});

app.get("/accounts", (req, res) => {
  const query = req.query;
  const type = query["type"];
  const typesAllowed = ["asset", "liability", "expense", "revenue"];

  let sql = `
    SELECT 
      a.id, 
      a.name, 
      a.type,
      CASE 
        WHEN a.type IN ('asset', 'expense') THEN
          COALESCE(
            (SELECT SUM(amount) FROM transactions WHERE debit_account_id = a.id), 0
          ) - COALESCE(
            (SELECT SUM(amount) FROM transactions WHERE credit_account_id = a.id), 0
          )
        WHEN a.type IN ('liability', 'revenue') THEN
          COALESCE(
            (SELECT SUM(amount) FROM transactions WHERE credit_account_id = a.id), 0
          ) - COALESCE(
            (SELECT SUM(amount) FROM transactions WHERE debit_account_id = a.id), 0
          )
        ELSE 0
      END AS balance
    FROM accounts AS a
  `;

  if (type) {
    if (!typesAllowed.includes(type)) {
      return res
        .status(400)
        .send(
          "Invalid account type. Allowed types: asset, liability, expense, revenue"
        );
    }

    sql += "WHERE a.type = ?";
  }
  sql += " GROUP BY a.id";

  db.all(sql, type ? [type] : [], (err, rows) => {
    if (err) return res.status(500).send(err.message);
    console.log(`Get ${rows.length} accounts.`);

    res.json(rows);
  });
});

// Transactions API
app.post("/transactions", (req, res) => {
  console.log(req.body);

  db.serialize(() => {
    const stmt = db.prepare(`INSERT INTO transactions 
      (effective_date, booked_timestamp, debit_account_id, credit_account_id, amount, description)
      VALUES (?, ?, ?, ?, ?, ?)`);

    stmt.run(
      req.body.effectiveDate,
      Date.now(),
      req.body.debitAccountId,
      req.body.creditAccountId,
      req.body.amount,
      req.body.description
    );
    stmt.finalize((err) => {
      if (err) return res.status(500).send(err.message);
      res.json({ success: true });
    });
  });
});

app.get("/transactions", (req, res) => {
  db.all(
    `
    SELECT 
      t.*, 
      debit_acc.name AS debit_name, 
      credit_acc.name AS credit_name 
    FROM transactions t
    JOIN accounts debit_acc ON t.debit_account_id = debit_acc.id
    JOIN accounts credit_acc ON t.credit_account_id = credit_acc.id
    ORDER BY t.effective_date DESC
    `,
    (err, rows) => {
      if (err) return res.status(500).send(err.message);
      console.log(rows);

      res.json(rows);
    }
  );
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
