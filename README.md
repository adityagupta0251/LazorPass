# 🔐 LazorPass

**A Next.js Solana Payment Application with Passkey Authentication**

LazorPass is a modern, seedless Solana payment application built for the Superteam Vietnam Lazorkit Integration Bounty. It demonstrates how to integrate Lazorkit SDK to enable passwordless authentication using Face ID, Touch ID, or Windows Hello, combined with gasless smart wallet transactions on Solana.

[![Built with Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![Powered by Lazorkit](https://img.shields.io/badge/Powered%20by-Lazorkit-purple)](https://docs.lazorkit.com/)
[![Solana](https://img.shields.io/badge/Solana-Devnet-green)](https://solana.com/)

---

## 🎯 Project Overview

### What is LazorPass?

LazorPass is a production-ready example that showcases the future of blockchain UX on Solana. It eliminates traditional Web3 friction by:

- **No seed phrases**: Users authenticate with biometric passkeys (Face ID, Touch ID, Windows Hello)
- **No wallet extensions**: Everything runs in the browser using WebAuthn
- **No gas fees**: Transactions are sponsored by a paymaster
- **Instant onboarding**: From first visit to sending crypto in under 30 seconds

### Key Features

✨ **Passkey Authentication**
- Biometric login using WebAuthn standard
- Cross-device wallet recovery
- No passwords, no seed phrases

💸 **Solana Pay Widget**
- Send SOL and USDC to any Solana address
- Real-time balance tracking
- QR code generation for payment requests
- Transaction history on Solana Explorer

🔒 **Smart Wallet Integration**
- Gasless transactions via paymaster
- Account abstraction with Lazorkit
- Secure multi-signature wallet

🎨 **Modern UI/UX**
- Responsive design with Tailwind CSS
- Dark mode interface
- Mobile-optimized layout
- Smooth animations and transitions

---

## 🏗️ Architecture

### Tech Stack

- **Frontend Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + DaisyUI
- **Blockchain**: Solana (Devnet)
- **Authentication**: Lazorkit SDK + WebAuthn
- **Icons**: Lucide React
- **Payment QR**: @solana-commerce/solana-pay

### Project Structure

```
LazorPass/
├── app/
│   ├── (protected)/           # Protected routes requiring authentication
│   │   ├── solanapayWidget/  # Main payment interface
│   │   └── layout.tsx        # Authentication guard
│   ├── login/                # Passkey login page
│   ├── layout.tsx            # Root layout with navbar/footer
│   ├── page.tsx              # Landing page
│   └── globals.css           # Global styles
├── components/
│   ├── Navbar.tsx            # Navigation with wallet display
│   ├── Footer.tsx            # Bottom navigation dock
│   └── loginview.tsx         # Alternative login component
├── lib/
│   └── constants.ts          # Configuration constants
├── public/                   # Static assets
└── .env.local               # Environment variables
```

---

## 🚀 Quick Start Guide

### Prerequisites

Before you begin, ensure you have:

- **Node.js 18+** or **Bun** installed
- A modern browser with WebAuthn support (Chrome, Safari, Edge)
- Basic understanding of React and Next.js
- A Solana wallet with devnet SOL (optional, for testing)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/adityagupta0251/LazorPass.git
cd LazorPass
```

2. **Install dependencies**

Using npm:
```bash
npm install
```

Using bun (faster):
```bash
bun install
```

3. **Configure environment variables**

Create a `.env.local` file in the root directory:

```env
# Lazorkit Configuration
NEXT_PUBLIC_SOLANA_RPC=https://api.devnet.solana.com
NEXT_PUBLIC_LAZORKIT_PORTAL=https://portal.lazor.sh
NEXT_PUBLIC_LAZORKIT_PAYMASTER=https://kora.devnet.lazorkit.com

# Token Mints (Devnet)
NEXT_PUBLIC_USDC_MINT=4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
```

**Environment Variables Explained:**

- `NEXT_PUBLIC_SOLANA_RPC`: RPC endpoint for Solana network (devnet/mainnet)
- `NEXT_PUBLIC_LAZORKIT_PORTAL`: Lazorkit portal URL for wallet management
- `NEXT_PUBLIC_LAZORKIT_PAYMASTER`: Paymaster service for gasless transactions
- `NEXT_PUBLIC_USDC_MINT`: USDC token mint address (devnet version)

4. **Run the development server**

```bash
npm run dev
# or
bun dev
```

5. **Open the application**

Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📖 SDK Installation & Configuration

### Installing Lazorkit SDK

The project uses the following Lazorkit packages:

```bash
npm install @lazorkit/wallet
# or
bun add @lazorkit/wallet
```

### Required Solana Dependencies

```bash
npm install @solana/web3.js @solana/spl-token @solana-commerce/solana-pay
```

### Setting Up Lazorkit Provider

Wrap your app with Lazorkit's wallet provider in your root layout:

```typescript
// app/layout.tsx
import { WalletProvider } from '@lazorkit/wallet';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <WalletProvider 
          config={{
            rpcUrl: process.env.NEXT_PUBLIC_SOLANA_RPC,
            portalUrl: process.env.NEXT_PUBLIC_LAZORKIT_PORTAL,
            paymasterUrl: process.env.NEXT_PUBLIC_LAZORKIT_PAYMASTER,
          }}
        >
          {children}
        </WalletProvider>
      </body>
    </html>
  );
}
```

### Using the Wallet Hook

Import and use the wallet hook in your components:

```typescript
import { useWallet } from '@lazorkit/wallet';

export default function MyComponent() {
  const { 
    isConnected, 
    wallet, 
    connect, 
    disconnect,
    smartWalletPubkey,
    signAndSendTransaction 
  } = useWallet();

  return (
    <button onClick={connect}>
      {isConnected ? 'Connected' : 'Connect Wallet'}
    </button>
  );
}
```

---

## 💻 How to Run the Example

### Step 1: Start the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

### Step 2: Create Your Passkey Wallet

1. Navigate to the login page (`/login`)
2. Click "✨ Continue with Passkey"
3. Your browser will prompt you to create a passkey using:
   - Face ID (macOS, iOS)
   - Touch ID (macOS)
   - Windows Hello (Windows)
   - Security key (any device)

### Step 3: Send a Test Transaction

1. After login, you'll be redirected to the payment widget
2. Your wallet address and balances appear in the navbar
3. To send SOL or USDC:
   - Enter a recipient Solana address
   - Enter the amount
   - Select SOL or USDC
   - Click "Send"
4. Approve the transaction with your passkey
5. View the transaction on Solana Explorer

### Step 4: Test on Mobile

1. Open `http://YOUR_LOCAL_IP:3000` on your mobile device
2. Use Face ID or Touch ID to authenticate
3. Full mobile-responsive interface works seamlessly

---

## 🎓 What You'll Learn

By exploring this codebase, you'll understand:

1. **Passkey Authentication Flow**
   - WebAuthn integration with Lazorkit
   - Biometric authentication without passwords
   - Cross-device wallet recovery

2. **Smart Wallet Transactions**
   - Creating and signing Solana transactions
   - Using a paymaster for gasless transactions
   - SPL token transfers (USDC)

3. **Solana Pay Integration**
   - Generating payment QR codes
   - Encoding transaction URLs
   - Mobile wallet compatibility

4. **Real-time Balance Tracking**
   - Fetching SOL and SPL token balances
   - Associated token account management
   - Price feeds integration

5. **Protected Routes in Next.js**
   - Authentication guards
   - Middleware for wallet verification
   - Redirect flows

---

## 🔗 Resources

### Official Documentation

- **Lazorkit Docs**: [https://docs.lazorkit.com/](https://docs.lazorkit.com/)
- **Solana Docs**: [https://docs.solana.com/](https://docs.solana.com/)
- **Solana Pay**: [https://docs.solanapay.com/](https://docs.solanapay.com/)
- **WebAuthn Guide**: [https://webauthn.guide/](https://webauthn.guide/)

### Learning Resources

- **Solana Launch**: [https://launch.solana.com/](https://launch.solana.com/) - Comprehensive Solana development course
- **Lazorkit Telegram**: [https://t.me/lazorkit](https://t.me/lazorkit)
- **Lazorkit GitHub**: [https://github.com/lazor-kit/lazor-kit](https://github.com/lazor-kit/lazor-kit)

### Tools & Explorers

- **Solana Explorer (Devnet)**: [https://explorer.solana.com/?cluster=devnet](https://explorer.solana.com/?cluster=devnet)
- **Devnet Faucet**: [https://faucet.solana.com/](https://faucet.solana.com/)
- **Solana Playground**: [https://beta.solpg.io/](https://beta.solpg.io/)

---

## 📚 Step-by-Step Tutorials

For detailed implementation guides, check out these tutorials:

1. **[Tutorial 1: Creating a Passkey-Based Wallet](./Tutorial1.md)**
   - Setting up authentication flow
   - Understanding WebAuthn integration
   - Handling wallet connection states

2. **[Tutorial 2: Building a Gasless Payment Widget](./Tutorial2.md)**
   - Creating Solana transactions
   - Implementing gasless transfers
   - Adding USDC support
   - Generating payment QR codes

---

## 🏆 Hackathon Context

This project was built for the **Superteam Vietnam Lazorkit Integration Bounty**, which challenges developers to:

- Create practical, reusable code examples
- Demonstrate Lazorkit SDK integration
- Improve Solana developer onboarding
- Showcase real-world passkey authentication

**Bounty Goals:**
- Help developers get started with Lazorkit
- Provide clear integration examples
- Create starter templates for new projects
- Demonstrate gasless transaction patterns

---

## 🎨 Features Walkthrough

### 1. Landing Page (`/`)
- Hero section with 3D Solana logo
- Project introduction
- Call-to-action to connect wallet

### 2. Login Page (`/login`)
- Minimalist passkey authentication
- Error handling for failed connections
- Automatic redirect after successful login

### 3. Payment Widget (`/solanapayWidget`)
- Wallet balance display (SOL & USDC)
- Address validation with visual feedback
- Token selection (SOL/USDC)
- Amount input with validation
- Transaction summary
- QR code generation
- Success/error states
- Explorer link for completed transactions

### 4. Navigation Components
- **Navbar**: Wallet connection status, balance summary, disconnect option
- **Footer**: Dock-style navigation with active state indicators

---

## 🔒 Security Considerations

- **Passkeys are stored locally**: Never transmitted to servers
- **Private keys never exposed**: Managed by Lazorkit smart wallet
- **Devnet only**: This example runs on Solana devnet for testing
- **Client-side validation**: All inputs validated before transactions
- **Error boundaries**: Graceful handling of connection failures

---

## 🚢 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

```bash
npm run build
```

### Deploy to Other Platforms

The project is a standard Next.js app and can be deployed to:
- Netlify
- Railway
- AWS Amplify
- Cloudflare Pages

---

## 🤝 Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is open source and available under the MIT License.

---

## 👨‍💻 Author

**Aditya Gupta**
- GitHub: [@adityagupta0251](https://github.com/adityagupta0251)
- Project: [LazorPass](https://github.com/adityagupta0251/LazorPass)

---

## 🙏 Acknowledgments

- **Superteam Vietnam** for organizing the bounty
- **Lazorkit Team** for the excellent SDK and documentation
- **Solana Foundation** for the learning resources
- **Solana Launch** program for comprehensive tutorials

---

## 📞 Support

If you have questions or need help:

- Open an issue on [GitHub](https://github.com/adityagupta0251/LazorPass/issues)
- Join the [Lazorkit Telegram](https://t.me/lazorkit)
- Check the [Lazorkit Documentation](https://docs.lazorkit.com/)

---

**Built with ❤️ using Lazorkit, Next.js, and Solana**