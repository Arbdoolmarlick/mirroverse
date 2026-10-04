import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Copy, Check, ArrowLeft, ArrowRight, ShieldCheck, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import {
  farmers,
  allocation as defaultAllocation,
  rebalanceHistory,
  blendedStats,
} from "@/lib/mirro-data";
import {
  AssetBadge,
  FarmerTierBadge,
  RiskBadge,
  HelpQuestionButton,
  AiBadge,
  MirrorModal,
} from "@/components/mirro-ui";
import { PerformanceChart } from "@/components/mirro-charts";
import { useUserPortfolio } from "@/lib/user-portfolio";
import { useWallet } from "@/lib/web3-wallet";
import { useMirroContracts } from "@/lib/use-mirro-contracts";
import { useOnChainFarmer } from "@/lib/use-onchain-data";

export const Route = createFileRoute("/app/farmer/$id")({
  head: () => ({
    meta: [{ title: `mirro — Farmer Profile` }],
  }),
  component: FarmerProfilePage,
});

function FarmerProfilePage() {
  const { id } = Route.useParams();
  const farmer = farmers.find((f) => f.id === id) || farmers[0];

  const allocations = farmer.allocations || defaultAllocation;
  const rebalances =
    farmer.rebalances ||
    rebalanceHistory.map(([date, move, before, after, reason]) => ({
      date,
      move,
      before,
      after,
      reason,
    }));

  const farmerBlendedApy = allocations
    .reduce((sum, item) => sum + (parseFloat(item.apy) || 0) * (item.weight / 100), 0)
    .toFixed(2);
  const farmerAlpha = (+farmerBlendedApy - 7.1).toFixed(2);

  const [copied, setCopied] = useState(false);
  const [timeRange, setTimeRange] = useState<"7D" | "30D" | "90D">("30D");
  const [tab, setTab] = useState<"allocation" | "history" | "followers">("allocation");
  const { mirroredFarmers, stopMirror } = useUserPortfolio();
  const { currentNetwork } = useWallet();

  // On-Chain live reads from Arbitrum Sepolia
  const { data: onchainData, isLoading: isLoadingOnchain, refetch: refetchOnchain } = useOnChainFarmer(farmer.wallet);
  const onchainMoves = onchainData?.moves || [];
  const onchainStats = onchainData?.stats;
  const userOnChainPosition = onchainData?.userPosition;

  const activeMirror = mirroredFarmers.find((m) => m.farmerId === farmer.id);
  const isMirroring = Boolean(activeMirror || userOnChainPosition?.active);

  const activePositionDeposited = userOnChainPosition?.depositedAmount ?? activeMirror?.deposited ?? 0;
  const activePositionCurrentValue = userOnChainPosition?.currentValue ?? activeMirror?.currentValue ?? 0;
  const activePositionReturnUsd = Math.max(0, activePositionCurrentValue - activePositionDeposited);
  const activePositionReturnPct = activePositionDeposited > 0 ? (activePositionReturnUsd / activePositionDeposited) * 100 : 0;
  const activePositionSince = userOnChainPosition?.activeSince ?? activeMirror?.activeSince ?? "Recently";

  const [followedFarmers, setFollowedFarmers] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem("mirro_followed_farmers") || "[]");
    } catch {
      return [];
    }
  });
  const isFollowing = followedFarmers.includes(farmer.id);
  const [showMirrorModal, setShowMirrorModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState("500");

  const handleCopyWallet = () => {
    void navigator.clipboard?.writeText(farmer.wallet);
    setCopied(true);
    toast.success("Wallet address copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleFollow = () => {
    setFollowedFarmers((prev) => {
      let next: string[];
      if (prev.includes(farmer.id)) {
        next = prev.filter((fid) => fid !== farmer.id);
        toast(`Unfollowed ${farmer.name}`);
      } else {
        next = [...prev, farmer.id];
        toast.success(`Followed ${farmer.name}`);
      }
      try {
        localStorage.setItem("mirro_followed_farmers", JSON.stringify(next));
      } catch {
        // Ignore storage errors in restricted iframe
      }
      return next;
    });
  };

  const { stopCopying, isPending: isStoppingOnChain, pendingStep: stopPendingStep } = useMirroContracts();
  const [isStopping, setIsStopping] = useState(false);

  const handleStopMirror = async () => {
    try {
      setIsStopping(true);
      await stopCopying({
        targetWallet: farmer.wallet,
        assetSymbol: userOnChainPosition?.tokenSymbol || "USDG",
      });
      if (activeMirror) {
        stopMirror(activeMirror.id);
      }
      await refetchOnchain();
    } catch {
      // Toast error handled in hook
    } finally {
      setIsStopping(false);
    }
  };

  return (
    <div className="page space-y-6">
      <Link to="/app/leaderboard" className="back-link">
        <ArrowLeft size={14} />
        All farmers
      </Link>

      {/* Detail Top Header */}
      <div className="detail-top">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="detail-title">{farmer.name}</h1>
            <FarmerTierBadge tier={farmer.tier} />
            <AiBadge poolId="pendle-usdg" />
            <RiskBadge risk={farmer.riskTier} />
          </div>

          <div className="detail-trader mt-1.5 flex items-center gap-2">
            <button
              className="address-button"
              onClick={handleCopyWallet}
              title={`Copy full address: ${farmer.wallet}`}
            >
              {farmer.wallet.length > 14
                ? `${farmer.wallet.slice(0, 6)}...${farmer.wallet.slice(-4)}`
                : farmer.wallet}
              {copied ? <Check size={12} className="text-profit" /> : <Copy size={12} />}
            </button>
            <a
              href={`${currentNetwork.explorer}/address/${farmer.wallet}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink-faint hover:text-coral transition-colors text-xs inline-flex items-center gap-0.5"
              title="View on block explorer"
            >
              {currentNetwork.name.includes("Arbitrum") ? "arbiscan" : "explorer"} <ExternalLink size={10} />
            </a>
            <span className="text-ink-faint text-xs">· active since {farmer.activeSince}</span>
          </div>

          <p className="max-w-xl mt-2.5 text-xs text-ink-soft leading-relaxed">{farmer.bio}</p>

          <div className="mt-3 flex gap-1.5 flex-wrap">
            {farmer.assets.map((asset) => (
              <AssetBadge key={asset}>{asset}</AssetBadge>
            ))}
          </div>
        </div>

        <div className="detail-stats">
          <div>
            <div className="detail-stat-label">
              <span className="inline-flex items-center gap-1">
                30d APY <HelpQuestionButton question="How is APY calculated?" />
              </span>
            </div>
            <div className="detail-stat-value positive">+{farmer.apy}%</div>
          </div>
          <div>
            <div className="detail-stat-label">
              <span className="inline-flex items-center gap-1">
                Alpha <HelpQuestionButton question="What does Alpha vs Baseline mean?" />
              </span>
            </div>
            <div className={`detail-stat-value ${farmer.alpha >= 0 ? "positive" : "negative"}`}>
              {farmer.alpha >= 0 ? `+${farmer.alpha}%` : `${farmer.alpha}%`}
            </div>
          </div>
          <div>
            <div className="detail-stat-label">TVL</div>
            <div className="detail-stat-value">{farmer.tvl}</div>
          </div>
          <div>
            <div className="detail-stat-label">Followers</div>
            <div className="detail-stat-value">{farmer.followers}</div>
          </div>
          <div>
            <div className="detail-stat-label">Mirrors</div>
            <div className="detail-stat-value">{farmer.mirrors}</div>
          </div>
        </div>
      </div>

      {/* P3.3 Vault Capacity Bar */}
      <div className="card-soft p-4 space-y-2 border border-line-soft">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-ink-soft font-sans font-medium uppercase tracking-wider text-[11px]">
            Vault Capacity
          </span>
          <span className="text-ink font-medium">
            {farmer.capacity.current} of {farmer.capacity.max}{" "}
            <span className="text-ink-faint">({farmer.capacity.pct}% full)</span>
          </span>
        </div>
        <div className="w-full h-2 bg-canvas-deep rounded-full overflow-hidden border border-line-soft">
          <div
            className="h-full bg-coral transition-all duration-500 rounded-full"
            style={{ width: `${farmer.capacity.pct}%` }}
          />
        </div>
      </div>

      {/* 62% / 38% Detail Layout */}
      <div className="detail-layout">
        <div className="space-y-6">
          {/* Chart Panel */}
          <section className="chart-panel">
            <div className="chart-head">
              <span className="chart-title">Net APY Performance vs Baseline</span>
              <div className="range-tabs">
                {(["7D", "30D", "90D"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    className={`range-tab ${timeRange === r ? "active" : ""}`}
                    onClick={() => setTimeRange(r)}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-4">
              <PerformanceChart range={timeRange} />
              <div className="mt-3 pt-3 border-t border-line-soft text-xs text-ink-soft flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-profit shrink-0" />
                <span>
                  This farmer has beaten the baseline for{" "}
                  <strong className="text-ink font-medium">{farmer.daysBeatenBaseline}</strong> of
                  the last 90 days.
                </span>
              </div>
            </div>
          </section>

          {/* Sub Navigation Tabs */}
          <div className="tabs">
            <button
              type="button"
              className={`tab ${tab === "allocation" ? "active" : ""}`}
              onClick={() => setTab("allocation")}
            >
              Current Allocation ({allocations.length})
            </button>
            <button
              type="button"
              className={`tab ${tab === "history" ? "active" : ""}`}
              onClick={() => setTab("history")}
            >
              Rebalance History ({rebalances.length})
            </button>
            <button
              type="button"
              className={`tab ${tab === "followers" ? "active" : ""}`}
              onClick={() => setTab("followers")}
            >
              On-Chain Mirrors & Ledger
            </button>
          </div>

          {/* Tab 1: Allocation with USDG value & visual weight bar */}
          {tab === "allocation" && (
            <div className="card-soft p-5 space-y-3">
              <div className="space-y-2">
                {allocations.map((item) => (
                  <div
                    key={item.protocol}
                    className="p-3 bg-canvas/40 border border-line-soft rounded-[12px] flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-1 h-8 bg-coral rounded-full"
                        style={{ opacity: item.weight / 100 + 0.3 }}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="mono font-medium text-ink">{item.weight}%</span>
                          <span className="text-ink font-medium">{item.protocol}</span>
                          <AssetBadge>{item.asset}</AssetBadge>
                        </div>
                        <div className="mono text-[11px] text-ink-faint mt-0.5">
                          Allocated: {item.value}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="mono positive font-medium">{item.apy} APY</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-line-soft flex flex-wrap items-center justify-between text-xs font-mono text-ink-soft">
                <span>
                  Blended APY:{" "}
                  <strong className="positive font-medium">+{farmerBlendedApy}%</strong>
                </span>
                <span>
                  Baseline: <strong>7.1%</strong>
                </span>
                <span>
                  Alpha:{" "}
                  <strong className={`font-medium ${+farmerAlpha >= 0 ? "positive" : "negative"}`}>
                    {+farmerAlpha >= 0 ? `+${farmerAlpha}%` : `${farmerAlpha}%`}
                  </strong>
                </span>
              </div>
            </div>
          )}

          {/* Tab 2: Rebalance History (On-Chain) */}
          {tab === "history" && (
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date / Time</th>
                    <th>Strategy Move</th>
                    <th>From Protocol</th>
                    <th>To Protocol</th>
                    <th className="num">Allocation</th>
                    <th>Reason / Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {onchainMoves.length > 0 ? (
                    onchainMoves.map((item, i) => (
                      <tr key={i} className="strategy-row">
                        <td className="mono text-ink-faint text-xs">
                          <div>{item.date}</div>
                          <span className="text-[10px] text-coral">{item.relativeTime}</span>
                        </td>
                        <td className="font-medium text-ink">
                          {item.fromProtocolName.split(" ")[0]} → {item.toProtocolName.split(" ")[0]} ({item.tokenSymbol})
                        </td>
                        <td className="text-ink-soft text-xs">{item.fromProtocolName}</td>
                        <td className="text-profit text-xs font-medium">{item.toProtocolName}</td>
                        <td className="num mono positive font-medium">{item.allocationPct}%</td>
                        <td className="text-ink-soft text-xs">{item.note}</td>
                      </tr>
                    ))
                  ) : (
                    rebalances.map((item, i) => (
                      <tr key={i} className="strategy-row">
                        <td className="mono text-ink-faint text-xs">{item.date}</td>
                        <td className="font-medium text-ink">{item.move}</td>
                        <td className="text-ink-soft text-xs">{item.before}</td>
                        <td className="text-profit text-xs font-medium">{item.after}</td>
                        <td className="num mono positive">Baseline</td>
                        <td className="text-ink-soft text-xs">{item.reason}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              <div className="p-3 bg-canvas-deep/40 rounded-b-[12px] border-t border-line-soft flex items-center justify-between text-[11px] font-mono text-ink-faint">
                <span>
                  {onchainMoves.length > 0
                    ? `Showing ${onchainMoves.length} on-chain rebalances verified via MirroRegistry`
                    : "Indexed strategy rebalance history tracked on Arbitrum Sepolia"}
                </span>
                <a
                  href={`${currentNetwork.explorer}/address/${farmer.wallet}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-coral hover:underline inline-flex items-center gap-1"
                >
                  View contract <ExternalLink size={10} />
                </a>
              </div>
            </div>
          )}

          {/* Tab 3: On-Chain Mirrors & Ledger */}
          {tab === "followers" && (
            <div className="space-y-4">
              {/* User's own mirror status */}
              <div className="card-soft p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="mono text-xs font-medium text-ink">
                    Your Mirror Allocation
                  </div>
                  {isMirroring ? (
                    <span className="text-[10px] font-mono text-coral border border-coral/30 bg-coral/10 px-2 py-0.5 rounded-full">
                      Active on-chain
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-ink-faint border border-line-soft px-2 py-0.5 rounded-full">
                      Not Mirroring
                    </span>
                  )}
                </div>
                {isMirroring ? (
                  <div className="space-y-3 pt-1">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                      <div>
                        <span className="text-ink-faint text-[10px] block">Deposited</span>
                        <span className="text-ink font-medium">${activePositionDeposited.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div>
                        <span className="text-ink-faint text-[10px] block">Current Value</span>
                        <span className="text-ink font-medium">${activePositionCurrentValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div>
                        <span className="text-ink-faint text-[10px] block">Strategy APY</span>
                        <span className="text-profit font-medium">+{farmer.apy}%</span>
                      </div>
                      <div>
                        <span className="text-ink-faint text-[10px] block">Performance Fee</span>
                        <span className="text-ink-soft">{farmer.fee}% on alpha</span>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-line-soft flex items-center justify-between">
                      <span className="text-xs text-ink-faint font-mono">Replicating moves since {activePositionSince}</span>
                      <button
                        type="button"
                        disabled={isStopping || isStoppingOnChain}
                        onClick={handleStopMirror}
                        className="button text-xs text-coral hover:bg-coral/10"
                      >
                        {isStopping || isStoppingOnChain ? "Stopping..." : "Stop Mirroring"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="py-2 text-xs text-ink-soft flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <span>You are not currently mirroring this vault. Deposit to mirror its smart contract moves automatically.</span>
                    <button
                      type="button"
                      onClick={() => setShowMirrorModal(true)}
                      className="button primary text-xs shrink-0"
                    >
                      Mirror Now
                    </button>
                  </div>
                )}
              </div>

              {/* On-Chain Contract Verification & Telemetry */}
              <div className="card-soft p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="mono text-xs font-medium text-ink">
                    On-Chain Telemetry & Verification
                  </div>
                  <span className="text-[10px] font-mono text-profit border border-profit/30 bg-profit/10 px-2 py-0.5 rounded-full">
                    Audited Public Contract
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono py-1">
                  <div className="p-2.5 bg-canvas-deep/40 rounded-lg border border-line-soft">
                    <span className="text-ink-faint text-[10px] block">Active Copiers</span>
                    <span className="text-ink font-medium">{onchainStats?.activeCopiers ?? 0}</span>
                  </div>
                  <div className="p-2.5 bg-canvas-deep/40 rounded-lg border border-line-soft">
                    <span className="text-ink-faint text-[10px] block">On-Chain Moves</span>
                    <span className="text-ink font-medium">{onchainStats?.totalMoves ?? 0}</span>
                  </div>
                  <div className="p-2.5 bg-canvas-deep/40 rounded-lg border border-line-soft">
                    <span className="text-ink-faint text-[10px] block">Copied Capital</span>
                    <span className="text-ink font-medium">${(onchainData?.copiedCapitalUsd ?? 0).toLocaleString()} USDG</span>
                  </div>
                </div>
                <p className="text-xs text-ink-soft leading-relaxed">
                  This strategy operates fully on-chain. Capital allocations, rebalance calls, and LP share balances are immutable and viewable directly via blockchain nodes.
                </p>
                <div className="p-3 bg-canvas-deep/40 rounded-[10px] border border-line-soft flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
                  <div className="truncate">
                    <span className="text-ink-faint mr-2">Contract:</span>
                    <span className="text-ink">{farmer.wallet}</span>
                  </div>
                  <a
                    href={`${currentNetwork.explorer}/address/${farmer.wallet}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-coral hover:underline inline-flex items-center gap-1 shrink-0 text-[11px]"
                  >
                    View on {currentNetwork.name.includes("Arbitrum") ? "Arbiscan" : "Explorer"} <ExternalLink size={10} />
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Follow & Mirror Panel */}
        <aside className="follow-panel space-y-4">
          <div>
            <div className="follow-panel-head">
              <h2 className="follow-panel-title">
                {isMirroring ? "Mirroring Farmer" : `Mirror ${farmer.name}`}
              </h2>
              <p className="follow-panel-copy">
                {isMirroring
                  ? "Your USDG is actively mirroring this farmer’s rebalances."
                  : "Allocate USDG and mirror every pool shift automatically."}
              </p>
            </div>

            {isMirroring ? (
              <div className="follow-state">
                <div className="eyebrow">Your active mirror</div>
                <div className="follow-state-grid">
                  <div>
                    <div className="position-label">Deposited</div>
                    <div className="follow-state-value">${activePositionDeposited.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="position-label">Current Value</div>
                    <div className="follow-state-value">
                      ${activePositionCurrentValue.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="position-label">Total Return</div>
                    <div
                      className={`follow-state-value ${activePositionReturnUsd >= 0 ? "positive" : "negative"}`}
                    >
                      {activePositionReturnUsd >= 0
                        ? `+$${activePositionReturnUsd.toFixed(2)}`
                        : `-$${Math.abs(activePositionReturnUsd).toFixed(2)}`}
                    </div>
                  </div>
                  <div>
                    <div className="position-label">Return %</div>
                    <div
                      className={`follow-state-value ${activePositionReturnPct >= 0 ? "positive" : "negative"}`}
                    >
                      {activePositionReturnPct >= 0
                        ? `+${activePositionReturnPct.toFixed(2)}%`
                        : `${activePositionReturnPct.toFixed(2)}%`}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="button" className="button lg w-full" onClick={handleToggleFollow}>
                    {isFollowing ? "Following" : "Follow"}
                    {isFollowing && <Check size={12} />}
                  </button>
                  <button
                    type="button"
                    disabled={isStopping || isStoppingOnChain}
                    className="button danger lg w-full"
                    onClick={handleStopMirror}
                  >
                    {isStopping || isStoppingOnChain ? "Withdrawing..." : "Stop Mirroring"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="follow-panel-body">
                <label className="follow-label" htmlFor="panel-amount">
                  Deposit amount
                </label>
                <div className="amount-input">
                  <input
                    id="panel-amount"
                    className="input"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    type="number"
                    min="1"
                  />
                  <span className="amount-symbol">USDG</span>
                </div>
                <div className="fee-row">
                  <span className="inline-flex items-center gap-1">
                    Performance fee{" "}
                    <HelpQuestionButton question="How does the performance fee work?" />
                  </span>
                  <strong>{farmer.fee}% of alpha</strong>
                </div>
                <p className="text-[11px] text-ink-faint leading-relaxed">
                  Fee is only charged on profits generated above the 7.1% baseline APY. You keep
                  100% of the baseline yield.
                </p>
                <div className="flex items-center justify-between text-[11px] font-mono text-ink-soft py-1 border-t border-line-soft">
                  <span>Min: {farmer.minMirror}</span>
                  <span>Max: {farmer.maxMirror}</span>
                </div>
                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    className="button primary lg w-full"
                    onClick={() => setShowMirrorModal(true)}
                  >
                    Mirror farmer <ArrowRight size={14} />
                  </button>
                  <button
                    type="button"
                    className={`button lg w-full ${isFollowing ? "strategy-follow-button is-following" : ""}`}
                    onClick={handleToggleFollow}
                  >
                    {isFollowing ? "Following updates" : "Follow updates (Free)"}
                    {isFollowing && <Check size={12} />}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* "About this farmer" card */}
          <div className="card-soft p-4 border border-line-soft space-y-3">
            <div className="eyebrow">About this farmer</div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-ink-soft">Tier Status</span>
                <FarmerTierBadge tier={farmer.tier} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-soft">Risk Classification</span>
                <RiskBadge risk={farmer.riskTier} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-soft">Performance Fee</span>
                <span className="mono font-medium text-ink">{farmer.fee}% on alpha</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-soft">Fees Earned All-Time</span>
                <span className="mono font-medium text-profit">{farmer.feesEarnedAllTime}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-soft">Track Record</span>
                <span className="mono text-ink">{farmer.activeSince}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-soft">Baseline Beat Rate</span>
                <span className="mono text-profit">
                  {Math.round((farmer.daysBeatenBaseline / 90) * 100)}% (90d)
                </span>
              </div>

              <div className="pt-2.5 border-t border-line-soft text-[11px] text-ink-soft leading-relaxed space-y-1">
                <div className="flex items-center gap-1 font-medium text-ink">
                  <ShieldCheck size={12} className="text-coral" /> Zero Account Required
                </div>
                <p>
                  This farmer does not manage an account on mirro. Every position is indexed
                  directly from public on-chain activity. Smart contracts mirror their moves
                  non-custodially and route performance fees ({farmer.fee}%) directly to their
                  wallet.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Mirror Modal */}
      {showMirrorModal && (
        <MirrorModal
          farmer={farmer}
          onClose={() => {
            setShowMirrorModal(false);
          }}
        />
      )}
    </div>
  );
}
