# Tutorial 1: Creating a Passkey-Based Wallet with Lazorkit

## 📋 Overview

In this tutorial, you'll learn how to implement a complete passkey-based authentication system using Lazorkit SDK. By the end, you'll understand how to:

- Set up Lazorkit wallet provider
- Create a login flow with WebAuthn
- Handle wallet connection states
- Implement protected routes
- Display wallet information

**Time to Complete:** 30-45 minutes  
**Difficulty:** Beginner to Intermediate

---

## 🎯 What You'll Build

A complete authentication system featuring:
- Passkey login page with biometric authentication
- Protected routes that require wallet connection
- Automatic session management
- Wallet connection status display

---

## 📚 Prerequisites

Before starting, ensure you have:
- Node.js 18+ or Bun installed
- Basic knowledge of React and Next.js
- A browser that supports WebAuthn (Chrome, Safari, Edge, Firefox)
- The LazorPass starter project set up

---

## Step 1: Understanding Passkey Authentication

### What are Passkeys?

Passkeys are a passwordless authentication method using the WebAuthn standard. They offer:

- **Hardware-backed security**: Keys stored in device secure element
- **Biometric authentication**: Face ID, Touch ID, Windows Hello
- **No passwords to remember**: Seamless user experience
- **Phishing resistant**: Cannot be stolen or replicated

### How Lazorkit Uses Passkeys

Lazorkit leverages passkeys to:
1. Generate a unique cryptographic key pair
2. Store the private key securely on your device
3. Use the public key to create a Solana smart wallet
4. Sign transactions with biometric approval

---

## Step 2: Setting Up the Wallet Provider

### Installing Dependencies

First, install the required packages:

```bash
npm install @lazorkit/wallet react-hot-toast
# or
bun add @lazorkit/wallet react-hot-toast
```

### Creating the Root Layout

Create or update `app/layout.tsx`:

```typescript
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LazorPass",
  description: "Passwordless Solana payments with passkey authentication",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`
          ${geistSans.variable}
          ${geistMono.variable}
          font-sans
          h-dvh
          grid
          grid-rows-[auto_1fr_auto]
          overflow-hidden
        `}
      >
        <header className="sticky top-0 z-50">
          <Navbar />
        </header>
        
        <main className="overflow-y-auto">
          {children}
        </main>
        
        <footer className="sticky bottom-0 z-50">
          <Footer />
        </footer>
      </body>
    </html>
  );
}
```

**Key Points:**
- Layout uses grid for sticky header/footer
- No explicit WalletProvider needed (handled by @lazorkit/wallet internally)
- Includes navigation components

---

## Step 3: Creating the Login Page

### Login Page Structure

Create `app/login/page.tsx`:

```typescript
"use client";

import { useWallet } from "@lazorkit/wallet";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const { connect, isConnected, isConnecting, wallet } = useWallet();
  const [error, setError] = useState<string | null>(null);

  // Redirect if already connected
  useEffect(() => {
    if (isConnected && wallet?.smartWallet) {
      router.replace("/solanapayWidget");
    }
  }, [isConnected, wallet, router]);

  const handleConnect = async () => {
    setError(null);
    
    try {
      // Connect with gasless transactions enabled
      await connect({ feeMode: "paymaster" });
      toast.success("Wallet connected! 🎉");
    } catch (e: unknown) {
      const err = e as Error;
      const msg = err?.message || "Connection failed";
      setError(msg);
      
      toast.error(
        msg.includes("NotAllowedError") 
          ? "Passkey cancelled" 
          : "Login failed"
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] p-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-4xl font-bold text-white mb-8">
          🔐 PassPay
        </h1>

        <div className="bg-[#1a1a1a] rounded-2xl p-8 border border-gray-800">
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="w-full py-4 bg-[#9945FF] hover:bg-[#8035E0] text-white font-semibold rounded-xl transition-all disabled:opacity-50"
          >
            {isConnecting ? "Connecting..." : "✨ Continue with Passkey"}
          </button>
          
          {error && (
            <p className="mt-4 text-red-400 text-sm">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}
```

### Understanding the Login Flow

**1. Hook Initialization**
```typescript
const { connect, isConnected, isConnecting, wallet } = useWallet();
```

