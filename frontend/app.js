populateAccounts();
populateTransactions();
populateForms();
addListeners();

async function populateAccounts() {
  await populateAccountsTable(`asset`);
  await populateAccountsTable(`liability`);
  await populateAccountsTable(`expense`);
  await populateAccountsTable(`revenue`);
}

async function populateAccountsTable(type) {
  typesAllowed = [null, `asset`, `liability`, `expense`, `revenue`];
  if (!typesAllowed.includes(type)) {
    throw "Invalid account type. Allowed types: asset, liability, expense, revenue";
  }
  table = document.querySelector(`#${type}Table tbody`);
  table.innerHTML = "";
  const response = await fetch(`/accounts${type ? "?type=" + type : ""}`);
  const accounts = await response.json();
  accounts.forEach((account) => {
    const row = document.createElement("tr");
    row.innerHTML = `
    <td>${account.name}</td>
    <td>${account.balance.toFixed(2)}</td>
    `;
    table.appendChild(row);
  });
}

async function populateForms() {
  const debitSelect = document.getElementById("debitAccount");
  const creditSelect = document.getElementById("creditAccount");

  debitSelect.innerHTML = "";
  creditSelect.innerHTML = "";

  const response = await fetch(`/accounts`);
  const accounts = await response.json();

  accounts.forEach((account) => {
    const option = document.createElement("option");
    option.value = account.id;
    option.textContent = `${account.name} (${account.type})`;
    debitSelect.appendChild(option.cloneNode(true));
    creditSelect.appendChild(option);
  });
}

async function populateTransactions() {
  const table = document.querySelector("#transactionTable tbody");
  table.innerHTML = "";

  const response = await fetch("/transactions");
  const transactions = await response.json();

  console.log(transactions);

  transactions.forEach((transaction) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${transaction.effective_date}</td>
      <td>${transaction.debit_name}</td>
      <td>${transaction.credit_name}</td>
      <td>${transaction.amount.toFixed(2)}</td>
      <td>${transaction.description}</td>
    `;
    table.appendChild(row);
  });
}

async function addListeners() {
  document
    .getElementById("accountForm")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const account = {
        name: document.getElementById("accountName").value,
        type: document.getElementById("accountType").value,
      };
      console.log("Submitting account:", account);

      try {
        const response = await fetch("/accounts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(account),
        });

        if (response.ok) {
          const responseData = await response.json();
          console.log("Success", responseData);
          await populateAccounts();
          await populateForms();
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      } catch (error) {
        console.error("Error creating account:", error);
        alert("Failed to create account. Please try again.");
      } finally {
        e.target.reset();
      }
    });

  document
    .getElementById("transactionForm")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      const transaction = {
        effectiveDate: document.getElementById("effectiveDate").value,
        amount: parseFloat(document.getElementById("amount").value),
        debitAccountId: document.getElementById("debitAccount").value,
        creditAccountId: document.getElementById("creditAccount").value,
        description: document.getElementById("description").value,
      };

      await fetch("/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transaction),
      });

      await populateTransactions();
      await populateAccounts();
      e.target.reset();
    });
}
