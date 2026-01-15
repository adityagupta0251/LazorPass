"use client";

import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const Footer: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter(); 
  const [hoveredItem, setHoveredItem] = useState<"home" |  "workspace" | null>(null);

  
  const dockItems = [
    {
      id: "home" as const,
      label: "Home",
      path: "/",
      icon: (
        <svg className="size-[1.2em]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <g fill="currentColor" strokeLinejoin="miter" strokeLinecap="butt">
            <polyline points="1 11 12 2 23 11" fill="none" stroke="currentColor" strokeMiterlimit="10" strokeWidth="2" />
            <path d="m5,13v7c0,1.105.895,2,2,2h10c1.105,0,2-.895,2-2v-7" fill="none" stroke="currentColor" strokeLinecap="square" strokeMiterlimit="10" strokeWidth="2" />
            <line x1="12" y1="22" x2="12" y2="18" fill="none" stroke="currentColor" strokeLinecap="square" strokeMiterlimit="10" strokeWidth="2" />
          </g>
        </svg>
      ),
    },
    
    {
      id: "solanapayWidget" as const,
      label: "solanapayWidget",
      path: "/solanapayWidget",
      icon: (
        <svg className="size-[1.2em]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
          </g>
        </svg>
      ),
    },
  ];

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname?.startsWith(path);
  };

  
  const handleNavClick = (path: string) => {
    router.push(path);
  };

  const dockSizeClass = "w-[18rem] sm:w-[20rem] md:w-[22rem] lg:w-[24rem] xl:w-[26rem]";

  return (
    <footer className="fixed bottom-6 left-1/2 z-40 w-screen -translate-x-1/2">
      <div
        className={`${dockSizeClass} mx-auto flex items-center justify-center rounded-2xl bg-slate-900/95 px-6 py-3 shadow-[0_20px_50px_rgba(15,23,42,0.9)] backdrop-blur-xl border border-slate-700/70`}
      >
        <div className="dock flex h-12 items-center gap-8">
          {dockItems.map((item) => {
            const isItemActive = isActive(item.path);
            const isItemHovered = hoveredItem === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.path)}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                className={`group relative flex h-full flex-col items-center justify-center gap-1 transition-all duration-200 ${
                  isItemActive ? "scale-[1.1]" : "hover:scale-[1.05]"
                }`}
                aria-label={item.label}
              >
                <div
                  className={`relative flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-200 ${
                    isItemActive 
                      ? "bg-slate-100/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.2)]" 
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {item.icon}
                </div>

                <span
                  className={`absolute -bottom-7 text-[9px] font-bold uppercase tracking-[0.15em] transition-all duration-200 ${
                    isItemActive || isItemHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                  }`}
                >
                  {item.label}
                </span>

                {isItemActive && (
                  <div className="absolute -bottom-1 h-1 w-1 rounded-full bg-white shadow-[0_0_8px_white]" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </footer>
  );
};

export default Footer;