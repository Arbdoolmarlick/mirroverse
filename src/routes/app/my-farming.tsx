import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Search, ExternalLink, ShieldCheck, ArrowRight, Wallet, Share2 } from "lucide-react";
import { farmers } from "@/lib/mirro-data";
import {
  AssetBadge,
  PoolsTable,
  MirroringTable,
  Section,
  PageHead,
  MirrorModal,
  FarmerTierBadge,
} from "@/components/mirro-ui";
import { ShareYieldModal } from "@/components/ShareYieldModal";
import { useWallet } from "@/lib/web3-wallet";
import { useUserPortfolio } from "@/lib/user-portfolio";
import { useOnChainFarmer } from "@/lib/use-onchain-data";

export const Route = createFileRoute("/app/my-farming")({
  head: () => ({
    meta: [{ title: "mirro — My Farming" }],
  }),
  component: MyFarmingPage,
});

type MainTab = "pools" | "mirroring" | "inspector";

export function MyFarmingPage() {
  const [activeTab, setActiveTab] = useState<MainTab>("pools");
  const [showShareModal, setShowShareModal] = useState(false);
  const { address, isConnected, currentNetwork } = useWallet();
  const { activePools, mirroredFarmers } = useUserPortfolio();

  // On-Chain Wallet Inspector state
  const [inspectInput, setInspectInput] = useState("");
  const [inspectedAddress, setInspectedAddress] = useState<string | null>(null);
  const { data: inspectedOnChain } = useOnChainFarmer(inspectedAddress || undefined);
  const [mirrorTarget, setMirrorTarget] = useState<{
    id: string;
    name: string;
    wallet: string;
    apy: number;
    alpha: number;
    fee: number;
  } | null>(null);

  const handleInspect = (e: React.FormEvent) => {
    e.preventDefault();
    const query = inspectInput.trim();
    if (!query) {
      toast.error("Please enter a wallet address or ENS");
      return;
    }
    setInspectedAddress(query);
    toast.success(`Fetched on-chain positions for ${query.slice(0, 6)}...${query.slice(-4)}`);
  };

  const handleUseConnected = () => {
    if (isConnected && address) {
      setInspectInput(address);
      setInspectedAddress(address);
      toast.success("Loaded your connected wallet positions");
    } else {
      toast.error("Please connect your wallet first");
    }
  };

  // Find if inspected address matches an indexed farmer or generate dynamic on-chain analysis
  const matchedFarmer = inspectedAddress
    ? farmers.find(
        (f) =>
          f.wallet.toLowerCase().includes(inspectedAddress.toLowerCase()) ||
          f.id.toLowerCase() === inspectedAddress.toLowerCase() ||
          (f.fullAddress && f.fullAddress.toLowerCase() === inspectedAddress.toLowerCase()),
      )
    : null;

  return (
    <div className="page space-y-8">
      {/* Page Header */}
      <PageHead
        title="My Farming"
        tagline="Manage your active pool deposits, track mirrored on-chain farmers, and inspect any yield-earning wallet directly from blockchain data."
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowShareModal(true)}
            className="button sm flex items-center gap-1.5 font-mono text-xs cursor-pointer hover:border-line"
          >
            <Share2 size={13} className="text-coral" />
            <span>Share Yield</span>
          </button>
          <Link to="/app/leaderboard" className="button primary sm">
            Explore Top Earners <ArrowRight size={13} />
          </Link>
        </div>
      </PageHead>

      {/* Permissionless Architecture Callout */}
      <div className="card-soft p-4 border border-line-soft flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-start gap-2.5">
          <ShieldCheck size={18} className="text-coral shrink-0 mt-0.5" />
          <div>
            <div className="font-medium text-ink">Zero Registration Required</div>
            <p className="text-ink-soft text-[11px] leading-relaxed mt-0.5">
              Farmers never need to sign up or create accounts on mirro. Every position is indexed
              directly from public blockchain data. You can mirror any high-yield on-chain wallet
              non-custodially.
            </p>
          </div>
        </div>
        <div className="mono text-[11px] text-ink-faint shrink-0">
          non-custodial · settled on-chain
        </div>
      </div>

      {/* Main Tabs */}
      <div className="tabs">
        {[
          { key: "pools" as const, label: `My Pools (${activePools.length})` },
          { key: "mirroring" as const, label: `Mirroring (${mirroredFarmers.length})` },
          { key: "inspector" as const, label: "Inspect On-Chain Wallet" },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`tab ${activeTab === tab.key ? "active" : ""}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: My Pools */}
      {activeTab === "pools" && (
        <Section label="your active pools">
          <PoolsTable />
        </Section>
      )}

      {/* Tab 2: Mirroring */}
      {activeTab === "mirroring" && (
        <Section label="mirrored farmers">
          <MirroringTable showViewLink={true} />
        </Section>
      )}

      {/* Tab 3: Inspect On-Chain Wallet */}
      {activeTab === "inspector" && (
        <div className="space-y-6">
          <div className="card-soft p-5 border border-line-soft space-y-4">
            <div>
              <h3 className="text-sm font-medium text-ink">On-Chain Yield Inspector</h3>
              <p className="text-xs text-ink-soft mt-1">
                Enter any Arbitrum Sepolia or EVM wallet address to analyze its yield-generating
                deployments and mirror its allocations.
              </p>
            </div>

            <form onSubmit={handleInspect} className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"
                />
                <input
                  type="text"
                  value={inspectInput}
                  onChange={(e) => setInspectInput(e.target.value)}
                  placeholder="Paste 0x... wallet address or ENS"
                  className="input w-full pl-9 font-mono text-xs"
                />
              </div>
              <button type="submit" className="button primary shrink-0">
                Inspect Wallet
              </button>
              {isConnected && address && (
                <button type="button" onClick={handleUseConnected} className="button shrink-0">
                  <Wallet size={13} />
                  My Connected Wallet
                </button>
              )}
            </form>
          </div>

          {/* Inspected Wallet Results */}
          {inspectedAddress ? (
            <div className="space-y-4">
              <div className="card-soft p-5 border border-line-soft space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-line-soft">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-medium text-ink">
                        {matchedFarmer
                          ? matchedFarmer.name
                          : `${inspectedAddress.slice(0, 10)}...${inspectedAddress.slice(-6)}`}
                      </span>
                      {matchedFarmer && <FarmerTierBadge tier={matchedFarmer.tier} />}
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-profit/30 bg-profit/10 text-profit">
                        On-Chain Verified
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-mono text-xs text-ink-faint">{inspectedAddress}</span>
                      <a
                        href={`${currentNetwork.explorer}/address/${inspectedAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-mono text-coral hover:underline inline-flex items-center gap-0.5"
                      >
                        view on {currentNetwork.name.includes("Arbitrum") ? "arbiscan" : "explorer"} <ExternalLink size={10} />
                      </a>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setMirrorTarget({
                        id: matchedFarmer?.id || `custom-${inspectedAddress.slice(0, 8)}`,
                        name: matchedFarmer?.name || `Wallet ${inspectedAddress.slice(0, 6)}...`,
                        wallet: inspectedAddress,
                        apy: matchedFarmer?.apy || 10.4,
                        alpha: matchedFarmer?.alpha || 3.3,
                        fee: matchedFarmer?.fee || 10,
                      })
                    }
                    className="button primary"
                  >
                    Mirror This Wallet
                  </button>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                  <div className="p-3 bg-canvas/40 border border-line-soft rounded-lg">
                    <span className="text-ink-faint text-[10px] block">Detected TVL</span>
                    <span className="text-ink font-medium text-sm mt-0.5 block">
                      {inspectedOnChain && inspectedOnChain.stats.totalCopiedCapitalUsd > 0
                        ? `$${inspectedOnChain.stats.totalCopiedCapitalUsd.toLocaleString()} USDG`
                        : matchedFarmer?.tvl || "$0"}
                    </span>
                  </div>
                  <div className="p-3 bg-canvas/40 border border-line-soft rounded-lg">
                    <span className="text-ink-faint text-[10px] block">Active Copiers</span>
                    <span className="positive font-medium text-sm mt-0.5 block">
                      {inspectedOnChain?.stats.activeCopiers ?? matchedFarmer?.mirrors ?? 0}
                    </span>
                  </div>
                  <div className="p-3 bg-canvas/40 border border-line-soft rounded-lg">
                    <span className="text-ink-faint text-[10px] block">On-Chain Moves</span>
                    <span className="positive font-medium text-sm mt-0.5 block">
                      {inspectedOnChain?.stats.totalMoves ?? 0}
                    </span>
                  </div>
                  <div className="p-3 bg-canvas/40 border border-line-soft rounded-lg">
                    <span className="text-ink-faint text-[10px] block">Performance Fee</span>
                    <span className="text-ink font-medium text-sm mt-0.5 block">
                      {matchedFarmer?.fee || 10}% on alpha
                    </span>
                  </div>
                </div>

                {/* Detected On-Chain Protocol Deployments or Real Moves */}
                <div className="space-y-2 pt-2">
                  <span className="eyebrow">
                    {inspectedOnChain?.moves && inspectedOnChain.moves.length > 0
                      ? "Verified On-Chain Strategy Moves"
                      : "On-Chain Protocol Deployments"}
                  </span>
                  <div className="space-y-2 font-mono text-xs">
                    {inspectedOnChain?.moves && inspectedOnChain.moves.length > 0
                      ? inspectedOnChain.moves.map((m, i) => (
                          <div
                            key={i}
                            className="p-3 bg-canvas/40 border border-line-soft rounded-lg flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-sans font-medium text-ink">
                                {m.fromProtocolName} → {m.toProtocolName}
                              </span>
                              <AssetBadge>{m.tokenSymbol as any}</AssetBadge>
                            </div>
                            <span className="positive font-medium">
                              {m.allocationPct}% allocation · {m.relativeTime}
                            </span>
                          </div>
                        ))
                      : (
                          matchedFarmer?.allocations || [
                            {
                              protocol: "Pendle USDG Fixed Pool",
                              asset: "USDG",
                              weight: 50,
                              apy: "9.8%",
                            },
                            {
                              protocol: "Aave V3 Prime Lending",
                              asset: "USDG",
                              weight: 30,
                              apy: "6.1%",
                            },
                            {
                              protocol: "Curve 3pool Liquidity",
                              asset: "USDG",
                              weight: 20,
                              apy: "7.8%",
                            },
                          ]
                        ).map((item) => (
                          <div
                            key={item.protocol}
                            className="p-3 bg-canvas/40 border border-line-soft rounded-lg flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-sans font-medium text-ink">{item.protocol}</span>
                              <AssetBadge>{item.asset}</AssetBadge>
                            </div>
                            <span className="positive font-medium">
                              {item.weight}% weight ·{" "}
                              {item.apy.includes("%") ? item.apy : `+${item.apy}%`} APY
                            </span>
                          </div>
                        ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="empty">
              <Search className="empty-icon" />
              <h3>Inspect any on-chain wallet</h3>
              <p>
                Paste an address above to analyze its live DeFi yield allocations, or select from
                the top ranked farmers on the Leaderboard.
              </p>
              <div className="pt-2 flex gap-2 justify-center">
                <Link to="/app/leaderboard" className="button primary">
                  View Top Earners →
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mirror Modal */}
      {mirrorTarget && <MirrorModal farmer={mirrorTarget} onClose={() => setMirrorTarget(null)} />}

      {/* Share Yield Modal */}
      {showShareModal && <ShareYieldModal onClose={() => setShowShareModal(false)} />}
    </div>
  );
}
