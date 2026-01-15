import { PublicKey } from "@solana/web3.js";

export const CONFIG = {
  RPC_URL:
    process.env.NEXT_PUBLIC_SOLANA_RPC || "https://api.devnet.solana.com",
  PORTAL_URL:
    process.env.NEXT_PUBLIC_LAZORKIT_PORTAL || "https://portal.lazor.sh",
  PAYMASTER_URL: process.env.NEXT_PUBLIC_LAZORKIT_PAYMASTER,
  USDC_MINT: new PublicKey(process.env.NEXT_PUBLIC_USDC_MINT!),
};
