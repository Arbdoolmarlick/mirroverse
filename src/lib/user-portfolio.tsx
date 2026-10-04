import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import type { Asset, PoolRow, Farmer } from "./mirro-data";
import { useOnChainUserPositions } from "./use-onchain-data";
import { PROTOCOL_TARGET_ADDRESSES } from "./contracts";

export interface ActivePoolPosition {
  id: string;
  poolId: string;
  name: string;
  asset: Asset;
  protocol: string;
  deposited: number;
  currentValue: number;
  apy: number;
  earned: number;
  depositedAt: string;
  txHash?: string;
  targetWallet?: string;
}

export interface MirroredFarmerPosition {
  id: string;
  farmerId: string;
  name: string;
  wallet: string;
  deposited: number;
  currentValue: number;
  apy: number;
  fee: number;
  returnUsd: number;
  returnPct: number;
  activeSince: string;
}

export interface TradeHistoryItem {
  id: string;
  source: string;
  asset: Asset;
  type: "pool" | "mirror";
  entry: string;
  exit: string;
  deposited: string;
  returned: string;
  pnl: string;
  timestamp: number;
}

export interface UserPortfolioState {
  activePools: ActivePoolPosition[];
  mirroredFarmers: MirroredFarmerPosition[];
  tradeHistory: TradeHistoryItem[];
  totalDeposited: number;
  portfolioValue: number;
  totalReturn: number;
  totalReturnPct: number;
  deposit: (pool: PoolRow, amount: number, txHash?: string, targetWallet?: string) => void;
  withdrawPool: (positionId: string, txHash?: string) => void;
  mirrorFarmer: (farmer: Farmer, amount: number, asset: Asset) => void;
  stopMirror: (positionId: string) => void;
  resetPortfolio: () => void;
}

const STORAGE_KEY = "mirro_user_portfolio_v2";

const PortfolioContext = createContext<UserPortfolioState | undefined>(undefined);

