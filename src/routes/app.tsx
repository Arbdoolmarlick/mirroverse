import { useState } from "react";
import { createFileRoute, Outlet, Link, useLocation } from "@tanstack/react-router";
import { LayoutDashboard, BarChart2, Wallet, Sprout, Moon, Sun, ChevronDown, Sparkles } from "lucide-react";
import { MirroAiDrawer } from "@/components/MirroAiDrawer";
import { AlphaOnboardingTour } from "@/components/AlphaOnboardingTour";
import { Toaster } from "sonner";
import { useTheme } from "@/lib/theme";
import { useWallet } from "@/lib/web3-wallet";
import { UserPortfolioProvider } from "@/lib/user-portfolio";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

const NAV_ITEMS = [
  { label: "Dashboard", href: "/app", icon: LayoutDashboard },
  { label: "Leaderboard", href: "/app/leaderboard", icon: BarChart2 },
  { label: "Portfolio", href: "/app/portfolio", icon: Wallet },
  { label: "My Farming", href: "/app/my-farming", icon: Sprout },
] as const;

function WalletButton() {
  const {
    address,
    isConnected,
    isWrongNetwork,
    balance,
    usdgBalance,
    currentNetwork,
    openWalletModal,
    openAccountModal,
    switchChain,
  } = useWallet();

  if (!isConnected) {
    return (
      <button
        type="button"
        onClick={openWalletModal}
        className="button sm primary flex items-center gap-1.5 font-mono text-xs cursor-pointer"
      >
        <Wallet size={13} />
        <span>Connect Wallet</span>
      </button>
    );
  }

  if (isWrongNetwork) {
    return (
      <button
        type="button"
        onClick={() => void switchChain(421614)}
        className="button sm flex items-center gap-1.5 font-mono text-xs cursor-pointer bg-coral text-white hover:opacity-90 transition-opacity"
        title="Connected to unsupported network. Click to switch to Arbitrum Sepolia testnet"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
        <span>Switch to Arbitrum Sepolia</span>
      </button>
    );
  }

  const shortAddr = `${address?.slice(0, 6)}...${address?.slice(-4)}`;

  return (
    <button
      type="button"
      onClick={openAccountModal}
      className="wallet-connect flex items-center gap-2 cursor-pointer hover:border-line transition-colors"
      title={`Connected on ${currentNetwork.name} (${address})`}
    >
      <span
        className="w-2 h-2 rounded-full shrink-0"
        style={{ backgroundColor: currentNetwork.iconBg }}
      />
      <span className="font-mono text-xs text-ink font-medium">{shortAddr}</span>
      <div className="flex items-center gap-1.5 border-l border-line-soft pl-2 font-mono text-[11px]">
        <span className="text-profit font-medium">{usdgBalance} USDG</span>
        <span className="text-ink-faint hidden sm:inline">·</span>
        <span className="text-ink-soft hidden sm:inline">{balance} ETH</span>
      </div>
      <ChevronDown size={12} className="text-ink-faint" />
    </button>
  );
}

function AppShell() {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const [showTourModal, setShowTourModal] = useState(false);

  const isActive = (href: string) => {
    if (href === "/app") {
      return location.pathname === "/app" || location.pathname === "/app/";
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="relative min-h-screen text-foreground flex flex-col bg-canvas">
      <Toaster position="bottom-left" />

      {/* Persistent Top Navigation Bar across both Mobile and PC */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-8 h-16 bg-card/80 backdrop-blur-xl border-b border-border/70 transition-colors">
        <div className="flex items-center gap-4">
          <Link to="/" className="brand hover:opacity-85 transition-opacity">
            <span className="brand-mark">
              <i />
              <i />
              <i />
            </span>
            <span>mirro</span>
          </Link>
          <div className="protocol-status hidden sm:inline-flex">
            <span className="status-pulse" />
            Arbitrum Sepolia (421614)
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowTourModal(true)}
            className="button sm font-mono text-xs flex items-center gap-1.5 text-ink-soft hover:text-ink hover:bg-card border border-line-soft transition-colors cursor-pointer"
            title="Alpha Quickstart Guide"
          >
            <Sparkles size={13} className="text-coral" />
            <span className="hidden sm:inline">Guide</span>
          </button>

          <button
            className="theme-toggle"
            type="button"
            onClick={(e) => toggleTheme({ x: e.clientX, y: e.clientY })}
            aria-label="Toggle theme"
            title="Toggle theme"
          >
            <span className="theme-toggle-track">
              <span className="theme-toggle-thumb">
                {theme === "light" ? <Moon size={12} /> : <Sun size={12} />}
              </span>
            </span>
            <span className="theme-toggle-label hidden md:inline">
              {theme === "light" ? "dark mode" : "light mode"}
            </span>
          </button>

          <WalletButton />
        </div>
      </header>

      {/* Main Content Area - Full width with max-w-6xl for optimal readability */}
      <main className="w-full max-w-6xl mx-auto px-3.5 py-6 sm:px-6 sm:py-8 md:px-8 min-h-[calc(100vh-64px)] pb-32">
        <Outlet />
      </main>

      {/* Apple-Inspired Floating Bottom Navigation Bar (Both Mobile and PC) */}
      <nav
        className="fixed bottom-5 sm:bottom-7 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1.5 sm:gap-2.5 p-2 sm:p-2.5 rounded-full border border-border/85 bg-card/90 backdrop-blur-2xl shadow-lift transition-all duration-300 max-w-[calc(100vw-24px)]"
        style={{
          paddingBottom: "max(8px, env(safe-area-inset-bottom, 8px))",
        }}
        aria-label="Primary Navigation"
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              to={item.href}
              className={`relative flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2.5 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full transition-all duration-200 active:scale-95 whitespace-nowrap select-none ${
                active
                  ? "bg-ink text-paper-solid shadow-soft font-semibold"
                  : "text-secondary-foreground hover:text-foreground hover:bg-secondary/60"
              }`}
            >
              <Icon size={18} className={active ? "text-paper-solid" : "text-ink-soft"} />
              <span className="text-[11px] sm:text-sm tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Global Alpha Onboarding Tour Modal */}
      {showTourModal && (
        <AlphaOnboardingTour forceOpen={true} onClose={() => setShowTourModal(false)} />
      )}

      {/* Global AI Assistant Drawer */}
      <MirroAiDrawer />
    </div>
  );
}

function AppLayout() {
  return (
    <UserPortfolioProvider>
      <AppShell />
    </UserPortfolioProvider>
  );
}
