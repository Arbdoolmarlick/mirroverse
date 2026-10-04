import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Search,
  SlidersHorizontal,
  Check,
  ArrowRight,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";
import { farmers as initialFarmers, type Asset, type Farmer } from "@/lib/mirro-data";
import { useOnChainLeaderboard } from "@/lib/use-onchain-data";
import {
  AssetBadge,
  FarmerTierBadge,
  RiskBadge,
  HelpQuestionButton,
  MirrorModal,
  PageHead,
} from "@/components/mirro-ui";

export const Route = createFileRoute("/app/leaderboard")({
  head: () => ({
    meta: [{ title: "mirro — Leaderboard" }],
  }),
  component: LeaderboardPage,
});

type SortOption = "alpha" | "apy" | "tvl" | "followers" | "mirrors";

function LeaderboardPage() {
  const navigate = useNavigate();
  const { farmers, summary, isLoading } = useOnChainLeaderboard();
  const [followedFarmers, setFollowedFarmers] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem("mirro_followed_farmers") || "[]");
    } catch {
      return [];
    }
  });
  const [selectedAsset, setSelectedAsset] = useState<string>("All");
  const [sortBy, setSortBy] = useState<SortOption>("alpha");
  const [search, setSearch] = useState("");
  const [mirrorTarget, setMirrorTarget] = useState<Farmer | null>(null);

  const toggleFollow = (id: string, name: string) => {
    setFollowedFarmers((prev) => {
      let next: string[];
      if (prev.includes(id)) {
        next = prev.filter((fid) => fid !== id);
        toast(`Unfollowed ${name}`);
      } else {
        next = [...prev, id];
        toast.success(`Following ${name}`);
      }
      try {
        localStorage.setItem("mirro_followed_farmers", JSON.stringify(next));
      } catch {
        // Ignore storage errors in restricted iframe
      }
      return next;
    });
  };

  const filteredFarmers = useMemo(() => {
    return farmers
      .filter((f) => {
        if (selectedAsset !== "All" && !f.assets.includes(selectedAsset as Asset)) {
          return false;
        }
        if (search.trim()) {
          const q = search.toLowerCase();
          return (
            f.name.toLowerCase().includes(q) ||
            f.wallet.toLowerCase().includes(q) ||
            f.bio.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "alpha") return b.alpha - a.alpha;
        if (sortBy === "apy") return b.apy - a.apy;
        if (sortBy === "followers") return b.followers - a.followers;
        if (sortBy === "mirrors") return b.mirrors - a.mirrors;
        if (sortBy === "tvl") {
          const parseTvl = (v: string) => parseFloat(v.replace(/[^0-9.]/g, ""));
          return parseTvl(b.tvl) - parseTvl(a.tvl);
        }
        return 0;
      });
  }, [farmers, selectedAsset, sortBy, search]);

  return (
    <div className="page space-y-8">
      {/* Page Header */}
      <PageHead
        title="Leaderboard"
        tagline="Discover verified on-chain yield farmers. Mirror them permissionlessly via smart contracts."
      >
        <div className="header-meta">
          09 indexed vaults & strategies
          <br />
          updated live on-chain
        </div>
      </PageHead>

      {/* Permissionless Architecture Callout */}
      <div className="card-soft p-4 border border-line-soft flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-start gap-2.5">
          <ShieldCheck size={18} className="text-coral shrink-0 mt-0.5" />
          <div>
            <div className="font-medium text-ink">Permissionless On-Chain Index</div>
            <p className="text-ink-soft text-[11px] leading-relaxed mt-0.5">
              These top yield-earning vaults and curator strategies are indexed directly from public
              blockchain activity on Arbitrum Sepolia and leading DeFi protocols. Farmers and contracts do
              not register or maintain accounts on mirro — anyone can mirror their public positions
              non-custodially via smart contracts. When their moves beat baseline, performance fees
              automatically route on-chain to their vault.
            </p>
          </div>
        </div>
        <div className="mono text-[11px] text-ink-faint shrink-0">
          settled on-chain · 100% transparent
        </div>
      </div>

      {/* Stats row */}
      <div className="leaderboard-stats" aria-label="Protocol summary">
        <div>
          <span className="stat-label">Total Indexed TVL</span>
          <strong className="mono">{summary.totalIndexedTVLFormatted}</strong>
        </div>
        <div>
          <span className="stat-label">Tracked Vaults</span>
          <strong className="mono">{summary.trackedVaults}</strong>
        </div>
        <div>
          <span className="stat-label">Active Mirrors</span>
          <strong className="mono">{summary.activeMirrors}</strong>
        </div>
        <div>
          <span className="stat-label">On-Chain Moves</span>
          <strong className="mono">{summary.totalMoves}</strong>
        </div>
      </div>
      <p className="leaderboard-tagline">Trade strategies, not just stocks.</p>

      {/* Farmers Table Card Container */}
      <div className="table-scroll">
        {/* Toolbar with Search, Asset Filter Chips, and Sort */}
        <div className="toolbar">
          <div className="toolbar-left">
            <label className="search" htmlFor="farmer-search">
              <Search />
              <input
                id="farmer-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search farmers..."
              />
            </label>
            <div className="flex gap-1">
              {["All", "USDG", "ETH", "USDC", "WBTC"].map((asset) => (
                <button
                  key={asset}
                  type="button"
                  className={`filter ${selectedAsset === asset ? "selected" : ""}`}
                  onClick={() => setSelectedAsset(asset)}
                >
                  {asset}
                </button>
              ))}
            </div>
          </div>

          <div className="toolbar-right">
            <SlidersHorizontal size={14} className="muted" />
            <select
              className="select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
            >
              <option value="alpha">Alpha vs Baseline</option>
              <option value="apy">APY 30D</option>
              <option value="tvl">Total Value Locked</option>
              <option value="followers">Followers</option>
              <option value="mirrors">Mirrors</option>
            </select>
          </div>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Farmer</th>
              <th>Assets</th>
              <th className="num">
                <span className="inline-flex items-center gap-1 justify-end">
                  APY 30D <HelpQuestionButton question="How is APY calculated?" />
                </span>
              </th>
              <th className="num">
                <span className="inline-flex items-center gap-1 justify-end">
                  Alpha <HelpQuestionButton question="What does Alpha vs Baseline mean?" />
                </span>
              </th>
              <th className="num">TVL</th>
              <th className="num">Followers</th>
              <th className="num">Mirrors</th>
              <th className="num">
                <span className="inline-flex items-center gap-1 justify-end">
                  Fee <HelpQuestionButton question="How does the performance fee work?" />
                </span>
              </th>
              <th className="num">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredFarmers.map((f, index) => {
              const isFollowed = followedFarmers.includes(f.id);
              return (
                <tr
                  key={f.id}
                  className="strategy-row cursor-pointer"
                  onClick={() => navigate({ to: "/app/farmer/$id", params: { id: f.id } })}
                >
                  <td className="strategy-index">{String(index + 1).padStart(2, "0")}</td>
                  <td>
                    <div className="strategy-name">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Link
                            to="/app/farmer/$id"
                            params={{ id: f.id }}
                            className="font-medium text-ink hover:text-coral transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {f.name}
                          </Link>
                          <FarmerTierBadge tier={f.tier} />
                          <span className="type-mark ai">ai-vetted</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="trader" title={f.wallet}>
                            {f.wallet.length > 14
                              ? `${f.wallet.slice(0, 6)}...${f.wallet.slice(-4)}`
                              : f.wallet}
                          </span>
                          <a
                            href={`https://sepolia.arbiscan.io/address/${f.wallet}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-ink-faint hover:text-coral transition-colors"
                            title={`View ${f.wallet} on Arbiscan`}
                          >
                            <ExternalLink size={10} />
                          </a>
                          <RiskBadge risk={f.riskTier} />
                          {f.onchainStats && f.onchainStats.totalMoves > 0 && (
                            <span className="text-[10px] font-mono text-ink-faint px-1.5 py-0.2 rounded bg-canvas-deep border border-line-soft">
                              {f.onchainStats.totalMoves} {f.onchainStats.totalMoves === 1 ? "move" : "moves"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="flex gap-1 flex-wrap">
                      {f.assets.map((asset) => (
                        <AssetBadge key={asset}>{asset}</AssetBadge>
                      ))}
                    </div>
                  </td>
                  <td className="num mono positive">+{f.apy}%</td>
                  <td className={`num mono ${f.alpha >= 0 ? "positive" : "negative"}`}>
                    {f.alpha >= 0 ? `+${f.alpha}%` : `${f.alpha}%`}
                  </td>
                  <td className="num mono">
                    <div>{f.tvl}</div>
                    {f.onchainStats && f.onchainStats.totalCopiedCapitalUsd > 0 && (
                      <span className="text-[10px] text-profit font-mono">on-chain</span>
                    )}
                  </td>
                  <td className="num mono">{f.followers}</td>
                  <td className="num mono">
                    {f.mirrors}
                    {f.onchainStats && f.onchainStats.activeCopiers > 0 && (
                      <span className="block text-[10px] text-coral font-mono">active</span>
                    )}
                  </td>
                  <td className="num mono">{f.fee}%</td>
                  <td className="num" onClick={(e) => e.stopPropagation()}>
                    <div className="inline-flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => toggleFollow(f.id, f.name)}
                        className={`button sm strategy-follow-button ${
                          isFollowed ? "is-following" : ""
                        }`}
                      >
                        {isFollowed ? "Following" : "Follow"}
                        {isFollowed ? <Check size={11} /> : <ArrowRight size={11} />}
                      </button>
                      <button
                        type="button"
                        onClick={() => setMirrorTarget(f)}
                        className="button sm primary"
                      >
                        Mirror
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredFarmers.length === 0 && (
          <div className="empty">
            <Search className="empty-icon" />
            <h3>No farmers found</h3>
            <p>Try clearing your search or asset filter.</p>
            <button
              className="button"
              onClick={() => {
                setSearch("");
                setSelectedAsset("All");
              }}
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Mirror Modal */}
      {mirrorTarget && <MirrorModal farmer={mirrorTarget} onClose={() => setMirrorTarget(null)} />}
    </div>
  );
}
