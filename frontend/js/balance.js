const container = document.getElementById("balanceContainer");

async function populateAccounts() {
    const accounts = await (await fetch("/accounts")).json();
    accounts.forEach(async (a) => {
        const transactions = await (
            await fetch(`/transactions?account=${a.id}`)
        ).json();
        const account = document.createElement("div");
        account.className = "fSection fP-1 fG-1";
        account.innerHTML = `
            <h3>${a.name}</h3>
            <div class="fRow">
                <div class="fCol-1">
                    <p>Soll</p>
                </div>
                <div class="fCol-1">
                    <p>Haben</p>
                </div>
                
        `;
        container.appendChild(account);
    });
}
populateAccounts();
