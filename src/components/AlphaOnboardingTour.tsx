import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  Sparkles,
  CheckCircle2,
  Circle,
  X,
  ExternalLink,
  Wallet,
  Coins,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";
import { useWallet } from "@/lib/web3-wallet";
import { useUserPortfolio } from "@/lib/user-portfolio";
import { useMirroContracts } from "@/lib/use-mirro-contracts";

const TOUR_STORAGE_KEY = "mirro_alpha_tour_dismissed_v1";

export function AlphaOnboardingTour({
  forceOpen = false,
  onClose,
}: {
  forceOpen?: boolean;
  onClose?: () => void;
}) {
  const { isConnected, isWrongNetwork, openWalletModal, switchChain, balance, usdgBalance, refetchBalances } =
    useWallet();
  const { activePools, mirroredFarmers } = useUserPortfolio();
  const { claimFaucet, isPending, pendingStep } = useMirroContracts();

  const [dismissed, setDismissed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(TOUR_STORAGE_KEY) === "true";
  });

  const [minimized, setMinimized] = useState(false);

  // If forceOpen is provided, override dismissed state
  const isVisible = forceOpen || (!dismissed && !minimized);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem(TOUR_STORAGE_KEY, "true");
    if (onClose) onClose();
  };

  // Determine completed steps dynamically from live wallet & portfolio state
  const hasUsdg = parseFloat(usdgBalance.replace(/,/g, "")) > 0;
  const hasPositions = activePools.length > 0 || mirroredFarmers.length > 0;

  const steps = [
    {
      id: 1,
      title: "Connect to Arbitrum Sepolia",
      description: "Connect your Web3 wallet and ensure the network is set to Arbitrum Sepolia (421614).",
      completed: isConnected && !isWrongNetwork,
      action: !isConnected ? (
        <button
          type="button"
          onClick={openWalletModal}
          className="button sm primary font-mono text-[11px] flex items-center gap-1.5"
        >
          <Wallet size={12} /> Connect Wallet
        </button>
      ) : isWrongNetwork ? (
        <button
          type="button"
          onClick={() => void switchChain(421614)}
          className="button sm bg-coral text-white font-mono text-[11px]"
        >
          Switch to Arbitrum Sepolia
        </button>
      ) : null,
    },
    {
      id: 2,
      title: "Mint 1,000 Free Testnet USDG",
      description: "Claim mock testnet capital from the protocol faucet to start depositing.",
      completed: hasUsdg,
      action: isConnected && !hasUsdg ? (
        <button
          type="button"
          onClick={async () => {
            await claimFaucet("USDG");
            await refetchBalances();
          }}
          disabled={isPending}
          className="button sm primary font-mono text-[11px] flex items-center gap-1.5"
        >
          <Coins size={12} />
          {isPending ? "Minting..." : "Mint 1,000 USDG"}
        </button>
      ) : null,
    },
    {
      id: 3,
      title: "Deposit into a Yield Pool or Mirror a Whaler",
      description: "Deposit your USDG into Camelot / Aave or copy an indexed high-APY on-chain farmer.",
      completed: hasPositions,
      action: !hasPositions ? (
        <div className="flex items-center gap-2">
          <Link
            to="/app"
            onClick={forceOpen ? onClose : undefined}
            className="button sm primary font-mono text-[11px] flex items-center gap-1"
          >
            Explore Pools <ArrowRight size={11} />
          </Link>
          <Link
            to="/app/leaderboard"
            onClick={forceOpen ? onClose : undefined}
            className="button sm font-mono text-[11px] text-ink-soft hover:text-ink"
          >
            Whale Leaderboard
          </Link>
        </div>
      ) : null,
    },
    {
      id: 4,
      title: "Verify On-Chain & Track Yield",
      description: "Every deposit mints non-custodial shares settled on Arbitrum Sepolia with Arbiscan receipts.",
      completed: hasPositions,
      action: hasPositions ? (
        <Link
          to="/app/portfolio"
          onClick={forceOpen ? onClose : undefined}
          className="button sm positive font-mono text-[11px] flex items-center gap-1 border border-profit/30 bg-profit/10 text-profit"
        >
          View Portfolio <TrendingUp size={11} />
        </Link>
      ) : null,
    },
  ];

  const completedCount = steps.filter((s) => s.completed).length;
  const progressPct = (completedCount / steps.length) * 100;

  if (!isVisible) return null;

  const content = (
    <div className="card-soft border border-coral/30 bg-card/95 shadow-lift rounded-2xl p-5 mb-6 relative overflow-hidden transition-all duration-200">
      {/* Background glow banner */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-coral/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-start justify-between gap-4 pb-3 border-b border-line-soft">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-coral/10 border border-coral/30 flex items-center justify-center text-coral">
            <Sparkles size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-ink text-sm sm:text-base">
                Welcome to mirro Testnet Alpha
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-coral/10 text-coral border border-coral/30">
                Arbitrum Sepolia
              </span>
            </div>
            <p className="text-ink-soft text-xs mt-0.5">
              Complete these {steps.length} quick steps to experience permissionless copy-farming and on-chain vaults.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1.5 rounded-lg text-ink-faint hover:text-ink hover:bg-canvas-deep transition-colors cursor-pointer"
            title="Dismiss guide"
            aria-label="Dismiss guide"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="pt-3 pb-4">
        <div className="flex items-center justify-between text-xs font-mono mb-1.5">
          <span className="text-ink-soft">
            Onboarding Progress: <span className="text-ink font-semibold">{completedCount} of {steps.length} completed</span>
          </span>
          <span className="text-coral font-medium">{Math.round(progressPct)}%</span>
        </div>
        <div className="w-full h-2 bg-canvas-deep rounded-full overflow-hidden border border-line-soft">
          <div
            className="h-full bg-coral rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Steps List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
        {steps.map((step) => {
          return (
            <div
              key={step.id}
              className={`p-3.5 rounded-xl border transition-all ${
                step.completed
                  ? "bg-profit/5 border-profit/20"
                  : "bg-canvas/50 border-line-soft hover:border-line"
              }`}
            >
              <div className="flex items-start gap-2.5">
                {step.completed ? (
                  <CheckCircle2 size={18} className="text-profit shrink-0 mt-0.5" />
                ) : (
                  <Circle size={18} className="text-ink-faint shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-xs font-medium ${
                        step.completed ? "text-ink line-through opacity-85" : "text-ink"
                      }`}
                    >
                      {step.title}
                    </span>
                    <span className="font-mono text-[10px] text-ink-faint">
                      Step {step.id}
                    </span>
                  </div>
                  <p className="text-[11px] text-ink-soft mt-0.5 leading-relaxed">
                    {step.description}
                  </p>
                  {step.action && <div className="mt-2.5">{step.action}</div>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Transaction Status Alert (if executing faucet) */}
      {isPending && pendingStep && (
        <div className="mt-3 bg-coral/10 border border-coral/30 rounded-xl p-3 text-xs font-mono flex items-center gap-2 text-coral animate-pulse">
          <span className="w-2 h-2 rounded-full bg-coral animate-ping shrink-0" />
          <span>{pendingStep}</span>
        </div>
      )}
    </div>
  );

  if (forceOpen) {
    return (
      <div
        className="modal-backdrop z-50 p-4 flex items-center justify-center"
        role="presentation"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget && onClose) onClose();
        }}
      >
        <div className="w-full max-w-2xl">{content}</div>
      </div>
    );
  }

  return content;
}