- `connect()`: Initiates passkey authentication
- `isConnected`: Boolean indicating wallet connection status
- `isConnecting`: Boolean showing loading state
- `wallet`: Object containing wallet details (address, etc.)

**2. Auto-redirect Logic**
```typescript
useEffect(() => {
  if (isConnected && wallet?.smartWallet) {
    router.replace("/solanapayWidget");
  }
}, [isConnected, wallet, router]);
```

This ensures users who are already logged in skip the login page.

**3. Connection Handler**
```typescript
const handleConnect = async () => {
  try {
    await connect({ feeMode: "paymaster" });
    // Success!
  } catch (e) {
    // Handle errors
  }
};
```

The `feeMode: "paymaster"` option enables gasless transactions.

---

## Step 4: Creating Protected Routes

### Protected Layout Component

Create `app/(protected)/layout.tsx`:

```typescript
"use client";

import { useWallet } from "@lazorkit/wallet";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isConnected, wallet, isConnecting } = useWallet();
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Wait for connection check to complete
    if (isConnecting) return;

    // Redirect to login if not connected
    if (!isConnected || !wallet?.smartWallet) {
      router.replace("/login");
    } else {
      setReady(true);
    }
  }, [isConnected, wallet, isConnecting, router, pathname]);

  // Show loading state while checking
  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        Checking authentication…
      </div>
    );
  }

  return <>{children}</>;
}
```

### How Protected Routes Work

1. **Route Structure**: Place protected pages inside `app/(protected)/` folder
2. **Authentication Check**: Layout checks `isConnected` and `wallet.smartWallet`
3. **Redirect Logic**: Unauthenticated users sent to `/login`
4. **Loading State**: Prevents flash of content during auth check

### Example Protected Page

Create `app/(protected)/solanapayWidget/page.tsx`:

```typescript
"use client";

import { useWallet } from "@lazorkit/wallet";

export default function PaymentWidget() {
  const { wallet, smartWalletPubkey } = useWallet();

  return (
    <div className="p-8">
      <h1>Welcome!</h1>
      <p>Your wallet: {smartWalletPubkey?.toBase58()}</p>
      {/* Payment interface here */}
    </div>
  );
}
```

---

## Step 5: Displaying Wallet Information

### Using Wallet Data

The `useWallet` hook provides several useful properties:

```typescript
const {
  isConnected,          // Boolean: wallet connected
  isConnecting,         // Boolean: connection in progress
  wallet,               // Object: wallet details
  smartWalletPubkey,    // PublicKey: wallet address
  connect,              // Function: initiate connection
  disconnect,           // Function: disconnect wallet
} = useWallet();
```

### Example: Wallet Display Component

```typescript
"use client";

import { useWallet } from "@lazorkit/wallet";

export default function WalletInfo() {
  const { isConnected, smartWalletPubkey, disconnect } = useWallet();

  if (!isConnected) {
    return <p>Not connected</p>;
  }

  const address = smartWalletPubkey?.toBase58() || "";
  const displayAddress = `${address.slice(0, 4)}...${address.slice(-4)}`;

  return (
    <div className="border border-gray-700 rounded-lg p-4">
      <p className="text-sm text-gray-400">Connected Wallet</p>
      <p className="font-mono text-white">{displayAddress}</p>
      <button
        onClick={disconnect}
        className="mt-2 text-red-400 text-sm"
      >
        Disconnect
      </button>
    </div>
  );
}
```

---

## Step 6: Handling Connection States

### State Management Pattern

```typescript
import { useState, useEffect } from "react";
import { useWallet } from "@lazorkit/wallet";

export default function MyComponent() {
  const { isConnected, isConnecting, wallet } = useWallet();
  const [status, setStatus] = useState<"idle" | "connecting" | "connected" | "error">("idle");

  useEffect(() => {
    if (isConnecting) {
      setStatus("connecting");
    } else if (isConnected && wallet?.smartWallet) {
      setStatus("connected");
    } else {
      setStatus("idle");
    }
  }, [isConnecting, isConnected, wallet]);

  return (
    <div>
      {status === "idle" && <button>Connect Wallet</button>}
      {status === "connecting" && <p>Connecting...</p>}
      {status === "connected" && <p>Connected!</p>}
      {status === "error" && <p>Connection failed</p>}
    </div>
  );
}
```

