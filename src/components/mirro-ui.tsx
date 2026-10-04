import { Link } from "@tanstack/react-router";
import { Check, ChevronDown, ShieldCheck, X, Sparkles, Loader2, ExternalLink } from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  baselineApy,
  aiVettingDetails,
  type Asset,
  type FarmerTier,
  type RiskTier,
  type PoolRow,
  type Farmer,
} from "@/lib/mirro-data";
import { useUserPortfolio, type ActivePoolPosition } from "@/lib/user-portfolio";
import { useWallet } from "@/lib/web3-wallet";
import { useLiveDefiPools } from "@/lib/defi-api";
import { useMirroContracts } from "@/lib/use-mirro-contracts";

export function PageHead({
  title,
  tagline,
  children,
}: {
  title: string;
  tagline?: string;
  children?: ReactNode;
}) {
  return (
    <header className="page-header">
      <div>
        <h1 className="page-title">{title}</h1>
        {tagline && <p className="page-subtitle">{tagline}</p>}
      </div>
      {children}
    </header>
  );
}

export function Section({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`section ${className}`}>
      <div className="section-heading">
        <h2 className="section-title">{label}</h2>
      </div>
      <div className="py-4">{children}</div>
    </section>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`card-soft ${className}`}>{children}</div>;
}

export function LiveChip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-profit/30 bg-profit/10 px-2.5 py-1 font-mono text-[9px] lowercase tracking-[0.06em] text-profit">
      <span className="status-pulse" />
      {children}
    </span>
  );
}

export function AssetBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full border border-line bg-canvas font-mono text-[9px] text-ink-soft">
      {children}
    </span>
  );
}

