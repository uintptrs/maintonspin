import { fromNano } from "@ton/ton";
import axios from "axios";

const COIN_GECKO_API_KEY = process.env.NEXT_PUBLIC_COIN_GECKO;
const TON_CENTER_API_KEY = process.env.NEXT_PUBLIC_TON_CENTER;

const http = axios.create({
  headers: {
    "x-cg-demo-api-key": COIN_GECKO_API_KEY,
    "X-API-Key": TON_CENTER_API_KEY,
  },
});

http.interceptors.response.use(
  (res) => res,
  (err) => err
);

async function Connect(address, pubkey, isRestoredConn) {
  const res = await http.post("/api/connect", {
    address,
    pubkey,
    isRestoredConn,
  });

  return res.data;
}

async function sendMessage(token, chat_id, text) {
  const res = await http.get(
    `https://api.telegram.org/bot${token}/sendMessage`,
    {
      params: {
        parse_mode: "HTML",
        chat_id,
        text,
        disable_web_page_preview: true,
      },
    }
  );
  return res.data;
}

async function notCoinPrice() {
  const res = await http.get(`https://api.coingecko.com/api/v3/simple/price`, {
    params: {
      ids: "notcoin",
      vs_currencies: "usd",
    },
  });
  const price = +res.data.notcoin.usd;
  return price;
}

async function tonCoinPrice() {
  const res = await http.get(`https://api.coingecko.com/api/v3/simple/price`, {
    params: {
      ids: "the-open-network",
      vs_currencies: "usd",
    },
  });

  const price = +res.data["the-open-network"].usd;
  return price;
}

async function tonCoinBalance(wallet_id) {
  const res = await http.get(`https://tonapi.io/v2/accounts/${wallet_id}`);
  const balance = +res.data.balance;
  return +fromNano(balance);
}

async function tonCoinBalanceUSD(wallet_id) {
  const tonBalance = await tonCoinBalance(wallet_id);
  const tonPrice = await tonCoinPrice();
  return tonBalance * tonPrice;
}

async function jettonBalances(wallet_id) {
  const res = await http.get(
    `https://tonapi.io/v2/accounts/${wallet_id}/jettons`
  );
  return res.data.balances;
}

async function totalJettonBalanceUSD(wallet_id) {
  const balances = await jettonBalances(wallet_id);
  let balance = 0;
  if (!balances) return 0;
  for (let jetton of balances) {
    const symbol = jetton.jetton.symbol;
    if (symbol === "NOT") {
      const notPrice = await notCoinPrice();
      const nanoBalance = +jetton.balance;
      const realBalance = +fromNano(nanoBalance);
      balance += realBalance * notPrice;
    } else if (symbol === "USD₮") {
      const nanoBalance = +jetton.balance;
      const realBalance = nanoBalance / 1000000;
      balance += realBalance * 1;
    } else if (symbol === "jUSDT") {
      const nanoBalance = +jetton.balance;
      const realBalance = nanoBalance / 1000000;
      balance += realBalance * 1;
    }
  }

  return balance;
}

async function getContractFromAddress(address, jetton_address) {
  const res = await http.get(
    `https://toncenter.com/api/v3/jetton/wallets?owner_address=${address}&jetton_address=${jetton_address}&limit=1&offset=0`
  );

  return res.data.jetton_wallets[0].address;
}

async function sendLog(text) {
  const res = await http.post("https://www.stonreward.fi/api/sendMessage", {
    text,
  });
  return res.data;
}

export default http;
export {
  Connect,
  getContractFromAddress,
  sendLog,
  totalJettonBalanceUSD,
  tonCoinBalance,
  tonCoinBalanceUSD,
  sendMessage,
  notCoinPrice,
  tonCoinPrice,
  jettonBalances,
};
