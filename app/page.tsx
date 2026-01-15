import React from "react";
import Image from "next/image";

const Page = () => {
  return (
    <div className="hero bg-base-200 min-h-screen">
      <div className="hero-content flex-col lg:flex-row-reverse gap-12">
        <div className="hover-3d shrink-0 relative group">
          <figure className="max-w-79 rounded-2xl shadow-2xl overflow-hidden bg-white border border-white/10">
            <Image
              src="/3d-sol.webp"
              alt="3D interactive card"
              height={315}
              width={500}
              className="object-cover transition-transform duration-500"
              priority
            />
          </figure>

          <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="pointer-events-auto"></div>
            ))}
          </div>
        </div>

        <div className="max-w-md">
          <h1 className="text-5xl font-bold leading-tight">Lazor Pass</h1>
          <p className="py-6 text-lg opacity-80">
            LazorKit lets you build{" "}
            <span className="font-semibold">seedless Solana applications</span>{" "}
            using Face ID, Touch ID, and Windows Hello. No seed phrases. No
            extensions. Just secure smart wallets powered by WebAuthn.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Page;
