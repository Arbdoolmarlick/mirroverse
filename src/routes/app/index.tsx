import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHead, Section, TokenGroups, PoolsTable, MirroringTable } from "@/components/mirro-ui";
import { AlphaOnboardingTour } from "@/components/AlphaOnboardingTour";
import { ShareYieldModal } from "@/components/ShareYieldModal";
import { useUserPortfolio } from "@/lib/user-portfolio";
import { useWallet } from "@/lib/web3-wallet";
import { useMirroContracts } from "@/lib/use-mirro-contracts";
import { Wallet, ExternalLink, Sparkles, RefreshCw, Share2 } from "lucide-react";

export const Route = createFileRoute("/app/")({
  head: () => ({
    meta: [{ title: "mirro — Dashboard" }],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const [showShareModal, setShowShareModal] = useState(false);
  const { activePools, mirroredFarmers, portfolioValue } = useUserPortfolio();
  const {
    address,
    isConnected,
    balance,
    usdgBalance,
    isLoadingBalance,
    openWalletModal,
    refetchBalances,
  } = useWallet();
  const { claimFaucet, isPending } = useMirroContracts();

  const totalPositionsCount = activePools.length + mirroredFarmers.length;

  let weightedApySum = 0;
  activePools.forEach((p) => {
    weightedApySum += p.apy * p.currentValue;
  });
  mirroredFarmers.forEach((m) => {
    weightedApySum += m.apy * m.currentValue;
  });

  const avgNetApy = portfolioValue > 0 ? (weightedApySum / portfolioValue).toFixed(2) : "0.00";
  const alphaVsBaseline = portfolioValue > 0 ? (+avgNetApy - 7.1).toFixed(2) : "0.00";
  const dailyYield =
    portfolioValue > 0 ? ((portfolioValue * (+avgNetApy / 100)) / 365).toFixed(2) : "0.00";

  const handleClaim = async () => {
    await claimFaucet("USDG");
    await refetchBalances();
  };

  return (
    <div className="page space-y-8">
      <PageHead
        title="Dashboard"
        tagline="A unified view of your tokens, active pools, and mirrored farmers on Arbitrum Sepolia."
      >
        <button
          type="button"
          onClick={() => setShowShareModal(true)}
          className="button sm flex items-center gap-1.5 font-mono text-xs cursor-pointer hover:border-line"
        >
          <Share2 size={13} className="text-coral" />
          <span>Share Yield</span>
        </button>
      </PageHead>

      {/* Alpha Onboarding Tour Guide */}
      <AlphaOnboardingTour />

      {/* Connected Wallet Status & Available Balance Banner */}
      {isConnected ? (
        <div className="card-soft p-5 border border-line-soft flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="w-2 h-2 rounded-full bg-profit animate-pulse" />
              <span className="font-mono text-xs text-ink-soft">
                Connected: <strong className="text-ink">{address?.slice(0, 6)}...{address?.slice(-4)}</strong>
              </span>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded-full border border-line bg-canvas text-ink-faint">
                Arbitrum Sepolia (421614)
              </span>
              {isLoadingBalance && (
                <span className="text-[10px] font-mono text-ink-faint inline-flex items-center gap-1">
                  <RefreshCw size={10} className="animate-spin" /> syncing
                </span>
              )}
            </div>

            <div className="flex items-baseline gap-4 flex-wrap pt-1">
              <div>
                <span className="text-ink-faint text-[10px] font-mono block uppercase">USDG Balance</span>
                <span className="text-2xl font-bold font-mono text-ink">
                  {usdgBalance} <span className="text-xs font-sans text-ink-soft font-normal">USDG</span>
                </span>
              </div>
              <div className="border-l border-line-soft pl-4">
                <span className="text-ink-faint text-[10px] font-mono block uppercase">Native Gas</span>
                <span className="text-lg font-medium font-mono text-ink-soft">
                  {balance} <span className="text-xs font-sans font-normal">ETH</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              disabled={isPending}
              onClick={handleClaim}
              className="button sm primary flex items-center gap-1.5 font-mono text-xs cursor-pointer"
              title="Mint free 1,000 USDG testnet tokens directly to your wallet"
            >
              <Sparkles size={12} />
              <span>{isPending ? "Minting..." : "Claim 1,000 USDG Faucet"}</span>
            </button>
            <a
              href={`https://sepolia.arbiscan.io/address/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="button sm flex items-center gap-1 font-mono text-xs"
              title="View your wallet address on Arbiscan"
            >
              <span>Arbiscan</span>
              <ExternalLink size={11} />
            </a>
          </div>
        </div>
      ) : (
        <div className="card-soft p-5 border border-line-soft flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Wallet size={16} className="text-coral" />
              <span className="font-medium text-ink text-sm">Connect your Web3 Wallet</span>
            </div>
            <p className="text-xs text-ink-soft">
              Connect via Reown AppKit on Arbitrum Sepolia to view your live wallet balances, deposit USDG, and mirror top on-chain farmers.
            </p>
          </div>
          <button
            type="button"
            onClick={openWalletModal}
            className="button sm primary shrink-0 font-mono text-xs cursor-pointer"
          >
            Connect Wallet
          </button>
        </div>
      )}

      {/* Summary grid */}
      <div className="summary-grid">
        <div className="metric">
          <div className="metric-label">Available Wallet Capital</div>
          <div className="metric-value">
            {isConnected ? `${usdgBalance} USDG` : "$0.00"}
          </div>
          <div className="metric-note">
            {isConnected ? `+ ${balance} ETH on-chain` : "Connect wallet to view"}
          </div>
        </div>
        <div className="metric">
          <div className="metric-label">Total Value Locked</div>
          <div className="metric-value">
            $
            {portfolioValue.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
          <div className="metric-note">
            {totalPositionsCount === 0
              ? "0 active positions"
              : `Across ${activePools.length} pool${activePools.length === 1 ? "" : "s"} & ${mirroredFarmers.length} mirror${mirroredFarmers.length === 1 ? "" : "s"}`}
          </div>
        </div>
        <div className="metric">
          <div className="metric-label">Average Net APY</div>
          <div className={`metric-value ${+avgNetApy > 0 ? "positive" : ""}`}>
            {+avgNetApy > 0 ? `+${avgNetApy}%` : "0.00%"}
          </div>
          <div className="metric-note">
            {portfolioValue > 0
              ? `${+alphaVsBaseline >= 0 ? `+${alphaVsBaseline}%` : `${alphaVsBaseline}%`} alpha vs baseline`
              : "Baseline 7.10% APY"}
          </div>
        </div>
        <div className="metric">
          <div className="metric-label">24h Accrued Yield</div>
          <div className={`metric-value ${+dailyYield > 0 ? "positive" : ""}`}>
            {+dailyYield > 0 ? `+$${dailyYield}` : "$0.00"}
          </div>
          <div className="metric-note">
            {portfolioValue > 0 ? "Estimated daily accrual" : "No yield accrued yet"}
          </div>
        </div>
      </div>

      {/* SECTION — "your tokens" */}
      <Section label="your tokens">
        <TokenGroups />
      </Section>

      {/* SECTION — "your active pools" */}
      <Section label="your active pools">
        <PoolsTable />
      </Section>

      {/* SECTION — "mirroring" */}
      <Section label="mirroring">
        <MirroringTable />
      </Section>

      {/* Share Yield Modal */}
      {showShareModal && <ShareYieldModal onClose={() => setShowShareModal(false)} />}
    </div>
  );
}