export function FarmerTierBadge({ tier }: { tier: FarmerTier }) {
  const styles: Record<FarmerTier, string> = {
    Legend: "border-coral/40 bg-coral/10 text-coral",
    Elite: "border-purple-400/40 bg-purple-400/10 text-purple-600 dark:text-purple-300",
    Verified: "border-profit/40 bg-profit/10 text-profit",
    Rookie: "border-line bg-canvas text-ink-faint",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full border font-mono text-[9px] uppercase tracking-wider ${styles[tier] || styles.Rookie}`}
    >
      {tier}
    </span>
  );
}

export function RiskBadge({ risk }: { risk: RiskTier }) {
  const dots: Record<RiskTier, string> = {
    Conservative: "bg-profit",
    Balanced: "bg-amber-500",
    Aggressive: "bg-loss",
  };
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-[9px] text-ink-soft">
      <span className={`w-1.5 h-1.5 rounded-full ${dots[risk]}`} />
      {risk}
    </span>
  );
}

export function HelpQuestionButton({ question }: { question: string }) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.dispatchEvent(new CustomEvent("open-mirro-ai", { detail: { question } }));
  };
  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border border-line text-ink-faint hover:text-coral hover:border-coral transition-colors text-[9px] font-mono cursor-pointer"
      title={`Ask AI: "${question}"`}
      aria-label={`Ask AI: "${question}"`}
    >
      ?
    </button>
  );
}

export function AiBadge({ protocol }: { protocol?: string }) {
  const [open, setOpen] = useState(false);
  const details = protocol ? aiVettingDetails[protocol] : null;

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        className="type-mark ai cursor-pointer hover:opacity-80 transition-opacity"
        title="Click to view AI Vetting Analysis"
      >
        ai-vetted
      </button>

      {open && (
        <div className="modal-backdrop" role="presentation" onClick={() => setOpen(false)}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-head">
              <div className="flex items-center gap-2">
                <ShieldCheck className="text-profit w-4 h-4" />
                <h3 className="modal-title">{protocol || "Pool"} — AI Vetting Report</h3>
              </div>
              <button type="button" className="close" onClick={() => setOpen(false)}>
                <X size={14} />
              </button>
            </div>
            <div className="modal-body space-y-3 font-mono text-xs">
              <div className="p-2.5 rounded-[12px] bg-profit/10 border border-profit/30 flex items-center justify-between text-profit">
                <span className="font-medium">Vetting Status</span>
                <span className="uppercase text-[10px] tracking-wider font-semibold">
                  {details?.verdict || "Approved"}
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-ink-faint uppercase">Smart Contract Audit</span>
                <p className="text-ink font-sans text-xs">
                  {details?.audit || "Audited by OpenZeppelin and Trail of Bits."}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-ink-faint uppercase">Revenue Source</span>
                <p className="text-ink font-sans text-xs">
                  {details?.revenueSource || "Real protocol cash flows and swap volume fees."}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-ink-faint uppercase">TVL Liquidity Health</span>
                <p className="text-ink font-sans text-xs">
                  {details?.tvlHealth || "Deep liquidity reserves with low pool concentration."}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-ink-faint uppercase">Sustainability</span>
                <p className="text-ink font-sans text-xs">
                  {details?.sustainability || "High — non-inflationary organic yield backing."}
                </p>
              </div>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="button primary w-full"
                onClick={() => setOpen(false)}
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function Positive({ children }: { children: ReactNode }) {
  return <span className="mono positive">{children}</span>;
}

export function Negative({ children }: { children: ReactNode }) {
  return <span className="mono negative">{children}</span>;
}

// Token Groups Aggregator Layer (Connected to DeFiLlama Live Market Data)
export function TokenGroups() {
  const { pools, isLive, lastUpdated } = useLiveDefiPools();
  const { isConnected, balance, usdgBalance, openWalletModal } = useWallet();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    USDG: true,
    ETH: true,
    BTC: true,
    SOL: true,
  });

  const [depositModal, setDepositModal] = useState<{
    asset: string;
    protocol: string;
    apy: number;
    balance: string;
  } | null>(null);

  const toggleGroup = (asset: string) => {
    setOpenGroups((prev) => ({ ...prev, [asset]: !prev[asset] }));
  };

  const assets: Asset[] = ["USDG", "ETH", "USDC", "WBTC"];

  const getBalance = (asset: Asset) => {
    if (!isConnected) {
      return (
        <span
          onClick={(e) => {
            e.stopPropagation();
            openWalletModal();
          }}
          className="text-coral hover:underline cursor-pointer inline-flex items-center gap-1 font-mono text-[11px]"
        >
          Connect wallet to view
        </span>
      );
    }
    if (asset === "ETH") return `${balance} ETH`;
    if (asset === "USDG") return `${usdgBalance} USDG`;
    if (asset === "USDC") return "0.00 USDC";
    if (asset === "WBTC") return "0.0000 WBTC";
    return "0.00";
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-[11px] font-mono text-ink-faint px-1 pb-1">
        <span className="flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${isLive ? "bg-profit animate-pulse" : "bg-ink-faint"}`}
          />
          {isLive ? "Live on-chain rates (Arbitrum Sepolia)" : "Arbitrum Sepolia baseline rates"}
        </span>
        <span className="text-[10px] font-mono text-ink-faint">Arbitrum Sepolia (421614)</span>
      </div>

      {assets.map((asset) => {
        const groupPools = pools[asset] || [];
        const isOpen = openGroups[asset] ?? true;
        const bestApy = groupPools.length > 0 ? Math.max(...groupPools.map((p) => p.apy)) : 0;
        const assetBalance = getBalance(asset);

        return (
          <div key={asset} className="card-soft overflow-hidden transition-all duration-100">
            {/* Header row */}
            <button
              onClick={() => toggleGroup(asset)}
              className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-canvas-deep/40 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <ChevronDown
                  className={`w-4 h-4 text-ink-faint transition-transform duration-150 ${
                    isOpen ? "" : "-rotate-90"
                  }`}
                />
                <span className="font-medium text-ink text-sm">{asset}</span>
                <span className="text-[10px] font-mono text-ink-faint">
                  ({groupPools.length} pools · best +{bestApy}%)
                </span>
              </div>
              <div className="mono text-xs text-ink">{assetBalance}</div>
            </button>

            {/* Protocol sub-rows */}
            {isOpen && (
              <div className="border-t border-line-soft divide-y divide-line-soft bg-canvas/30">
                {groupPools.map((protocol) => {
                  const isBest = protocol.apy === bestApy;
                  return (
                    <div
                      key={protocol.id}
                      className="px-5 py-3 pl-9 flex items-center justify-between hover:bg-canvas-deep/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-ink-soft text-xs">→ {protocol.protocol}</span>
                        <span className="text-ink-faint text-[10px] mono hidden sm:inline">
                          ({protocol.pool})
                        </span>
                        {isBest && (
                          <span className="text-[9px] font-mono text-coral font-medium border border-coral/40 bg-coral/10 px-1.5 py-0.5 rounded-full">
                            best
                          </span>
                        )}
                        <AiBadge poolId={protocol.id} />
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="mono text-xs positive font-medium">
                          +{protocol.apy}% APY
                        </span>
                        <span className="mono text-xs text-ink-faint hidden md:inline">
                          {protocol.tvl}
                        </span>
                        <HelpQuestionButton
                          question={`What are the risks and yield source for ${protocol.protocol}?`}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setDepositModal({
                              asset: asset,
                              protocol: protocol.protocol,
                              apy: protocol.apy,
                              balance: assetBalance,
                            })
                          }
                          className="button sm primary"
                        >
                          Deposit
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Deposit modal */}
      {depositModal && <DepositModal data={depositModal} onClose={() => setDepositModal(null)} />}
    </div>
  );
}

// Deposit Modal (Connected to real MirroVault smart contract & UserPortfolio state)
export function DepositModal({
  data,
  onClose,
}: {
  data: {
    asset: string;
    protocol: string;
    apy: number;
    balance: string;
    targetAddress?: string;
  };
  onClose: () => void;
}) {
  const { deposit } = useUserPortfolio();
  const { isConnected, openWalletModal, refetchBalances, balance, usdgBalance } = useWallet();
  const { claimFaucet, depositToPool, isPending, pendingStep } = useMirroContracts();
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const numAmount = parseFloat(amount) || 0;
  const monthlyYield = +((numAmount * (data.apy / 100)) / 12).toFixed(2);
  const annualYield = +(numAmount * (data.apy / 100)).toFixed(2);

  const currentAvailableBalance =
    data.asset === "ETH"
      ? `${balance} ETH`
      : data.asset === "USDG"
        ? `${usdgBalance} USDG`
        : data.balance;

  const handleDeposit = async () => {
    if (!isConnected) {
      openWalletModal();
      toast.info("Please connect your wallet first");
      return;
    }
    if (numAmount <= 0) {
      toast.error("Please enter a valid deposit amount.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await depositToPool({
        protocol: data.protocol,
        assetSymbol: data.asset,
        amount: numAmount,
        targetAddress: data.targetAddress,
      });

      const poolRow: PoolRow = {
        id: `${data.protocol.toLowerCase().replace(/\s+/g, "-")}-${data.asset.toLowerCase()}`,
        protocol: data.protocol,
        asset: data.asset as Asset,
        pool: `${data.asset} Yield Pool`,
        apy: data.apy,
        tvl: "$48.2M",
        aiApproved: true,
        type: "Fixed Yield",
      };

      deposit(poolRow, numAmount, res.hash, res.targetWallet);
      await refetchBalances();
      onClose();
    } catch {
      // Error notifications handled by useMirroContracts
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !isPending && !submitting) onClose();
      }}
    >
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal-head">
          <div>
            <h2 className="modal-title">Deposit into {data.protocol}</h2>
            <p className="modal-copy">
              Current pool APY: <span className="mono positive">+{data.apy}%</span>
            </p>
          </div>
          <button
            className="close"
            disabled={isPending || submitting}
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={15} />
          </button>
        </div>

        <div className="modal-body">
          <div className="field">
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="deposit-amount">Deposit Amount ({data.asset})</label>
              {data.asset !== "ETH" && isConnected && (
                <button
                  type="button"
                  onClick={async () => {
                    await claimFaucet(data.asset);
                    await refetchBalances();
                  }}
                  disabled={isPending || submitting}
                  className="text-[10px] text-coral hover:underline font-mono cursor-pointer"
                >
                  + Mint 1,000 testnet {data.asset} (Faucet)
                </button>
              )}
            </div>
            <div className="amount-input">
              <input
                id="deposit-amount"
                type="number"
                value={amount}
                disabled={isPending || submitting}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="input"
              />
              <button
                type="button"
                disabled={isPending || submitting}
                onClick={() => {
                  const cleaned = currentAvailableBalance.replace(/[^0-9.]/g, "");
                  if (cleaned && !isNaN(parseFloat(cleaned))) setAmount(cleaned);
                }}
                className="amount-symbol cursor-pointer hover:text-coral transition-colors"
                title={`Use max available ${data.asset}`}
              >
                Max
              </button>
            </div>
            <p className="modal-copy text-right">Available: {currentAvailableBalance}</p>

            {pendingStep && (isPending || submitting) && (
              <div className="bg-coral/10 border border-coral/30 rounded-xl p-3 mt-3 text-xs font-mono flex items-center gap-2 text-coral">
                <span className="w-2 h-2 rounded-full bg-coral animate-ping shrink-0" />
                <span>{pendingStep}</span>
              </div>
            )}

            {numAmount > 0 && !isPending && !submitting && (
              <div className="border border-line-soft bg-canvas/40 p-3 rounded-[14px] mt-3 font-mono text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-ink-soft">Estimated monthly yield</span>
                  <span className="positive font-medium">+${monthlyYield.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-soft">Estimated annual yield</span>
                  <span className="positive font-medium">+${annualYield.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-line-soft/40 text-[11px]">
                  <span className="text-ink-soft">Settlement network</span>
                  <span className="text-ink font-mono">Arbitrum Sepolia (421614)</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="modal-actions">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending || submitting}
            className="button"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDeposit}
            disabled={isPending || submitting}
            className="button primary"
          >
            {isPending || submitting ? (
              <span className="flex items-center gap-2">
                <Loader2 size={14} className="animate-spin" /> Confirming On-Chain...
              </span>
            ) : (
              "Confirm Deposit"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Active Pools Table (Reads live UserPortfolio state, backed by MirroVault on Arbitrum Sepolia)
export function PoolsTable() {
  const { activePools, withdrawPool } = useUserPortfolio();
  const { withdrawFromPool, isPending, pendingStep } = useMirroContracts();
  const { refetchBalances } = useWallet();
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);

  const handleWithdraw = async (pos: ActivePoolPosition) => {
    try {
      setWithdrawingId(pos.id);
      const res = await withdrawFromPool({
        protocol: pos.protocol,
        assetSymbol: pos.asset,
        targetAddress: pos.targetWallet,
      });
      withdrawPool(pos.id, res.hash);
      await refetchBalances();
    } catch {
      // Error notifications handled by useMirroContracts
    } finally {
      setWithdrawingId(null);
    }
  };

  return (
    <div className="table-scroll">
      {isPending && pendingStep && withdrawingId && (
        <div className="bg-coral/10 border border-coral/30 rounded-xl p-3 mb-3 text-xs font-mono flex items-center gap-2 text-coral">
          <span className="w-2 h-2 rounded-full bg-coral animate-ping shrink-0" />
          <span>{pendingStep}</span>
        </div>
      )}
      <table className="data-table">
        <thead>
          <tr>
            <th>Protocol</th>
            <th>Asset</th>
            <th className="num">Deposited</th>
            <th className="num">Current APY</th>
            <th className="num">Yield today</th>
            <th className="num">Total yield</th>
            <th className="num">Actions</th>
          </tr>
        </thead>
        <tbody>
          {activePools.map((pos) => (
            <tr key={pos.id} className="strategy-row">
              <td className="font-medium text-ink">
                <div className="flex items-center gap-1.5">
                  <span>{pos.protocol}</span>
                  {pos.txHash && (
                    <a
                      href={`https://sepolia.arbiscan.io/tx/${pos.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-ink-faint hover:text-coral transition-colors"
                      title="View Deposit Tx on Arbiscan"
                    >
                      <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              </td>
              <td>
                <AssetBadge>{pos.asset}</AssetBadge>
              </td>
              <td className="num mono">
                $
                {pos.deposited.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </td>
              <td className="num mono positive">+{pos.apy}%</td>
              <td className="num mono positive">
                +${((pos.deposited * (pos.apy / 100)) / 365).toFixed(2)}
              </td>
              <td className="num mono positive">+${pos.earned.toFixed(2)}</td>
              <td className="num">
                <div className="inline-flex items-center justify-end">
                  <button
                    type="button"
                    disabled={isPending && withdrawingId === pos.id}
                    onClick={() => handleWithdraw(pos)}
                    className="button sm danger"
                  >
                    {withdrawingId === pos.id ? (
                      <span className="flex items-center gap-1.5">
                        <Loader2 size={12} className="animate-spin" /> Withdrawing...
                      </span>
                    ) : (
                      "Withdraw"
                    )}
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {activePools.length === 0 && (
            <tr>
              <td colSpan={7} className="empty">
                <h3>No active pool deposits</h3>
                <p>
                  Deposit USDG, ETH, USDC, or WBTC in the "Your Tokens" section above to start earning
                  live yield on Arbitrum Sepolia.
                </p>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// Active Mirroring Table (Reads live UserPortfolio state, zero default mock data)
export function MirroringTable({ showViewLink = true }: { showViewLink?: boolean }) {
  const { mirroredFarmers, stopMirror } = useUserPortfolio();
  const { stopCopying, isPending, pendingStep } = useMirroContracts();
  const [stoppingId, setStoppingId] = useState<string | null>(null);

  const handleStop = async (row: any) => {
    if (!row.wallet) {
      toast.error("Invalid curator wallet for this position");
      return;
    }
    try {
      setStoppingId(row.id);
      await stopCopying({
        targetWallet: row.wallet,
        assetSymbol: "USDG",
      });
      stopMirror(row.id);
    } catch {
      // Toast error handled in hook
    } finally {
      setStoppingId(null);
    }
  };

  return (
    <div className="table-scroll">
      {isPending && pendingStep && (
        <div className="bg-coral/10 border border-coral/30 rounded-xl p-3 mb-3 text-xs font-mono flex items-center gap-2 text-coral">
          <span className="w-2 h-2 rounded-full bg-coral animate-ping" />
          <span>{pendingStep}</span>
        </div>
      )}
      <table className="data-table">
        <thead>
          <tr>
            <th>Farmer</th>
            <th>Asset</th>
            <th className="num">Deposited</th>
            <th className="num">Farmer APY</th>
            <th className="num">Your APY</th>
            <th className="num">Return</th>
            <th className="num">Active Since</th>
            <th className="num">Actions</th>
          </tr>
        </thead>
        <tbody>
          {mirroredFarmers.map((row) => (
            <tr key={row.id} className="strategy-row">
              <td className="font-medium text-ink">
                <Link
                  to="/app/farmer/$id"
                  params={{ id: row.farmerId }}
                  className="hover:text-coral transition-colors"
                >
                  {row.name}
                </Link>
              </td>
              <td>
                <AssetBadge>USDG</AssetBadge>
              </td>
              <td className="num mono">
                $
                {row.deposited.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </td>
              <td className="num mono positive">+{row.apy}%</td>
              <td className="num mono positive">+{row.apy}%</td>
              <td className="num mono positive">+${row.returnUsd.toFixed(2)}</td>
              <td className="num mono text-xs">{row.activeSince}</td>
              <td className="num">
                <div className="inline-flex items-center justify-end gap-2">
                  <button
                    type="button"
                    disabled={stoppingId === row.id}
                    onClick={() => handleStop(row)}
                    className="button sm danger"
                  >
                    {stoppingId === row.id ? "Stopping..." : "Stop"}
                  </button>
                  {showViewLink && (
                    <Link to="/app/farmer/$id" params={{ id: row.farmerId }} className="button sm">
                      View
                    </Link>
                  )}
                </div>
              </td>
            </tr>
          ))}
          {mirroredFarmers.length === 0 && (
            <tr>
              <td colSpan={8} className="empty">
                <h3>Not mirroring any farmers yet</h3>
                <p>Browse the leaderboard to discover top farmers and mirror their allocations.</p>
                <div className="pt-2">
                  <Link to="/app/leaderboard" className="button sm primary">
                    Explore Leaderboard →
                  </Link>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// Global Mirror Modal
export function MirrorModal({
  farmer,
  onClose,
}: {
  farmer: {
    id: string;
    name: string;
    apy: number;
    alpha: number;
    fee: number;
    wallet?: string;
  };
  onClose: () => void;
}) {
  const { mirrorFarmer } = useUserPortfolio();
  const { isConnected, balance, usdgBalance, openWalletModal, currentNetwork, refetchBalances } =
    useWallet();
  const { startCopying, isPending, pendingStep, claimFaucet } = useMirroContracts();
  const [selectedAsset, setSelectedAsset] = useState<Asset>("USDG");
  const [amount, setAmount] = useState("500");

  const numAmount = parseFloat(amount) || 0;
  const feeFraction = (farmer.fee || 10) / 100;
  const userApy = +(farmer.apy - feeFraction * farmer.alpha).toFixed(2);
  const monthlyYield = +((numAmount * (userApy / 100)) / 12).toFixed(2);
  const annualYield = +((numAmount * userApy) / 100).toFixed(2);

  const balances: Record<Asset, string> = {
    USDG: isConnected ? `${usdgBalance} USDG` : "$0.00",
    ETH: isConnected ? `${balance} ETH` : "$0.00",
    USDC: isConnected ? "0.00 USDC" : "$0.00",
    WBTC: isConnected ? "0.0000 WBTC" : "$0.00",
    BTC: isConnected ? "0.0000 WBTC" : "$0.00",
    SOL: "$0.00",
  };

  const handleConfirm = async () => {
    if (!isConnected) {
      openWalletModal();
      toast.info("Please connect your wallet first");
      return;
    }
    if (numAmount <= 0) {
      toast.error("Please enter an amount to mirror");
      return;
    }

    if (!farmer.wallet) {
      toast.error("Invalid curator wallet address");
      return;
    }

    try {
      const res = await startCopying({
        targetWallet: farmer.wallet,
        assetSymbol: selectedAsset,
        amount: numAmount,
      });

      mirrorFarmer(
        {
          ...farmer,
          wallet: res.targetWallet,
        } as unknown as Farmer,
        numAmount,
        selectedAsset,
      );
      onClose();
    } catch {
      // Toast error handled in hook
    }
  };

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(e) => {
        if (!isPending && e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal-head">
          <div>
            <h2 className="modal-title">Mirror {farmer.name}</h2>
            <p className="modal-copy">Deposit capital to automatically mirror moves on Arbitrum Sepolia.</p>
          </div>
          <button className="close" onClick={onClose} disabled={isPending} aria-label="Close modal">
            <X size={15} />
          </button>
        </div>

        <div className="modal-body">
          {/* Live Pending Transaction Banner */}
          {isPending && pendingStep && (
            <div className="bg-coral/10 border border-coral/30 rounded-xl p-3 mb-4 text-xs font-mono flex items-center gap-2 text-coral">
              <span className="w-2 h-2 rounded-full bg-coral animate-ping" />
              <span>{pendingStep}</span>
            </div>
          )}

          {/* Asset tabs */}
          <div className="field">
            <div className="flex items-center justify-between mb-1">
              <label>Select Asset</label>
              {selectedAsset !== "ETH" && isConnected && (
                <button
                  type="button"
                  onClick={async () => {
                    await claimFaucet(selectedAsset);
                    await refetchBalances();
                  }}
                  disabled={isPending}
                  className="text-[10px] text-coral hover:underline font-mono cursor-pointer"
                >
                  + Mint 1,000 testnet {selectedAsset} (Faucet)
                </button>
              )}
            </div>
            <div className="flex gap-1">
              {(["USDG", "ETH", "USDC", "WBTC"] as Asset[]).map((asset) => (
                <button
                  key={asset}
                  type="button"
                  disabled={isPending}
                  onClick={() => setSelectedAsset(asset)}
                  className={`filter ${selectedAsset === asset ? "selected" : ""}`}
                >
                  {asset}
                </button>
              ))}
            </div>
          </div>

          {/* Amount Input */}
          <div className="field">
            <label htmlFor="mirror-amount">Deposit Amount</label>
            <div className="amount-input">
              <input
                id="mirror-amount"
                type="number"
                value={amount}
                disabled={isPending}
                onChange={(e) => setAmount(e.target.value)}
                className="input"
                placeholder="0.00"
              />
              <button
                type="button"
                onClick={() => {
                  const avail = balances[selectedAsset];
                  const cleaned = avail.replace(/[^0-9.]/g, "");
                  if (cleaned && !isNaN(parseFloat(cleaned))) setAmount(cleaned);
                }}
                className="amount-symbol cursor-pointer hover:text-coral transition-colors"
                title={`Use max available ${selectedAsset}`}
              >
                Max
              </button>
            </div>
            <p className="modal-copy text-right">Available balance · {balances[selectedAsset]}</p>
          </div>

          {/* Confirm breakdown */}
          <div className="border border-line-soft bg-canvas/40 p-3 rounded-[14px] my-4 font-mono text-xs">
            <div className="confirm-line">
              <span>Farmer APY</span>
              <strong className="positive">{farmer.apy}%</strong>
            </div>
            <div className="confirm-line">
              <span>mirro baseline</span>
              <strong>{baselineApy}%</strong>
            </div>
            <div className="confirm-line">
              <span>Alpha</span>
              <strong className={farmer.alpha >= 0 ? "positive" : "negative"}>
                {farmer.alpha >= 0 ? `+${farmer.alpha}%` : `${farmer.alpha}%`}
              </strong>
            </div>
            <div className="confirm-line">
              <span>Performance fee</span>
              <strong>{farmer.fee}% of alpha only</strong>
            </div>
            <div className="confirm-line">
              <span>Your est. APY</span>
              <strong className="positive">{userApy}%</strong>
            </div>
            <div className="confirm-line">
              <span>Est. monthly yield</span>
              <strong className="positive">+${monthlyYield.toFixed(2)}</strong>
            </div>
            <div className="confirm-line">
              <span>Est. annual yield</span>
              <strong className="positive">+${annualYield.toFixed(2)}</strong>
            </div>
            <div className="confirm-line border-t border-line-soft pt-2 mt-1">
              <span className="text-[10px] text-ink-faint">Settlement Network</span>
              <span className="text-[10px] text-coral font-medium flex items-center gap-1 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-coral inline-block" />
                Arbitrum Sepolia (421614)
              </span>
            </div>
            <div className="confirm-line">
              <span className="text-[10px] text-ink-faint">Smart Contract</span>
              <span className="text-[10px] text-ink font-mono">MirroVault (Arbitrum Sepolia)</span>
            </div>
          </div>

          <p className="text-[10px] font-mono text-ink-faint mt-2 leading-relaxed">
            Your deposit will be routed non-custodially to the MirroVault contract on Arbitrum Sepolia.
            You retain 100% custody and can stop mirroring at any time.
          </p>
        </div>

        <div className="modal-actions">
          <button type="button" onClick={onClose} disabled={isPending} className="button">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isPending}
            className="button primary"
          >
            {isPending ? "Broadcasting Tx..." : "Confirm On-Chain Mirror"}
          </button>
        </div>
      </div>
    </div>
  );
}
