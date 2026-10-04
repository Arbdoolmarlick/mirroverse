import { useState } from "react";
import { X, Share2, Copy, Check, Twitter, Sparkles, ShieldCheck, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { useWallet } from "@/lib/web3-wallet";
import { useUserPortfolio } from "@/lib/user-portfolio";

export function ShareYieldModal({ onClose }: { onClose: () => void }) {
  const { address, isConnected } = useWallet();
  const { portfolioValue, totalDeposited, totalReturn, totalReturnPct, activePools, mirroredFarmers } =
    useUserPortfolio();

  const [copied, setCopied] = useState(false);

  const shortAddr = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "0x00...0000";
  const estApy =
    activePools.length > 0
      ? (activePools.reduce((acc, p) => acc + p.apy, 0) / activePools.length).toFixed(1)
      : mirroredFarmers.length > 0
        ? (mirroredFarmers.reduce((acc, m) => acc + m.apy, 0) / mirroredFarmers.length).toFixed(1)
        : "11.2";

  const totalPositions = activePools.length + mirroredFarmers.length;

  const tweetText = `Farming +${estApy}% APY non-custodially on @mirro_fi on Arbitrum Sepolia!

Mirrored top on-chain whales & deposited into curated vaults with 1-click execution.
Portfolio: $${portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}

Try the testnet alpha: https://mirro.finance #Arbitrum #DeFi #YieldFarming`;

  const handleShareTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(tweetText);
      setCopied(true);
      toast.success("Yield summary copied to clipboard!");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal max-w-lg" role="dialog" aria-modal="true">
        <div className="modal-head">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-coral/10 border border-coral/30 flex items-center justify-center text-coral">
              <Share2 size={14} />
            </div>
            <div>
              <h2 className="modal-title">Share Your Farming Yield</h2>
              <p className="modal-copy">Branded cryptographic proof of your active positions.</p>
            </div>
          </div>
          <button className="close" onClick={onClose} aria-label="Close modal">
            <X size={15} />
          </button>
        </div>

        <div className="modal-body space-y-4">
          {/* Card Preview */}
          <div className="rounded-2xl border border-line p-5 bg-gradient-to-br from-card via-canvas to-card shadow-lift relative overflow-hidden font-mono">
            {/* Ambient background decoration */}
            <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-coral/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-center justify-between pb-3 border-b border-line-soft text-xs">
              <div className="flex items-center gap-2">
                <span className="brand-mark scale-75 origin-left">
                  <i />
                  <i />
                  <i />
                </span>
                <span className="font-sans font-bold text-ink">mirro protocol</span>
              </div>
              <span className="text-[10px] text-coral bg-coral/10 border border-coral/30 px-2 py-0.5 rounded-full">
                Arbitrum Sepolia
              </span>
            </div>

            <div className="py-4 space-y-3">
              <div>
                <span className="text-[10px] text-ink-faint uppercase tracking-wider">
                  Active Portfolio Value
                </span>
                <div className="text-2xl sm:text-3xl font-bold text-ink">
                  $
                  {portfolioValue.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1 text-xs">
                <div className="bg-canvas-deep/50 p-2.5 rounded-xl border border-line-soft">
                  <span className="text-[10px] text-ink-soft block">Average APY</span>
                  <span className="text-sm font-semibold positive">+{estApy}%</span>
                </div>
                <div className="bg-canvas-deep/50 p-2.5 rounded-xl border border-line-soft">
                  <span className="text-[10px] text-ink-soft block">Positions</span>
                  <span className="text-sm font-semibold text-ink">
                    {totalPositions} active {totalPositions === 1 ? "vault" : "vaults"}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-[11px] text-ink-faint border-t border-line-soft">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck size={13} className="text-profit" />
                  <span>Settled on-chain · non-custodial</span>
                </div>
                <span>{shortAddr}</span>
              </div>
            </div>
          </div>

          {/* Social Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            <button
              type="button"
              onClick={handleShareTwitter}
              className="button primary flex items-center justify-center gap-2 font-mono text-xs cursor-pointer py-2.5"
            >
              <Twitter size={14} />
              <span>Share on X (Twitter)</span>
              <ArrowUpRight size={13} className="opacity-70" />
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className="button flex items-center justify-center gap-2 font-mono text-xs cursor-pointer py-2.5"
            >
              {copied ? (
                <>
                  <Check size={14} className="text-profit" />
                  <span className="text-profit">Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>Copy for Telegram / Discord</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
