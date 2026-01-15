'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Wallet, Check, AlertCircle, Loader2, ExternalLink, ArrowRight, QrCode, Copy, User, ClipboardCheck } from 'lucide-react';


import { useWallet } from '@lazorkit/wallet';


import {
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL,
  SystemProgram,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  createTransferInstruction,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID
} from "@solana/spl-token";

import { encodeURL, createQR } from '@solana-commerce/solana-pay';


const USDC_MINT_DEVNET = new PublicKey(
  process.env.NEXT_PUBLIC_USDC_MINT || '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'
const RPC_ENDPOINT = 'https://api.devnet.solana.com';

type PaymentStatus = 'idle' | 'processing' | 'success' | 'error';
type TokenType = 'SOL' | 'USDC';

const SolanaPayWidget = () => {

  const {
    isConnected,
    isConnecting,
    connect,
    disconnect,
    smartWalletPubkey,
    signAndSendTransaction
  } = useWallet();


  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('idle');
  const [signature, setSignature] = useState<string>('');
  const [amount, setAmount] = useState<string>('0.1');
  const [recipientAddress, setRecipientAddress] = useState<string>('');
  const [selectedToken, setSelectedToken] = useState<TokenType>('SOL');
  const [solBalance, setSolBalance] = useState<number>(0);
  const [usdcBalance, setUsdcBalance] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [qrCode, setQrCode] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isValidRecipient, setIsValidRecipient] = useState<boolean>(false);


  const connection = useMemo(() => new Connection(RPC_ENDPOINT, 'confirmed'), []);


  useEffect(() => {
    const validateAddress = () => {
      try {
        if (!recipientAddress.trim()) {
          setIsValidRecipient(false);
          return;
        }

        const pubkey = new PublicKey(recipientAddress.trim());
        setIsValidRecipient(PublicKey.isOnCurve(pubkey.toBytes()));
      } catch {
        setIsValidRecipient(false);
      }
    };

    validateAddress();
  }, [recipientAddress]);


  useEffect(() => {
    const generateQrCode = async () => {
      if (!isValidRecipient || !recipientAddress.trim() || !amount || parseFloat(amount) <= 0) {
        setQrCode('');
        return;
      }

      try {
        const recipient = new PublicKey(recipientAddress.trim());
        const amountNum = parseFloat(amount);

        if (isNaN(amountNum) || amountNum <= 0) return;


        const url = encodeURL({
          recipient: recipient,
          amount: BigInt(Math.floor(amountNum * LAMPORTS_PER_SOL)),
          label: 'Solana Payment',
          message: `Payment of ${amount} ${selectedToken}`,
          memo: `Payment via LazorKit Wallet - ${new Date().toISOString()}`,
        });


        const qrSvg = await createQR(
          url.toString(),
          200,
          '#0f172a',
          '#cbd5e1'
        );

        setQrCode(qrSvg);
      } catch (error) {
        console.error('Error generating QR code:', error);
        setQrCode('');
      }
    };

    generateQrCode();
  }, [recipientAddress, amount, selectedToken, isValidRecipient]);


  useEffect(() => {
    const fetchBalances = async () => {
      if (!isConnected || !smartWalletPubkey) return;

      try {

        const sol = await connection.getBalance(smartWalletPubkey);
        setSolBalance(sol / LAMPORTS_PER_SOL);


        try {
          const usdcATA = getAssociatedTokenAddressSync(
            USDC_MINT_DEVNET,
            smartWalletPubkey,
            true,
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID
          );
          const info = await connection.getTokenAccountBalance(usdcATA);
          setUsdcBalance(info.value.uiAmount || 0);
        } catch (e) {
          setUsdcBalance(0);
        }
      } catch (error) {
        console.error("Balance fetch error:", error);
      }
    };

    fetchBalances();
    const interval = setInterval(fetchBalances, 10000);
    return () => clearInterval(interval);
  }, [isConnected, smartWalletPubkey, connection]);


  const handlePayment = useCallback(async () => {
    if (!isConnected || !smartWalletPubkey) {
      setErrorMessage('Please connect your wallet first');
      return;
    }

    if (!recipientAddress.trim() || !isValidRecipient) {
      setErrorMessage('Please enter a valid recipient address');
      return;
    }

    setPaymentStatus('processing');
    setErrorMessage('');

    try {
      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) throw new Error('Invalid amount');

      const recipient = new PublicKey(recipientAddress.trim());
      let instruction;

      if (selectedToken === 'SOL') {
        const lamports = Math.floor(amountNum * LAMPORTS_PER_SOL);
        if (lamports > solBalance * LAMPORTS_PER_SOL) throw new Error('Insufficient SOL');

        instruction = SystemProgram.transfer({
          fromPubkey: smartWalletPubkey,
          toPubkey: recipient,
          lamports: BigInt(lamports),
        });
      } else {
        const decimals = 6;
        const tokenAmount = Math.floor(amountNum * (10 ** decimals));
        if (amountNum > usdcBalance) throw new Error('Insufficient USDC');

        const senderATA = getAssociatedTokenAddressSync(USDC_MINT_DEVNET, smartWalletPubkey, true);
        const recipientATA = getAssociatedTokenAddressSync(USDC_MINT_DEVNET, recipient, true);

        instruction = createTransferInstruction(
          senderATA,
          recipientATA,
          smartWalletPubkey,
          BigInt(tokenAmount),
          [],
          TOKEN_PROGRAM_ID
        );
      }


      const result = await signAndSendTransaction({
        instructions: [instruction],
      });

      if (result) {
        setSignature(result);
        setPaymentStatus('success');
      }


    } catch (error: any) {
      console.error("Payment failed:", error);
      setPaymentStatus('error');
      setErrorMessage(error?.message || 'Transaction rejected or failed');
    }
  }, [isConnected, smartWalletPubkey, amount, selectedToken, solBalance, usdcBalance, recipientAddress, isValidRecipient, signAndSendTransaction]);


  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };


  const displayAddress = smartWalletPubkey
    ? `${smartWalletPubkey.toBase58().slice(0, 4)}...${smartWalletPubkey.toBase58().slice(-4)}`
    : "";

  const calculateTotal = () => {
    const baseAmount = parseFloat(amount) || 0;
    return baseAmount + (selectedToken === 'SOL' ? 0.000005 : 0);
  };

  const isValidAmount = useMemo(() => {
    const num = parseFloat(amount);
    return !isNaN(num) && num > 0;
  }, [amount]);

  const canPay = useMemo(() => {
    if (!isConnected || !isValidAmount || paymentStatus === 'processing' || !isValidRecipient) return false;
    const amountNum = parseFloat(amount);
    if (selectedToken === 'SOL') {
      return amountNum <= solBalance - 0.001;
    }
    return amountNum <= usdcBalance;
  }, [isConnected, isValidAmount, paymentStatus, amount, selectedToken, solBalance, usdcBalance, isValidRecipient]);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">


          <div className="bg-slate-900/95 backdrop-blur-sm rounded-2xl border border-slate-700/70 p-6 sm:p-8 flex flex-col">
            <div className="flex items-center gap-3 mb-8">
              <div className="bg-linear-to-br from-purple-500 to-blue-600 p-3 rounded-xl">
                <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" viewBox="0 0 397.7 311.7" fill="currentColor">
                  <path d="M64.6 237.9c2.4-2.4 5.7-3.8 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1l62.7-62.7z" />
                  <path d="M64.6 3.8C67.1 1.4 70.4 0 73.8 0h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1L64.6 3.8z" />
                  <path d="M333.1 120.1c-2.4-2.4-5.7-3.8-9.2-3.8H6.5c-5.8 0-8.7 7-4.6 11.1l62.7 62.7c2.4 2.4 5.7 3.8 9.2 3.8h317.4c5.8 0 8.7-7 4.6-11.1l-62.7-62.7z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">Solana Pay Transfer</h1>
                <p className="text-slate-400 text-xs sm:text-sm">Send to any Solana address • Powered by LazorKit</p>
              </div>
            </div>

            <div className="space-y-6 flex-1">
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700/30">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <Wallet className="w-4 h-4" />
                  Your Balances
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">Solana (SOL)</span>
                    <span className="text-emerald-400 font-mono font-bold">{solBalance.toFixed(4)}</span>
                  </div>
                  <div className="h-px bg-slate-700/50"></div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">USDC Stablecoin</span>
                    <span className="text-blue-400 font-mono font-bold">{usdcBalance.toFixed(2)}</span>
                  </div>
                </div>
              </div>


              {qrCode && (
                <div className="border-t border-slate-700/70 pt-6">
                  <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                    <QrCode className="w-4 h-4" />
                    Scan QR Code
                  </h3>
                  <div className="bg-black/40 rounded-lg p-4 border border-slate-700/30 flex flex-col items-center">
                    <div
                      className="qr-code-container bg-white p-2 rounded-lg mb-3"
                      dangerouslySetInnerHTML={{ __html: qrCode }}
                    />
                    <p className="text-slate-400 text-xs text-center">
                      Scan with any Solana wallet to pre-fill payment details
                    </p>
                  </div>
                </div>
              )}

              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
                <p className="text-purple-300 text-xs">
                  🔒 Secure blockchain transfer • Send to any Solana address • Powered by LazorKit Smart Wallets
                </p>
              </div>
            </div>
          </div>


          <div className="bg-slate-900/95 backdrop-blur-sm rounded-2xl border border-slate-700/70 p-6 sm:p-8">
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-2">Send Payment</h2>
                <p className="text-slate-400 text-sm">
                  {isConnected ? `Connected: ${displayAddress}` : 'Connect your wallet to continue'}
                </p>
              </div>

              {isConnected && (
                <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                    <span className="text-emerald-300 font-mono text-sm">{displayAddress}</span>
                  </div>
                  <button
                    onClick={disconnect}
                    className="text-slate-400 hover:text-white text-xs transition-colors px-3 py-1 rounded hover:bg-slate-700/50"
                  >
                    Disconnect
                  </button>
                </div>
              )}

              <div className="space-y-4">

                <div>
                  <label className="text-slate-400 text-sm mb-2 block items-center gap-2">
                    <User className="w-3 h-3" />
                    Recipient Address
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={recipientAddress}
                      onChange={(e) => setRecipientAddress(e.target.value)}
                      disabled={paymentStatus === 'processing'}
                      placeholder="Enter Solana address (e.g., 7xKX...)"
                      className="w-full bg-slate-800/50 border border-slate-700/70 rounded-xl px-4 py-3 text-white text-sm font-mono focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all disabled:opacity-50 pr-10"
                    />
                    {recipientAddress && (
                      <button
                        onClick={() => copyToClipboard(recipientAddress)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                      >
                        {isCopied ? <ClipboardCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    )}
                  </div>
                  {recipientAddress && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${isValidRecipient ? 'bg-emerald-400' : 'bg-red-400'}`}></div>
                      <span className={`text-xs ${isValidRecipient ? 'text-emerald-400' : 'text-red-400'}`}>
                        {isValidRecipient ? 'Valid Solana address' : 'Invalid address format'}
                      </span>
                    </div>
                  )}
                </div>


                <div>
                  <label className="text-slate-400 text-sm mb-2 block">Amount</label>
                  <input
                    type="number"
                    step="0.000001"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={paymentStatus === 'processing'}
                    placeholder="0.00"
                    className="w-full bg-slate-800/50 border border-slate-700/70 rounded-xl px-4 py-3 text-white text-lg font-mono focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/20 transition-all disabled:opacity-50"
                  />
                  {!isValidAmount && amount && (
                    <p className="text-red-400 text-xs mt-1">Please enter a valid amount</p>
                  )}
                </div>


                <div>
                  <label className="text-slate-400 text-sm mb-2 block">Select Token</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedToken('SOL')}
                      disabled={paymentStatus === 'processing'}
                      className={`p-3 rounded-xl border font-medium transition-all ${selectedToken === 'SOL'
                          ? 'border-emerald-400 bg-emerald-500/10 text-emerald-300 shadow-lg shadow-emerald-500/20'
                          : 'border-slate-700 text-slate-300 hover:border-slate-600 hover:bg-slate-800/50'
                        }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <span>◎</span>
                        <span>SOL</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedToken('USDC')}
                      disabled={paymentStatus === 'processing'}
                      className={`p-3 rounded-xl border font-medium transition-all ${selectedToken === 'USDC'
                          ? 'border-blue-400 bg-blue-500/10 text-blue-300 shadow-lg shadow-blue-500/20'
                          : 'border-slate-700 text-slate-300 hover:border-slate-600 hover:bg-slate-800/50'
                        }`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <span>$</span>
                        <span>USDC</span>
                      </div>
                    </button>
                  </div>
                </div>


                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/70 space-y-2">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Amount</span>
                    <span className="font-mono">{parseFloat(amount || '0').toFixed(6)} {selectedToken}</span>
                  </div>
                  {selectedToken === 'SOL' && (
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>Network Fee</span>
                      <span className="font-mono">~0.000005 SOL</span>
                    </div>
                  )}
                  <div className="border-t border-slate-700/50 pt-2 flex justify-between text-sm sm:text-base font-bold">
                    <span className="text-white">Total</span>
                    <span className="text-white font-mono">{calculateTotal().toFixed(6)} {selectedToken}</span>
                  </div>
                </div>


                {!isConnected ? (
                  <button
                    type="button"
                    onClick={connect}
                    disabled={isConnecting}
                    className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all shadow-lg bg-linear-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white shadow-purple-500/25`}
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Connecting with Passkey...</span>
                      </>
                    ) : (
                      <>
                        <Wallet className="w-5 h-5" />
                        <span>Connect with Passkey</span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handlePayment}
                    disabled={!canPay || paymentStatus === 'processing'}
                    className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all shadow-lg ${canPay && paymentStatus === 'idle'
                        ? 'bg-linear-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 text-white shadow-emerald-500/25 hover:shadow-emerald-400/50'
                        : 'bg-slate-800/50 text-slate-400 cursor-not-allowed'
                      }`}
                  >
                    {paymentStatus === 'processing' ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <Wallet className="w-5 h-5" />
                        <span>Send {parseFloat(amount || '0').toFixed(4)} {selectedToken}</span>
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                )}


                {paymentStatus === 'success' && signature && (
                  <div className="bg-emerald-500/15 border border-emerald-500/40 rounded-xl p-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex justify-center mb-4">
                      <div className="bg-emerald-500/20 p-3 rounded-full">
                        <Check className="w-12 h-12 text-emerald-400" />
                      </div>
                    </div>
                    <div className="text-emerald-300 font-bold text-lg mb-2">Payment Successful!</div>
                    <p className="text-emerald-400/80 text-sm mb-4">
                      Sent {amount} {selectedToken} to {recipientAddress.slice(0, 8)}...{recipientAddress.slice(-4)}
                    </p>
                    <a
                      href={`https://explorer.solana.com/tx/${signature}?cluster=devnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-emerald-300 hover:text-emerald-200 font-medium text-sm underline transition-colors"
                    >
                      View on Explorer <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                )}


                {paymentStatus === 'error' && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3 text-red-400 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium mb-1">Payment Failed</p>
                      <p className="text-sm text-red-400/80">{errorMessage || 'An error occurred. Please try again.'}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-slate-500 text-xs">
            Powered by Solana Commerce Kit & LazorKit • Devnet Environment • Send to any Solana address
          </p>
        </div>
      </div>
    </div>
  );
};

export default SolanaPayWidget;