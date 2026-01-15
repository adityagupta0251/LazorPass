"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useWallet } from "@lazorkit/wallet";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";

const USDC_MINT = new PublicKey(
  process.env.NEXT_PUBLIC_USDC_MINT ||
    "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"
);

const Navbar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();

  const { isConnected, wallet, disconnect, isConnecting } = useWallet();

  const [isScrolled, setIsScrolled] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<
    "left" | "center" | "wallet" | null
  >(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [usdcBalance, setUsdcBalance] = useState<number | null>(null);
  const [balancesLoading, setBalancesLoading] = useState(false);
  const [solPrice, setSolPrice] = useState(98.5);

  const walletDropdownRef = useRef<HTMLDivElement>(null);
  const connectionRef = useRef<Connection | null>(null);

  useEffect(() => {
    if (!connectionRef.current) {
      const rpcUrl =
        process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
        "https://api.devnet.solana.com";
      connectionRef.current = new Connection(rpcUrl, "confirmed");
    }
  }, []);

  useEffect(() => {
    if (isConnected && wallet?.smartWallet && connectionRef.current) {
      fetchBalances();
    } else {
      setSolBalance(null);
      setUsdcBalance(null);
    }
  }, [isConnected, wallet?.smartWallet]);

  const fetchBalances = async () => {
    if (!wallet?.smartWallet || !connectionRef.current) return;

    setBalancesLoading(true);
    try {
      const connection = connectionRef.current;
      const publicKey = new PublicKey(wallet.smartWallet);

      const solBalanceLamports = await connection.getBalance(publicKey);
      const solAmount = solBalanceLamports / LAMPORTS_PER_SOL;
      setSolBalance(solAmount);

      try {
        const usdcTokenAccount = getAssociatedTokenAddressSync(
          USDC_MINT,
          publicKey,
          true
        );

        const usdcAccountInfo = await connection.getTokenAccountBalance(
          usdcTokenAccount
        );

        if (usdcAccountInfo?.value?.uiAmount !== null) {
          setUsdcBalance(usdcAccountInfo.value.uiAmount);
        } else {
          setUsdcBalance(0);
        }
      } catch (usdcError) {
        console.log("USDC account not found, setting balance to 0");
        setUsdcBalance(0);
      }
    } catch (error) {
      console.error("Error fetching balances:", error);
      setSolBalance(0);
      setUsdcBalance(0);
    } finally {
      setBalancesLoading(false);
    }
  };

  useEffect(() => {
    const fetchSolPrice = async () => {
      try {
        const response = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd"
        );
        const data = await response.json();
        if (data?.solana?.usd) {
          setSolPrice(data.solana.usd);
        }
      } catch (error) {
        console.log("Using default SOL price");
      }
    };

    fetchSolPrice();

    const interval = setInterval(fetchSolPrice, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 8);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        walletDropdownRef.current &&
        !walletDropdownRef.current.contains(event.target as Node)
      ) {
        if (openDropdown === "wallet") {
          setOpenDropdown(null);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openDropdown]);

  const handleDropdownToggle = (which: "left" | "center" | "wallet") => {
    setOpenDropdown((prev) => (prev === which ? null : which));
  };

  const handleCloseAllDropdowns = () => {
    setOpenDropdown(null);
  };

  const handleWalletClick = () => {
    if (isConnected) {
      handleDropdownToggle("wallet");
    } else {
      router.push("/login");
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setOpenDropdown(null);
    setIsMobileMenuOpen(false);
  };

  const handleNavClick = (href: string) => {
    router.push(href);
    handleCloseAllDropdowns();
    setIsMobileMenuOpen(false);
  };

  const copyAddress = () => {
    if (wallet?.smartWallet) {
      navigator.clipboard.writeText(wallet.smartWallet);
      alert("Address copied to clipboard!");
    }
  };

  const viewOnExplorer = () => {
    if (wallet?.smartWallet) {
      window.open(
        `https://explorer.solana.com/address/${wallet.smartWallet}?cluster=devnet`,
        "_blank"
      );
    }
  };

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname?.startsWith(href);

  const displayAddress = wallet?.smartWallet
    ? `${wallet.smartWallet.slice(0, 4)}...${wallet.smartWallet.slice(-4)}`
    : "Connect";

  const totalBalanceUSD =
    solBalance !== null && usdcBalance !== null
      ? solBalance * solPrice + usdcBalance
      : null;

  const formatBalance = (balance: number | null, decimals: number = 4) => {
    if (balance === null) return "...";
    return balance.toFixed(decimals);
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-all duration-200 ${
        isScrolled
          ? "backdrop-blur-md bg-black/75"
          : "backdrop-blur-sm bg-black/40"
      } border-b border-white/10`}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:h-16 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div
            onClick={() => handleNavClick("/")}
            className="cursor-pointer rounded-lg border border-white/15 bg-linear-to-br from-neutral-900/80 via-neutral-800/80 to-black/80 px-2.5 py-1.5 text-xs font-semibold tracking-[0.18em] uppercase text-slate-200 shadow-[0_0_22px_rgba(15,23,42,0.65)]"
          >
            Lazor Pass
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <div className="relative" ref={walletDropdownRef}>
            <button
              onClick={handleWalletClick}
              disabled={isConnecting}
              className={`inline-flex items-center gap-2 rounded-full border px-3 sm:px-4 py-1.5 text-xs font-semibold tracking-wide transition-all duration-150
              ${
                isConnected
                  ? "border-emerald-400/70 bg-emerald-500/15 text-emerald-200 shadow-[0_0_18px_rgba(45,212,191,0.55)] hover:bg-emerald-500/20"
                  : "border-slate-400/70 bg-slate-100/5 text-slate-50 hover:bg-slate-200/10"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full animate-pulse ${
                  isConnected ? "bg-emerald-400" : "bg-slate-400"
                }`}
              />
              <span>
                {isConnecting
                  ? "Connecting..."
                  : isConnected
                  ? displayAddress
                  : "Connect Wallet"}
              </span>
              {isConnected && (
                <span
                  className={`transition-transform ${
                    openDropdown === "wallet" ? "rotate-180" : ""
                  }`}
                >
                  ▾
                </span>
              )}
            </button>

            {isConnected && openDropdown === "wallet" && (
              <div className="absolute right-0 mt-2 w-72 origin-top-right rounded-2xl border border-slate-700/70 bg-black/95 backdrop-blur-xl shadow-2xl overflow-hidden">
                <div className="bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent p-4 border-b border-white/5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Wallet
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[10px] text-emerald-400 font-medium">
                        Connected
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 font-mono text-sm text-slate-200">
                      {displayAddress}
                    </div>
                    <button
                      onClick={copyAddress}
                      className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                      title="Copy address"
                    >
                      <svg
                        className="w-4 h-4 text-slate-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="p-4 space-y-3 border-b border-white/5">
                  {balancesLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-400"></div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold text-white">
                            SOL
                          </div>
                          <div>
                            <div className="text-xs text-slate-400">Solana</div>
                            <div className="text-sm font-semibold text-white">
                              {formatBalance(solBalance)} SOL
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-slate-500">
                            {solBalance !== null
                              ? `≈ $${(solBalance * solPrice).toFixed(2)}`
                              : "..."}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-xs font-bold text-white">
                            USDC
                          </div>
                          <div>
                            <div className="text-xs text-slate-400">
                              USD Coin
                            </div>
                            <div className="text-sm font-semibold text-white">
                              {formatBalance(usdcBalance, 2)} USDC
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-slate-500">
                            {usdcBalance !== null
                              ? `≈ $${formatBalance(usdcBalance, 2)}`
                              : "..."}
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 mt-2 border-t border-white/5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-400">
                            Total Balance
                          </span>
                          <span className="text-sm font-bold text-emerald-400">
                            {totalBalanceUSD !== null
                              ? `$${totalBalanceUSD.toFixed(2)}`
                              : "..."}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={fetchBalances}
                        disabled={balancesLoading}
                        className="w-full py-1.5 text-xs text-slate-400 hover:text-slate-300 transition-colors flex items-center justify-center gap-1"
                      >
                        <svg
                          className={`w-3 h-3 ${
                            balancesLoading ? "animate-spin" : ""
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          />
                        </svg>
                        Refresh
                      </button>
                    </>
                  )}
                </div>

                <div className="p-2">
                  <button
                    onClick={viewOnExplorer}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-white/5 transition-colors"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                    View on Explorer
                  </button>

                  <button
                    onClick={copyAddress}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-white/5 transition-colors"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    Copy Address
                  </button>

                  <div className="h-px bg-white/5 my-2" />

                  <button
                    onClick={handleDisconnect}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    Disconnect Wallet
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => {
              setIsMobileMenuOpen((prev) => !prev);
              handleCloseAllDropdowns();
            }}
            className="ml-1 inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-600/60 bg-slate-900/70 text-slate-100 md:hidden"
          >
            <div className="relative h-4 w-4">
              <span
                className={`absolute left-0 top-0 h-[1.5px] w-full bg-slate-100 transition-all ${
                  isMobileMenuOpen ? "translate-y-1.5 rotate-45" : ""
                }`}
              />
              <span
                className={`absolute left-0 top-1.5 h-[1.5px] w-full bg-slate-100 transition-all ${
                  isMobileMenuOpen ? "opacity-0" : ""
                }`}
              />
              <span
                className={`absolute left-0 top-3 h-[1.5px] w-full bg-slate-100 transition-all ${
                  isMobileMenuOpen ? "-translate-y-1.5 -rotate-45" : ""
                }`}
              />
            </div>
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden px-3 pb-4">
          <div className="rounded-2xl border border-slate-700/70 bg-black/95 p-4 space-y-4 shadow-2xl">
            {isConnected && (
              <div className="bg-gradient-to-br from-emerald-500/10 to-transparent rounded-xl p-3 border border-emerald-500/20">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Wallet
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] text-emerald-400 font-medium">
                      Connected
                    </span>
                  </div>
                </div>

                <div className="font-mono text-xs text-slate-300 mb-3">
                  {displayAddress}
                </div>

                {balancesLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-400"></div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2 mb-3">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">SOL:</span>
                        <span className="text-white font-semibold">
                          {formatBalance(solBalance)}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400">USDC:</span>
                        <span className="text-white font-semibold">
                          {formatBalance(usdcBalance, 2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs pt-2 border-t border-white/10">
                        <span className="text-slate-400">Total:</span>
                        <span className="text-emerald-400 font-bold">
                          {totalBalanceUSD !== null
                            ? `$${totalBalanceUSD.toFixed(2)}`
                            : "..."}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2 mb-2">
                      <button
                        onClick={copyAddress}
                        className="flex-1 py-2 px-3 rounded-lg bg-white/5 border border-white/10 text-xs font-medium text-white"
                      >
                        Copy
                      </button>
                      <button
                        onClick={viewOnExplorer}
                        className="flex-1 py-2 px-3 rounded-lg bg-white/5 border border-white/10 text-xs font-medium text-white"
                      >
                        Explorer
                      </button>
                    </div>

                    <button
                      onClick={fetchBalances}
                      disabled={balancesLoading}
                      className="w-full py-1.5 text-xs text-slate-400 hover:text-slate-300 transition-colors flex items-center justify-center gap-1"
                    >
                      <svg
                        className={`w-3 h-3 ${
                          balancesLoading ? "animate-spin" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                      Refresh Balances
                    </button>
                  </>
                )}
              </div>
            )}

            <div className="pt-2 border-t border-white/5">
              <button
                onClick={() =>
                  isConnected
                    ? handleDisconnect()
                    : router.push("/SolanaPayWidget")
                }
                className={`w-full py-3 rounded-xl border text-sm font-medium ${
                  isConnected
                    ? "bg-red-500/10 border-red-500/30 text-red-400"
                    : "bg-white/5 border-white/10 text-white"
                }`}
              >
                {isConnected ? "Disconnect Wallet" : "Connect Wallet"}
              </button>
            </div>
          </div>
        </div>
      )}

      {openDropdown && (
        <div className="fixed inset-0 z-30" onClick={handleCloseAllDropdowns} />
      )}
    </header>
  );
};

export default Navbar;
