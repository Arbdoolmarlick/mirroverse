import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles, Share2 } from "lucide-react";
import { useUserPortfolio } from "@/lib/user-portfolio";
import { useWallet } from "@/lib/web3-wallet";
import {
  AssetBadge,
  PoolsTable,
  MirroringTable,
  PageHead,
  Section,
  HelpQuestionButton,
} from "@/components/mirro-ui";
import { PortfolioChart } from "@/components/mirro-charts";
import { ShareYieldModal } from "@/components/ShareYieldModal";

export const Route = createFileRoute("/app/portfolio")({
  head: () => ({
    meta: [{ title: "mirro — Portfolio" }],
  }),
  component: PortfolioPage,
});

function PortfolioPage() {
  const [showShareModal, setShowShareModal] = useState(false);
  const [timeRange, setTimeRange] = useState<"1D" | "7D" | "30D" | "All">("30D");
  const {
    activePools,
    mirroredFarmers,
    tradeHistory,
    totalDeposited,
    portfolioValue,
    totalReturn,
    totalReturnPct,
  } = useUserPortfolio();
  const { address, isConnected, balance, usdgBalance } = useWallet();

  // Dynamic asset allocation
  const assetTotals: Record<string, number> = { USDG: 0, ETH: 0, USDC: 0, WBTC: 0 };
  activePools.forEach((p) => {
    assetTotals[p.asset] = (assetTotals[p.asset] || 0) + p.currentValue;
  });
  mirroredFarmers.forEach((m) => {
    assetTotals["USDG"] = (assetTotals["USDG"] || 0) + m.currentValue;
  });

  const assetList = (["USDG", "ETH", "USDC", "WBTC"] as const).map((asset) => {
    const amount = assetTotals[asset] || 0;
    const pct = portfolioValue > 0 ? Math.round((amount / portfolioValue) * 100) : 0;
    return { asset, pct, amount: `$${amount.toFixed(2)}` };
  });

  // Dynamic protocol allocation
  const protocolTotals: Record<string, number> = {};
  activePools.forEach((p) => {
    protocolTotals[p.protocol] = (protocolTotals[p.protocol] || 0) + p.currentValue;
  });
  mirroredFarmers.forEach((m) => {
    protocolTotals[`Mirror (${m.name})`] =
      (protocolTotals[`Mirror (${m.name})`] || 0) + m.currentValue;
  });

  const protocolList = Object.entries(protocolTotals).map(([protocol, amt]) => ({
    protocol,
    pct: portfolioValue > 0 ? Math.round((amt / portfolioValue) * 100) : 0,
  }));

  // Dynamic diversification score
  const uniqueAssetsWithBalance = assetList.filter((a) => a.pct > 0).length;
  const uniqueProtocolsWithBalance = protocolList.length;

  let score: number | string = "--";
  let label = "Empty";
  let summary =
    "Deposit into pools or mirror farmers to analyze portfolio diversification and risk exposure.";
  let suggestions: string[] = [
    "Deposit USDG, ETH, USDC, or WBTC into verified pools to start earning baseline yield.",
  ];

  if (portfolioValue > 0) {
    const calcScore = Math.min(
      95,
      Math.max(40, 45 + uniqueAssetsWithBalance * 12 + uniqueProtocolsWithBalance * 6),
    );
    score = calcScore;
    if (calcScore >= 80) {
      label = "Well Balanced";
      summary = "Healthy multi-asset allocation across battle-tested protocols.";
      suggestions = ["Maintain target allocations and monitor farmer alpha performance weekly."];
    } else if (calcScore >= 60) {
      label = "Moderate";
      summary = "Exposure concentrated in a few pools. Consider diversifying across protocols.";
      suggestions = [
        "Consider allocating into Pendle fixed pools or liquid staking to hedge volatility.",
      ];
    } else {
      label = "Concentrated";
      summary = "High concentration in a single asset or protocol.";
      suggestions = ["Diversify across at least 2 assets and 2 distinct protocols for safety."];
    }
  }

  const estDailyYield = portfolioValue > 0 ? ((portfolioValue * 0.08) / 365).toFixed(2) : "0.00";

  return (
    <div className="page space-y-8">
      {/* Portfolio Header */}
      <PageHead
        title="My Portfolio"
        tagline="A clear, consolidated view of your active pools and mirrored farmers."
      >
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowShareModal(true)}
            className="button sm flex items-center gap-1.5 font-mono text-xs cursor-pointer hover:border-line"
          >
            <Share2 size={13} className="text-coral" />
            <span>Share Yield Card</span>
          </button>
          <div className="header-meta hidden sm:block">
            wallet ·{" "}
            {isConnected && address
              ? `${address.slice(0, 6)}...${address.slice(-4)}`
              : "not connected"}
            <br />
            settled on-chain
          </div>
        </div>
      </PageHead>

      {/* Summary Grid */}
      <div className="summary-grid">
        <div className="metric">
          <div className="metric-label">Available in Wallet</div>
          <div className="metric-value">
            {isConnected ? `${usdgBalance} USDG` : "$0.00"}
          </div>
          <div className="metric-note">
            {isConnected ? `+ ${balance} ETH on-chain` : "Connect wallet to view"}
          </div>
        </div>
        <div className="metric">
          <div className="metric-label">Active Portfolio Value</div>
          <div className="metric-value">
            $
            {portfolioValue.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
          <div className="metric-note">
            Across {activePools.length} pool{activePools.length === 1 ? "" : "s"} &{" "}
            {mirroredFarmers.length} mirror{mirroredFarmers.length === 1 ? "" : "s"}
          </div>
        </div>
        <div className="metric">
          <div className="metric-label">Total Deposited</div>
          <div className="metric-value">
            $
            {totalDeposited.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
          <div className="metric-note">
            {totalDeposited > 0 ? "USDG, ETH, USDC, WBTC" : "No capital deposited"}
          </div>
        </div>
        <div className="metric">
          <div className="metric-label">
            <span className="inline-flex items-center gap-1">
              Total Return <HelpQuestionButton question="How is APY calculated?" />
            </span>
          </div>
          <div className={`metric-value ${totalReturn > 0 ? "positive" : ""}`}>
            {totalReturn > 0
              ? `+$${totalReturn.toFixed(2)}`
              : totalReturn < 0
                ? `-$${Math.abs(totalReturn).toFixed(2)}`
                : "$0.00"}
          </div>
          <div className="metric-note">
            {portfolioValue > 0
              ? `${totalReturnPct >= 0 ? "+" : ""}${totalReturnPct.toFixed(2)}% net · +$${estDailyYield} /day est.`
              : "No yield accrued yet"}
          </div>
        </div>
      </div>

      {/* Portfolio Diversification Score Card */}
      <div className="card-soft p-5 border border-line-soft space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-line-soft">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full border border-coral/30 bg-coral/10 flex items-center justify-center font-mono font-medium text-coral text-lg">
              {score}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-ink text-sm">Diversification Score</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-profit/30 bg-profit/10 text-profit">
                  {label}
                </span>
                <HelpQuestionButton question="What are farmer tiers?" />
              </div>
              <p className="text-xs text-ink-soft mt-0.5">{summary}</p>
            </div>
          </div>
          <div className="mono text-xs text-ink-faint">
            Target safety: <strong className="text-ink font-medium">&gt; 80 / 100</strong>
          </div>
        </div>

        {/* Breakdown bars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1 text-xs">
          {/* Asset Allocation */}
          <div className="space-y-2">
            <span className="eyebrow">Asset Exposure</span>
            <div className="space-y-1.5 font-mono text-xs">
              {assetList.map((a) => (
                <div key={a.asset} className="flex items-center justify-between gap-2">
                  <span className="text-ink-soft w-12">{a.asset}</span>
                  <div className="flex-1 h-1.5 bg-canvas-deep rounded-full overflow-hidden border border-line-soft">
                    <div
                      className="h-full bg-coral rounded-full transition-all"
                      style={{ width: `${a.pct}%` }}
                    />
                  </div>
                  <span className="text-ink w-8 text-right">{a.pct}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Protocol Allocation */}
          <div className="space-y-2">
            <span className="eyebrow">Protocol Spread</span>
            <div className="space-y-1.5 font-mono text-xs">
              {protocolList.length === 0 ? (
                <div className="text-ink-faint text-[11px] py-2">No active protocols</div>
              ) : (
                protocolList.map((p) => (
                  <div key={p.protocol} className="flex items-center justify-between gap-2">
                    <span className="text-ink-soft w-28 truncate">{p.protocol}</span>
                    <div className="flex-1 h-1.5 bg-canvas-deep rounded-full overflow-hidden border border-line-soft">
                      <div
                        className="h-full bg-ink rounded-full transition-all"
                        style={{ width: `${p.pct}%` }}
                      />
                    </div>
                    <span className="text-ink w-8 text-right">{p.pct}%</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Optimization recommendations */}
        <div className="pt-3 border-t border-line-soft space-y-1.5 text-xs text-ink-soft">
          <div className="font-medium text-ink flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
            <Sparkles size={12} className="text-coral" /> Rebalance Suggestions
          </div>
          {suggestions.map((s, idx) => (
            <div key={idx} className="flex items-start gap-2 text-ink-soft">
              <span className="text-coral font-mono">→</span>
              <span>{s}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Chart Panel */}
      <section className="chart-panel">
        <div className="chart-head">
          <span className="chart-title">Portfolio Performance History</span>
          <div className="range-tabs">
            {(["1D", "7D", "30D", "All"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setTimeRange(tab)}
                className={`range-tab ${timeRange === tab ? "active" : ""}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
        <div className="p-4">
          <PortfolioChart range={timeRange} currentValue={portfolioValue} />
        </div>
      </section>

      {/* Section: "your pools" */}
      <Section label="your pools">
        <PoolsTable />
      </Section>

      {/* Section: "mirrored farmers" */}
      <Section label="mirrored farmers">
        <MirroringTable showViewLink={true} />
      </Section>

      {/* Section: "trade history" */}
      <Section label="trade history">
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Protocol / Farmer</th>
                <th>Asset</th>
                <th>Type</th>
                <th>Entry</th>
                <th>Exit</th>
                <th className="num">Deposited</th>
                <th className="num">Returned</th>
                <th className="num">PnL</th>
              </tr>
            </thead>
            <tbody>
              {tradeHistory.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 font-mono text-xs text-ink-faint">
                    No closed positions yet. When you withdraw a pool or stop mirroring a farmer,
                    the closed trade will be recorded here with realized PnL.
                  </td>
                </tr>
              ) : (
                tradeHistory.map((pos) => (
                  <tr key={pos.id} className="strategy-row">
                    <td className="font-medium text-ink">{pos.source}</td>
                    <td>
                      <AssetBadge>{pos.asset}</AssetBadge>
                    </td>
                    <td className="mono text-ink-faint uppercase text-[10px]">{pos.type}</td>
                    <td className="mono text-ink-soft text-xs">{pos.entry}</td>
                    <td className="mono text-ink-soft text-xs">{pos.exit}</td>
                    <td className="num mono">{pos.deposited}</td>
                    <td className="num mono">{pos.returned}</td>
                    <td className="num mono positive font-medium">{pos.pnl}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Share Yield Modal */}
      {showShareModal && <ShareYieldModal onClose={() => setShowShareModal(false)} />}
    </div>
  );
}
