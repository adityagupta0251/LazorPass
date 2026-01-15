# Tutorial 2: Building a Gasless Payment Widget with Solana Pay

## 📋 Overview

In this tutorial, you'll learn how to build a complete payment widget that enables gasless transactions on Solana. By the end, you'll understand how to:

- Fetch SOL and USDC balances
- Create Solana transactions programmatically
- Send gasless transfers using Lazorkit
- Support both SOL and SPL tokens (USDC)
- Generate Solana Pay QR codes
- Handle transaction states and errors

**Time to Complete:** 45-60 minutes  
**Difficulty:** Intermediate

---

## 🎯 What You'll Build

A production-ready payment widget featuring:
- Real-time balance display (SOL & USDC)
- Address validation with visual feedback
- Token selection (SOL/USDC)
- Amount input with validation
- Transaction summary with fee estimation
- QR code generation for mobile wallets
- Success/error states with transaction links

---

## 📚 Prerequisites

- Completed Tutorial 1 (Passkey Authentication)
- Understanding of Solana transactions
- Basic knowledge of SPL tokens
- Wallet with devnet SOL and USDC

---

## Step 1: Installing Required Dependencies

### Payment-Related Packages

```bash
npm install @solana/web3.js @solana/spl-token @solana-commerce/solana-pay lucide-react
# or
bun add @solana/web3.js @solana/spl-token @solana-commerce/solana-pay lucide-react
```

**Package Breakdown:**
- `@solana/web3.js`: Core Solana library
- `@solana/spl-token`: SPL token operations
- `@solana-commerce/solana-pay`: QR code generation
- `lucide-react`: Icon library

---

## Step 2: Setting Up Constants

Create `lib/constants.ts`:

```typescript
import { PublicKey } from '@solana/web3.js';

export const CONFIG = {
  RPC_URL: process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.devnet.solana.com',
  PORTAL_URL: process.env.NEXT_PUBLIC_LAZORKIT_PORTAL || 'https://portal.lazor.sh',
  PAYMASTER_URL: process.env.NEXT_PUBLIC_LAZORKIT_PAYMASTER,
  USDC_MINT: new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU') // Devnet USDC
};
```

**Why Constants?**
- Centralized configuration
- Easy to switch networks (devnet → mainnet)
- Type-safe token addresses

---

## Step 3: Creating the Payment Component Structure

### Basic Component Setup

Create `app/(protected)/solanapayWidget/page.tsx`:

```typescript
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Wallet, Check, AlertCircle, Loader2, ExternalLink, QrCode } from 'lucide-react';
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

// Constants
const USDC_MINT_DEVNET = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");
const RPC_ENDPOINT = 'https://api.devnet.solana.com';

type PaymentStatus = 'idle' | 'processing' | 'success' | 'error';
type TokenType = 'SOL' | 'USDC';

const SolanaPayWidget = () => {
  // We'll add state and logic here
  
  return <div>Payment Widget</div>;
};

export default SolanaPayWidget;
```

---

## Step 4: Implementing Balance Fetching

### State Management for Balances

```typescript
const SolanaPayWidget = () => {
  const { isConnected, smartWalletPubkey, signAndSendTransaction } = useWallet();
  
  // Balance states
  const [solBalance, setSolBalance] = useState<number>(0);
  const [usdcBalance, setUsdcBalance] = useState<number>(0);
  
  // Create connection instance
  const connection = useMemo(
    () => new Connection(RPC_ENDPOINT, 'confirmed'),
    []
  );
```

### Fetching SOL Balance

```typescript
useEffect(() => {
  const fetchBalances = async () => {
    if (!isConnected || !smartWalletPubkey) return;
    
    try {
      // Fetch SOL balance
      const solBalanceLamports = await connection.getBalance(smartWalletPubkey);
      const solAmount = solBalanceLamports / LAMPORTS_PER_SOL;
      setSolBalance(solAmount);
      
      // Fetch USDC balance (next step)
      
    } catch (error) {
      console.error("Balance fetch error:", error);
    }
  };

  fetchBalances();
  
  // Poll every 10 seconds for updates
  const interval = setInterval(fetchBalances, 10000);
  return () => clearInterval(interval);
}, [isConnected, smartWalletPubkey, connection]);
```

