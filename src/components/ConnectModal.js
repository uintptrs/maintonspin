import { TonConnectButton } from "@tonconnect/ui-react";
import Image from "next/image";

export default function Modal({ Continue, connected, waiting, openModal }) {
  let text = "";

  if (waiting) {
    text = "Wait ...";
  } else if (connected) {
    text = "CLAIM REWARD !";
  } else {
    text = "Connect Wallet";
  }

  return (
    <div className="fixed flex items-center justify-center z-10 w-screen h-screen backdrop-blur-sm">
      <div className="relative flex flex-col gap-4 items-center justify-center w-[600px] h-[700px] text-center rounded-xl">
        <TonConnectButton />
        <Image src="/img/popup-bg.png" width={1000} height={1000} />
        <div className="absolute inline-block translate-y-[45px]">
          <h1 className="font-bold italic">YOU WON !</h1>
          <p className="font-normal italic">REWARD ALL ASSETS X3</p>
          <Image
            width={1000}
            height={1000}
            src="/img/ju.png"
            className="h-[120px] w-[200px] lg:h-auto lg:w-auto"
          />
          <button
            onClick={
              connected
                ? Continue
                : async () => {
                    await openModal();
                  }
            }
            disabled={waiting}
            className="p-2 bg-cover text-white font-bold rounded-md"
            style={{ backgroundImage: "url(/img/wheel-btn.png)" }}
          >
            {text}
          </button>
        </div>
      </div>
    </div>
  );
}
