"use client";

import { useWallet } from "@lazorkit/wallet";

export default function LoginView() {
  const { connect, isConnecting } = useWallet();

  const handleLogin = async () => {
    try {
      await connect();
    } catch (error) {
      console.error("Passkey login failed:", error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
      <div className="w-16 h-16 bg-linear-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center text-3xl text-white font-bold shadow-lg">
        L
      </div>
      <h1 className="text-4xl font-bold text-gray-900">
        Lazorkit Solana Starter
      </h1>
      <p className="text-gray-600 max-w-md">
        Experience the future of Solana. Login with FaceID or TouchID. No seed
        phrases, no gas fees.
      </p>

      <button
        onClick={handleLogin}
        disabled={isConnecting}
        className="px-8 py-4 bg-gray-900 text-white rounded-full font-bold text-lg hover:bg-gray-800 transition-all transform hover:scale-105 disabled:opacity-50 shadow-xl"
      >
        {isConnecting ? "Authenticating..." : "🔑 Login with Passkey"}
      </button>
    </div>
  );
}