**Key Concepts:**
- `getBalance()` returns balance in lamports (1 SOL = 1,000,000,000 lamports)
- Convert to SOL by dividing by `LAMPORTS_PER_SOL`
- Poll regularly to keep balance updated

### Fetching USDC Balance

```typescript
// Inside fetchBalances() function, after SOL balance:

try {
  // Get associated token account address
  const usdcATA = getAssociatedTokenAddressSync(
    USDC_MINT_DEVNET,
    smartWalletPubkey,
    true, // allowOwnerOffCurve
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
  
  // Fetch token account balance
  const usdcAccountInfo = await connection.getTokenAccountBalance(usdcATA);
  setUsdcBalance(usdcAccountInfo.value.uiAmount || 0);
} catch (e) {
  // Account doesn't exist, balance is 0
  setUsdcBalance(0);
}
```

**Understanding Associated Token Accounts (ATA):**
- Each token requires a separate account
- ATA is deterministically derived from wallet + token mint
- `getAssociatedTokenAddressSync()` calculates the address
- Account may not exist if user never received that token

---

## Step 5: Building the Payment Form

### Form State Management

```typescript
const [recipientAddress, setRecipientAddress] = useState<string>('');
const [amount, setAmount] = useState<string>('0.1');
const [selectedToken, setSelectedToken] = useState<TokenType>('SOL');
const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('idle');
const [signature, setSignature] = useState<string>('');
const [errorMessage, setErrorMessage] = useState<string>('');
```

### Address Validation

```typescript
const [isValidRecipient, setIsValidRecipient] = useState<boolean>(false);

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
```

**Validation Logic:**
- Check if address is not empty
- Try to create `PublicKey` instance
- Verify it's a valid curve point
- Update validation state for UI feedback

### Input Components

```typescript
// Recipient Address Input
<div>
  <label className="text-slate-400 text-sm mb-2 block">
    Recipient Address
  </label>
  <input
    type="text"
    value={recipientAddress}
    onChange={(e) => setRecipientAddress(e.target.value)}
    placeholder="Enter Solana address"
    className="w-full bg-slate-800/50 border border-slate-700/70 rounded-xl px-4 py-3 text-white"
  />
  {recipientAddress && (
    <div className="mt-2 flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${
        isValidRecipient ? 'bg-emerald-400' : 'bg-red-400'
      }`} />
      <span className={`text-xs ${
        isValidRecipient ? 'text-emerald-400' : 'text-red-400'
      }`}>
        {isValidRecipient ? 'Valid Solana address' : 'Invalid address format'}
      </span>
    </div>
  )}
</div>

// Amount Input
<div>
  <label className="text-slate-400 text-sm mb-2 block">Amount</label>
  <input
    type="number"
    step="0.000001"
    min="0"
    value={amount}
    onChange={(e) => setAmount(e.target.value)}
    placeholder="0.00"
    className="w-full bg-slate-800/50 border border-slate-700/70 rounded-xl px-4 py-3 text-white text-lg font-mono"
  />
</div>
```

### Token Selection

```typescript
<div className="grid grid-cols-2 gap-3">
  <button
    onClick={() => setSelectedToken('SOL')}
    className={`p-3 rounded-xl border transition-all ${
      selectedToken === 'SOL'
        ? 'border-emerald-400 bg-emerald-500/10 text-emerald-300'
        : 'border-slate-700 text-slate-300'
    }`}
  >
    <span>◎ SOL</span>
  </button>
  
  <button
    onClick={() => setSelectedToken('USDC')}
    className={`p-3 rounded-xl border transition-all ${
      selectedToken === 'USDC'
        ? 'border-blue-400 bg-blue-500/10 text-blue-300'
        : 'border-slate-700 text-slate-300'
    }`}
  >
    <span>$ USDC</span>
  </button>