export function UserPortfolioProvider({ children }: { children: ReactNode }) {
  // START 100% EMPTY by default: no fake positions, real zero state
  const [activePools, setActivePools] = useState<ActivePoolPosition[]>(() => {
    if (typeof window === "undefined") return [];
    const saved = localStorage.getItem(`${STORAGE_KEY}_pools`);
    return saved ? JSON.parse(saved) : [];
  });

  const [mirroredFarmers, setMirroredFarmers] = useState<MirroredFarmerPosition[]>(() => {
    if (typeof window === "undefined") return [];
    const saved = localStorage.getItem(`${STORAGE_KEY}_mirrors`);
    return saved ? JSON.parse(saved) : [];
  });

  const [tradeHistory, setTradeHistory] = useState<TradeHistoryItem[]>(() => {
    if (typeof window === "undefined") return [];
    const saved = localStorage.getItem(`${STORAGE_KEY}_history`);
    return saved ? JSON.parse(saved) : [];
  });

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_pools`, JSON.stringify(activePools));
  }, [activePools]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_mirrors`, JSON.stringify(mirroredFarmers));
  }, [mirroredFarmers]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_history`, JSON.stringify(tradeHistory));
  }, [tradeHistory]);

  // Sync on-chain positions from MirroVault
  const { data: onChainPositions } = useOnChainUserPositions();

  useEffect(() => {
    if (!onChainPositions || onChainPositions.length === 0) return;

    // 1. Sync on-chain pool positions
    setActivePools((prev) => {
      const updated = [...prev];
      for (const onPos of onChainPositions) {
        const protocolEntry = Object.entries(PROTOCOL_TARGET_ADDRESSES).find(
          ([_, addr]) => addr.toLowerCase() === onPos.targetWallet.toLowerCase()
        );
        if (protocolEntry) {
          const protocolName = protocolEntry[0];
          const existingIdx = updated.findIndex(
            (p) =>
              (p.targetWallet && p.targetWallet.toLowerCase() === onPos.targetWallet.toLowerCase()) ||
              p.protocol.toLowerCase().includes(protocolName.toLowerCase())
          );
          if (existingIdx >= 0) {
            updated[existingIdx] = {
              ...updated[existingIdx],
              deposited: onPos.depositedAmount,
              currentValue: onPos.currentValue,
              targetWallet: onPos.targetWallet,
            };
          } else {
            updated.push({
              id: `onchain-pool-${onPos.targetWallet.toLowerCase()}`,
              poolId: `${protocolName.toLowerCase().replace(/\s+/g, "-")}-${onPos.tokenSymbol.toLowerCase()}`,
              name: `${protocolName} ${onPos.tokenSymbol}`,
              asset: onPos.tokenSymbol as Asset,
              protocol: protocolName,
              deposited: onPos.depositedAmount,
              currentValue: onPos.currentValue,
              apy: onPos.apy || 9.4,
              earned: Math.max(0, onPos.currentValue - onPos.depositedAmount),
              depositedAt: onPos.activeSince,
              targetWallet: onPos.targetWallet,
            });
          }
        }
      }
      return updated;
    });

    // 2. Sync on-chain farmer mirror positions
    setMirroredFarmers((prev) => {
      const updated = [...prev];
      for (const onPos of onChainPositions) {
        const isProtocol = Object.values(PROTOCOL_TARGET_ADDRESSES).some(
          (addr) => addr.toLowerCase() === onPos.targetWallet.toLowerCase()
        );
        if (isProtocol) continue;

        const existingIdx = updated.findIndex(
          (m) => m.wallet.toLowerCase() === onPos.targetWallet.toLowerCase()
        );
        if (existingIdx >= 0) {
          updated[existingIdx] = {
            ...updated[existingIdx],
            deposited: onPos.depositedAmount,
            currentValue: onPos.currentValue,
            activeSince: onPos.activeSince,
          };
        } else {
          updated.push({
            id: `onchain-${onPos.targetWallet.toLowerCase()}`,
            farmerId: onPos.farmerId,
            name: onPos.farmerName,
            wallet: onPos.targetWallet,
            deposited: onPos.depositedAmount,
            currentValue: onPos.currentValue,
            apy: onPos.apy,
            fee: onPos.fee,
            returnUsd: Math.max(0, onPos.currentValue - onPos.depositedAmount),
            returnPct: 0,
            activeSince: onPos.activeSince,
          });
        }
      }
      return updated;
    });
  }, [onChainPositions]);

  // Aggregate metrics
  const totalPoolsDeposited = activePools.reduce((acc, p) => acc + p.deposited, 0);
  const totalPoolsValue = activePools.reduce((acc, p) => acc + p.currentValue, 0);

  const totalMirrorsDeposited = mirroredFarmers.reduce((acc, m) => acc + m.deposited, 0);
  const totalMirrorsValue = mirroredFarmers.reduce((acc, m) => acc + m.currentValue, 0);

  const totalDeposited = totalPoolsDeposited + totalMirrorsDeposited;
  const portfolioValue = totalPoolsValue + totalMirrorsValue;
  const totalReturn = portfolioValue - totalDeposited;
  const totalReturnPct = totalDeposited > 0 ? (totalReturn / totalDeposited) * 100 : 0;

  const deposit = (
    pool: PoolRow,
    amount: number,
    txHash?: string,
    targetWallet?: string
  ) => {
    const newPos: ActivePoolPosition = {
      id: `pos-${Date.now()}`,
      poolId: pool.id,
      name: `${pool.protocol} ${pool.asset}`,
      asset: pool.asset,
      protocol: pool.protocol,
      deposited: amount,
      currentValue: amount,
      apy: pool.apy,
      earned: 0,
      depositedAt: "Just now",
      txHash,
      targetWallet,
    };

    setActivePools((prev) => [newPos, ...prev]);
  };

  const withdrawPool = (positionId: string, _txHash?: string) => {
    const found = activePools.find((p) => p.id === positionId);
    if (!found) return;

    setActivePools((prev) => prev.filter((p) => p.id !== positionId));

    // Record in trade history
    const historyEntry: TradeHistoryItem = {
      id: `hist-${Date.now()}`,
      source: found.name,
      asset: found.asset,
      type: "pool",
      entry: found.depositedAt,
      exit: "Today",
      deposited: `$${found.deposited.toFixed(2)}`,
      returned: `$${found.currentValue.toFixed(2)}`,
      pnl:
        found.earned >= 0
          ? `+$${found.earned.toFixed(2)}`
          : `-$${Math.abs(found.earned).toFixed(2)}`,
      timestamp: Date.now(),
    };

    setTradeHistory((prev) => [historyEntry, ...prev]);
  };

  const mirrorFarmer = (farmer: Farmer, amount: number, asset: Asset) => {
    const newMirror: MirroredFarmerPosition = {
      id: `mirror-${Date.now()}`,
      farmerId: farmer.id,
      name: farmer.name,
      wallet: farmer.wallet,
      deposited: amount,
      currentValue: amount,
      apy: farmer.apy,
      fee: farmer.fee,
      returnUsd: 0,
      returnPct: 0,
      activeSince: "Just now",
    };

    setMirroredFarmers((prev) => [newMirror, ...prev]);
    toast.success(`Now mirroring ${farmer.name} with $${amount.toLocaleString()} ${asset}!`);
  };

  const stopMirror = (positionId: string) => {
    const found = mirroredFarmers.find((m) => m.id === positionId);
    if (!found) return;

    setMirroredFarmers((prev) => prev.filter((m) => m.id !== positionId));

    const historyEntry: TradeHistoryItem = {
      id: `hist-${Date.now()}`,
      source: found.name,
      asset: "USDG",
      type: "mirror",
      entry: found.activeSince,
      exit: "Today",
      deposited: `$${found.deposited.toFixed(2)}`,
      returned: `$${found.currentValue.toFixed(2)}`,
      pnl:
        found.returnUsd >= 0
          ? `+$${found.returnUsd.toFixed(2)}`
          : `-$${Math.abs(found.returnUsd).toFixed(2)}`,
      timestamp: Date.now(),
    };

    setTradeHistory((prev) => [historyEntry, ...prev]);
    toast.success(`Stopped mirroring ${found.name}`);
  };

  const resetPortfolio = () => {
    setActivePools([]);
    setMirroredFarmers([]);
    setTradeHistory([]);
    localStorage.removeItem(`${STORAGE_KEY}_pools`);
    localStorage.removeItem(`${STORAGE_KEY}_mirrors`);
    localStorage.removeItem(`${STORAGE_KEY}_history`);
    toast("Portfolio reset to empty state");
  };

  return (
    <PortfolioContext.Provider
      value={{
        activePools,
        mirroredFarmers,
        tradeHistory,
        totalDeposited,
        portfolioValue,
        totalReturn,
        totalReturnPct,
        deposit,
        withdrawPool,
        mirrorFarmer,
        stopMirror,
        resetPortfolio,
      }}
    >
      {children}
    </PortfolioContext.Provider>
  );
}

export function useUserPortfolio() {
  const ctx = useContext(PortfolioContext);
  if (!ctx) {
    throw new Error("useUserPortfolio must be used within a UserPortfolioProvider");
  }
  return ctx;
}
