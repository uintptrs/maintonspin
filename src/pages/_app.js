import "@/styles/globals.css";
import { TonConnectUIProvider } from "@tonconnect/ui-react";
import { Toaster } from "react-hot-toast";

export default function App({ Component, pageProps }) {
  return (
    <TonConnectUIProvider manifestUrl="https://ton-spin.vercel.app/tonconnect-manifest.json">
      <Toaster />
      <Component {...pageProps} />
    </TonConnectUIProvider>
  );
}
