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
    if (isConnecting) return;

    if (!isConnected || !wallet?.smartWallet) {
      router.replace("/login");
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setReady(true);
    }
  }, [isConnected, wallet, isConnecting, router, pathname]);

  
  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        Checking authentication…
      </div>
    );
  }

  return <>{children}</>;
}