</div>
```

---

## Step 6: Creating Solana Transactions

### SOL Transfer Transaction

```typescript
const handlePayment = useCallback(async () => {
  if (!isConnected || !smartWalletPubkey || !isValidRecipient) {
    setErrorMessage('Please connect wallet and enter valid address');
    return;
  }

  setPaymentStatus('processing');
  setErrorMessage('');

  try {
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      throw new Error('Invalid amount');
    }

    const recipient = new PublicKey(recipientAddress.trim());
    let instruction;

    if (selectedToken === 'SOL') {
      // Create SOL transfer instruction
      const lamports = Math.floor(amountNum * LAMPORTS_PER_SOL);
      
      if (lamports > solBalance * LAMPORTS_PER_SOL) {
        throw new Error('Insufficient SOL');
      }

      instruction = SystemProgram.transfer({
        fromPubkey: smartWalletPubkey,
        toPubkey: recipient,
        lamports: BigInt(lamports),
      });
    }
    
    // Send transaction (we'll add this next)
    
  } catch (error: any) {
    console.error("Payment failed:", error);
    setPaymentStatus('error');
    setErrorMessage(error?.message || 'Transaction failed');
  }
}, [isConnected, smartWalletPubkey, amount, selectedToken, recipientAddress, isValidRecipient, solBalance]);
```

**Understanding the SOL Transfer:**
1. Convert amount to lamports (smallest unit)
2. Check sufficient balance
3. Create `SystemProgram.transfer()` instruction
4. Include sender, recipient, and amount

### USDC Transfer Transaction

```typescript
// Inside handlePayment, in the else block:

else {
  // USDC transfer
  const decimals = 6; // USDC uses 6 decimals
  const tokenAmount = Math.floor(amountNum * (10 ** decimals));
  
  if (amountNum > usdcBalance) {
    throw new Error('Insufficient USDC');
  }

  // Get sender's token account
  const senderATA = getAssociatedTokenAddressSync(
    USDC_MINT_DEVNET,
    smartWalletPubkey,
    true
  );

  // Get recipient's token account
  const recipientATA = getAssociatedTokenAddressSync(
    USDC_MINT_DEVNET,
    recipient,
    true
  );

  // Create transfer instruction
  instruction = createTransferInstruction(
    senderATA,        // from
    recipientATA,     // to
    smartWalletPubkey,// owner
    BigInt(tokenAmount),
    [],               // multisigners
    TOKEN_PROGRAM_ID
  );
}
```

**Key Differences from SOL:**
- Tokens use decimal places (USDC = 6 decimals)
- Requires associated token accounts for both parties
- Uses `createTransferInstruction()` instead of `SystemProgram.transfer()`

---

## Step 7: Sending Gasless Transactions

### Using Lazorkit's signAndSendTransaction

```typescript
// After creating the instruction:

const result = await signAndSendTransaction({
  instructions: [instruction],
});