---

## Step 7: Error Handling

### Common Errors and Solutions

**1. User Cancels Passkey Creation**
```typescript
try {
  await connect();
} catch (e) {
  if (e.message.includes("NotAllowedError")) {
    // User cancelled the passkey prompt
    toast.error("Passkey creation cancelled");
  }
}
```

**2. Browser Doesn't Support WebAuthn**
```typescript
if (!window.PublicKeyCredential) {
  toast.error("Your browser doesn't support passkeys");
  return;
}
```

**3. Connection Timeout**
```typescript
const connectWithTimeout = async () => {
  const timeout = new Promise((_, reject) => 
    setTimeout(() => reject(new Error("Connection timeout")), 30000)
  );
  
  try {
    await Promise.race([connect(), timeout]);
  } catch (e) {
    toast.error("Connection timed out. Please try again.");
  }
};
```

---

## Step 8: Testing Your Implementation

### Testing Checklist

1. **Initial Load**
   - [ ] Page loads without errors
   - [ ] Connect button is visible and enabled

2. **Passkey Creation**
   - [ ] Click "Continue with Passkey"
   - [ ] Browser shows passkey prompt
   - [ ] Biometric authentication works (Face ID/Touch ID)
   - [ ] Success toast appears after creation

3. **Auto-redirect**
   - [ ] User redirected to protected page after login
   - [ ] Wallet address displayed correctly

4. **Protected Routes**
   - [ ] Cannot access `/solanapayWidget` without login
   - [ ] Automatically redirected to `/login`

5. **Disconnect**
   - [ ] Disconnect button works
   - [ ] User redirected to login page
   - [ ] Can reconnect with same passkey

### Browser Testing

Test on multiple browsers:
- ✅ Chrome (Windows/Mac/Android)
- ✅ Safari (Mac/iOS)
- ✅ Edge (Windows)
- ✅ Firefox (Windows/Mac)

---

## 🎓 Key Concepts Explained

### 1. WebAuthn Flow

```
User clicks login
     ↓
Browser prompts for biometric
     ↓
Device generates key pair
     ↓
Private key stored in secure element
     ↓
Public key sent to Lazorkit
     ↓
Lazorkit creates smart wallet
     ↓
User logged in!
```

### 2. Smart Wallet vs Regular Wallet

**Regular Wallet:**
- User controls private key
- Must pay gas fees
- Lost key = lost funds

**Lazorkit Smart Wallet:**
- Passkey-based authentication
- Gasless transactions via paymaster
- Multi-device recovery possible
- Account abstraction features

### 3. Session Persistence

Lazorkit automatically handles session persistence:
- Passkey stored in browser's credential manager
- Session maintained across page reloads
- User doesn't need to re-authenticate

---

## 🔧 Troubleshooting

### Issue: "Passkey not supported"

**Solution:** Ensure HTTPS or localhost. WebAuthn requires secure context.

### Issue: Connection hangs indefinitely

**Solution:** Check your RPC endpoint and paymaster URL in `.env.local`.

### Issue: Redirect loop between login and protected page

**Solution:** Verify the `isConnected` and `wallet.smartWallet` checks are correct.

---

## 🚀 Next Steps

Now that you have passkey authentication working:

1. **Proceed to Tutorial 2**: Learn how to send transactions
2. **Customize the UI**: Add your branding and styles
3. **Add more features**: Transaction history, NFT display, etc.
4. **Deploy to production**: Use mainnet and real paymaster

---

## 📚 Additional Resources

- [Lazorkit Documentation](https://docs.lazorkit.com/)
- [WebAuthn Guide](https://webauthn.guide/)
- [Solana Smart Wallets](https://docs.solana.com/developing/programming-model/accounts#program-derived-address)
- [Account Abstraction Explained](https://ethereum.org/en/roadmap/account-abstraction/)

---

**Congratulations! 🎉** You've successfully implemented passkey authentication with Lazorkit. Continue to Tutorial 2 to learn about sending gasless transactions.