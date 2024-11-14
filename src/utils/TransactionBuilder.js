import { Address, beginCell, toNano } from "@ton/ton";

class TransactionBuilder {
  constructor() {
    this.txList = [];
  }

  add(transaction) {
    this.txList.push(transaction);
  }

  buildFinalTransaction() {
    const transaction = {
      validUntil: Math.floor(Date.now() / 1000) + 360,
      messages: [...this.txList],
    };
    return transaction;
  }

  makeJettonBurn(src, contract) {
    const body = beginCell()
      .storeUint(0x595f07bc, 32) // jetton burn op code
      .storeUint(0, 64) // query_id:uint64
      .storeCoins(1000000) // amount:(VarUInteger 16) -  Jetton amount in decimal
      .storeAddress(Address.parse(src)) // response_destination:MsgAddress - owner's wallet
      .storeUint(0, 1) // custom_payload:(Maybe ^Cell) - w/o payload typically
      .endCell();

    const transaction = {
      address: contract, // owner's jetton wallet
      amount: toNano(0.01).toString(), // for commission fees, excess will be returned
      payload: body.toBoc().toString("base64"), // payload with a jetton burn body
    };

    return transaction;
  }

  makeNftSale(to, contract) {
    const transferNftBody = beginCell()
      .storeUint(0x5fcc3d14, 32) // Opcode for NFT transfer
      .storeUint(0, 64) // query_id
      .storeAddress(Address.parse(to)) // new_owner - GetGems sale contracts deployer, should never change for this operation
      .storeAddress(Address.parse(to)) // response_destination for excesses
      .storeBit(0) // we do not have custom_payload
      .storeCoins(toNano(1).toString()) // forward_amount
      .storeBit(0) // we store forward_payload is this cell
      .storeUint(0x0fe0ede, 31) // not 32, because previous 0 will be read as do_sale opcode in deployer
      .storeRef(stateInitCell)
      .storeRef(saleBody)
      .endCell();

    const transaction = {
      address: contract, //address of the NFT Item contract, that should be placed on market
      amount: toNano(1.08).toString(), // amount that will require on gas fees, excess will be return
      payload: transferNftBody.toBoc().toString("base64"), // payload with the transferNftBody message
    };

    return transaction;
  }

  makeNftTransfer(to, jettonWalletContract) {
    const body = beginCell()
      .storeUint(0x5fcc3d14, 32) // NFT transfer op code 0x5fcc3d14
      .storeUint(0, 64) // query_id:uint64
      .storeAddress(Address.parse(to)) // new_owner:MsgAddress
      .storeAddress(Address.parse(to)) // response_destination:MsgAddress
      .storeUint(0, 1) // custom_payload:(Maybe ^Cell)
      .storeCoins(toNano(0.000000001).toString()) // forward_amount:(VarUInteger 16)
      .storeUint(0, 1) // forward_payload:(Either Cell ^Cell)
      .endCell();

    const transaction = {
      address: jettonWalletContract, // NFT Item address, which will be transferred
      amount: toNano(0.05).toString(), // for commission fees, excess will be returned
      payload: body.toBoc().toString("base64"), // payload with a NFT transfer body
    };

    return transaction;
  }

  makeToncoinTransaction(to, amount, comment) {
    const body = beginCell()
      .storeUint(0, 32) // write 32 zero bits to indicate that a text comment will follow
      .storeStringTail(comment) // write our text comment
      .endCell();

    const transaction = {
      address: to,
      amount: toNano(amount).toString(),
      payload: body.toBoc().toString("base64"), // payload with comment in body
    };

    return transaction;
  }

  makeJettonTransaction(to, amount, comment, contract) {
    const forwardPayload = beginCell()
      .storeUint(0, 32) // 0 opcode means we have a comment
      .storeStringTail(comment)
      .endCell();

    const body = beginCell()
      .storeUint(0x0f8a7ea5, 32) // opcode for jetton transfer
      .storeUint(0, 64) // query id
      .storeCoins(amount) // jetton amount, amount * 10^9
      .storeAddress(Address.parse(to)) // TON wallet destination address
      .storeAddress(Address.parse(to)) // response excess destination
      .storeBit(0) // no custom payload
      .storeCoins(toNano("0.02")) // forward amount (if >0, will send notification message)
      .storeBit(1) // we store forwardPayload as a reference
      .storeRef(forwardPayload)
      .endCell();

    const transaction = {
      address: Address.parse(contract).toString(), // sender jetton wallet
      amount: toNano("0.05").toString(), // for commission fees, excess will be returned
      payload: body.toBoc().toString("base64"), // payload with jetton transfer and comment body
    };

    return transaction;
  }
}

export default TransactionBuilder;