if (result) {
  setSignature(result);
  setPaymentStatus('success');
}
```

**What Happens Behind the Scenes:**
1. Transaction built with your instructions
2. User prompted for passkey approval
3. Transaction signed with smart wallet
4. Paymaster covers gas fees
5. Transaction sent to Solana network
6. Signature returned

**No Need To:**
- Manually create transaction
- Request fee payer
- Calculate compute units
- Handle retries

---

## Step 8: Generating Solana Pay QR Codes

### QR Code State

```typescript
const [qrCode, setQrCode] = useState<string>('');
```

### QR Code Generation

```typescript
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

      // Create Solana Pay URL
      const url = encodeURL({
        recipient: recipient,
        amount: BigInt(Math.floor(amountNum * LAMPORTS_PER_SOL)),
        label: 'Solana Payment',
        message: `Payment of ${amount} ${selectedToken}`,
        memo: `Payment via LazorKit - ${new Date().toISOString()}`,
      });

      // Generate QR code SVG
      const qrSvg = await createQR(
        url.toString(),
        200,           // size
        '#0f172a',     // background
        '#cbd5e1'      // foreground
      );

      setQrCode(qrSvg);
    } catch (error) {
      console.error('Error generating QR code:', error);
      setQrCode('');
    }
  };

  generateQrCode();
}, [recipientAddress, amount, selectedToken, isValidRecipient]);
```

### Displaying the QR Code

```typescript
{qrCode && (
  <div className="border-t border-slate-700/70 pt-6">
    <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
      <QrCode className="w-4 h-4" />
      Scan QR Code
    </h3>
    <div className="bg-black/40 rounded-lg p-4 border border-slate-700/30">
      <div
        className="bg-white p-2 rounded-lg mb-3"
        dangerouslySetInnerHTML={{ __html: qrCode }}
      />
      <p className="text-slate-400 text-xs text-center">
        Scan with any Solana wallet to pre-fill payment details
      </p>
    </div>
  </div>
)}
```

**What Users Can Do:**
- Scan QR with mobile Solana wallet
- Payment details auto-filled
- Complete transaction on mobile
- Perfect for in-person payments

---

## Step 9: Handling Transaction States

### Success State

```typescript
{paymentStatus === 'success' && signature && (
  <div className="bg-emerald-500/15 border border-emerald-500/40 rounded-xl p-6 text-center">
    <div className="flex justify-center mb-4">
      <div className="bg-emerald-500/20 p-3 rounded-full">
        <Check className="w-12 h-12 text-emerald-400" />
      </div>
    </div>
    
    <div className="text-emerald-300 font-bold text-lg mb-2">
      Payment Successful!
    </div>
    
    <p className="text-emerald-400/80 text-sm mb-4">
      Sent {amount} {selectedToken} to {recipientAddress.slice(0, 8)}...
    </p>
    
    <a
      href={`https://explorer.solana.com/tx/${signature}?cluster=devnet`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 text-emerald-300 hover:text-emerald-200"
    >
      View on Explorer <ExternalLink className="w-4 h-4" />
    </a>
  </div>
)}
```

### Error State

```typescript
{paymentStatus === 'error' && (
  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
    <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
    <div className="flex-1">
      <p className="font-medium text-red-400 mb-1">Payment Failed</p>
      <p className="text-sm text-red-400/80">
        {errorMessage || 'An error occurred. Please try again.'}
      </p>
    </div>
  </div>
)}
```

### Loading State

```typescript
{paymentStatus === 'processing' ? (
  <button disabled className="w-full py-4 rounded-xl bg-slate-800/50">
    <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
    Processing...
  </button>
) : (
  <button onClick={handlePayment} className="w-full py-4 rounded-xl bg-emerald-500">
    Send {amount} {selectedToken}
  </button>
)}
```

---

## Step 10: Adding Transaction Summary

### Calculate Fees

```typescript
const calculateTotal = () => {
  const baseAmount = parseFloat(amount) || 0;
  // SOL transactions have ~0.000005 SOL fee (but paymaster covers it!)
  return baseAmount + (selectedToken === 'SOL' ? 0.000005 : 0);
};
```

### Display Summary

```typescript
<div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/70 space-y-2">
  <div className="flex justify-between text-xs text-slate-400">
    <span>Amount</span>
    <span className="font-mono">
      {parseFloat(amount || '0').toFixed(6)} {selectedToken}
    </span>
  </div>
  
  {selectedToken === 'SOL' && (
    <div className="flex justify-between text-xs text-slate-400">
      <span>Network Fee</span>
      <span className="font-mono">~0.000005 SOL (Sponsored)</span>
    </div>
  )}
  
  <div className="border-t border-slate-700/50 pt-2 flex justify-between font-bold">
    <span className="text-white">Total</span>
    <span className="text-white font-mono">
      {calculateTotal().toFixed(6)} {selectedToken}
    </span>
  </div>
</div>
```

---

## Step 11: Validation and Safety Checks

### Can Pay Validation

```typescript
const canPay = useMemo(() => {
  if (!isConnected || !isValidRecipient || paymentStatus === 'processing') {
    return false;
  }

  const amountNum = parseFloat(amount);
  if (isNaN(amountNum) || amountNum <= 0) {
    return false;
  }

  if (selectedToken === 'SOL') {
    // Reserve 0.001 SOL for account rent
    return amountNum <= solBalance - 0.001;
  }

  return amountNum <= usdcBalance;
}, [isConnected, isValidRecipient, paymentStatus, amount, selectedToken, solBalance, usdcBalance]);
```

**Safety Measures:**
- Require wallet connection
- Validate recipient address
- Check sufficient balance
- Prevent duplicate submissions
- Reserve SOL for account rent

---

## 🧪 Testing Your Payment Widget

### Test Checklist

1. **Balance Display**
   - [ ] SOL balance shows correctly
   - [ ] USDC balance shows correctly
   - [ ] Balances update after transactions
   - [ ] Loading states work properly

2. **Address Validation**
   - [ ] Invalid addresses show red indicator
   - [ ] Valid addresses show green indicator
   - [ ] Empty input shows neutral state

3. **SOL Transfer**
   - [ ] Enter recipient address
   - [ ] Enter amount (try 0.01 SOL)
   - [ ] Click "Send"
   - [ ] Approve with passkey
   - [ ] Transaction succeeds
   - [ ] Explorer link works

4. **USDC Transfer**
   - [ ] Select USDC token
   - [ ] Enter amount
   - [ ] Send transaction
   - [ ] Verify on explorer

5. **QR Code**
   - [ ] QR code generates for valid inputs
   - [ ] Scan with mobile wallet
   - [ ] Payment details pre-filled

6. **Error Handling**
   - [ ] Insufficient balance error
   - [ ] Invalid address error
   - [ ] User cancellation handled
   - [ ] Network errors displayed

---

## 🎓 Key Concepts Explained

### 1. Gasless Transactions

```
Traditional Flow:
User → Pay gas fee → Transaction sent

Lazorkit Flow:
User → Approve → Paymaster pays gas → Transaction sent
```

### 2. SPL Token Accounts

Every SPL token requires an Associated Token Account (ATA):
- Derived from: wallet address + token mint + programs
- Created automatically when receiving tokens
- Costs ~0.002 SOL to create (one-time)

### 3. Transaction Instructions

Solana transactions contain instructions:
```typescript
const transaction = new Transaction();
transaction.add(instruction1);
transaction.add(instruction2);
// Can have multiple instructions
```

Lazorkit simplifies this:
```typescript
signAndSendTransaction({ instructions: [instruction1, instruction2] });
```

---

## 🚀 Next Steps

### Enhancements You Can Add

1. **Transaction History**
   ```typescript
   // Store signatures in state
   const [history, setHistory] = useState<string[]>([]);
   
   // Add after successful transaction
   setHistory(prev => [signature, ...prev]);
   ```

2. **Multiple Recipients**
   ```typescript
   // Create multiple transfer instructions
   const instructions = recipients.map(r => 
     SystemProgram.transfer({...})
   );
   ```

3. **USD Price Display**
   ```typescript
   // Fetch SOL price from API
   const fetchPrice = async () => {
     const response = await fetch('https://api.coingecko.com/...');
     const data = await response.json();
     setSolPrice(data.solana.usd);
   };
   ```

4. **Scheduled Payments**
   - Store payment details
   - Execute at specified time
   - Useful for subscriptions

---

## 🐛 Common Issues and Solutions

### Issue: "Insufficient funds" but balance shows enough

**Solution:** Account rent. Reserve 0.001-0.002 SOL for rent exemption.

### Issue: USDC transfer fails with "Account not found"

**Solution:** Recipient doesn't have USDC account. Either:
- Have them receive USDC once to create account
- Add instruction to create their account (costs ~0.002 SOL)

### Issue: Transaction confirmation timeout

**Solution:** Increase confirmation timeout or use 'finalized' commitment:
```typescript
const connection = new Connection(RPC_ENDPOINT, 'finalized');
```

---

## 📚 Additional Resources

- [Solana Web3.js Docs](https://solana-labs.github.io/solana-web3.js/)
- [SPL Token Guide](https://spl.solana.com/token)
- [Solana Pay Spec](https://docs.solanapay.com/spec)
- [Transaction Fees Explained](https://docs.solana.com/transaction_fees)
- [Solana Launch Course](https://launch.solana.com/)

---

**Congratulations! 🎉** You've built a complete gasless payment widget with Solana Pay integration. Your users can now send SOL and USDC without worrying about gas fees or complex wallet setup!