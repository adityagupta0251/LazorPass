"use client";
import { useWallet } from "@lazorkit/wallet";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const { connect, isConnected, isConnecting, wallet } = useWallet();
  const [error, setError] = useState<string | null>(null);

  
  useEffect(() => {
    if (isConnected && wallet?.smartWallet) {
      router.replace("/solanapayWidget"); 
    }
  }, [isConnected, wallet, router]);

  const handleConnect = async () => {
    setError(null);
    try {
      await connect({ feeMode: "paymaster" });
      toast.success("Wallet connected! 🎉");
      
    } catch (e: unknown) {
      const err = e as Error;
      const msg = err?.message || "Connection failed";
      setError(msg);
      toast.error(msg.includes("NotAllowedError") ? "Passkey cancelled" : "Login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-4xl font-bold text-white mb-8">🔐 PassPay</h1>
        <div className="bg-[#1a1a1a] rounded-2xl p-8 border border-gray-800">
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="w-full py-4 bg-[#9945FF] hover:bg-[#8035E0] text-white font-semibold rounded-xl transition-all disabled:opacity-50"
          >
            {isConnecting ? "Connecting..." : "✨ Continue with Passkey"}
          </button>
          {error && <p className="mt-4 text-red-400 text-sm">{error}</p>}
        </div>
      </div>
    </div>
  );
}