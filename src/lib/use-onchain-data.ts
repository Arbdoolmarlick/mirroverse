import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePublicClient, useAccount, useChainId } from "wagmi";
import { formatUnits, getAddress, isAddress, type Address } from "viem";
import {
  MIRRO_REGISTRY_ADDRESSES,
  MIRRO_REGISTRY_ABI,
  MIRRO_VAULT_ADDRESSES,
  MIRRO_VAULT_ABI,
  MIRRO_TOKENS,
  ARBITRUM_SEPOLIA_CHAIN_ID,
} from "./contracts";
import { farmers as staticFarmers, type Farmer } from "./mirro-data";

export interface OnChainMove {
  token: Address;
  tokenSymbol: string;
  fromProtocol: Address;
  fromProtocolName: string;
  toProtocol: Address;
  toProtocolName: string;
  allocationBps: bigint;
  allocationPct: number;
  timestamp: number;
  date: string;
  relativeTime: string;
  note: string;
}

export interface OnChainFarmerStats {
  wallet: Address;
  totalMoves: number;
  activeCopiers: number;
  totalCopiers: number;
  isIndexed: boolean;
  firstSeenTimestamp: number;
  lastActiveTimestamp: number;
  totalCopiedCapitalUsd: number;
}

export interface OnChainUserPosition {
  targetWallet: Address;
  token: Address;
  tokenSymbol: string;
  farmerName: string;
  farmerId: string;
  depositedAmount: number;
  currentValue: number;
  startTime: number;
  lastMoveTime: number;
  active: boolean;
  activeSince: string;
}

// Known protocol names on Arbitrum Sepolia
export const KNOWN_PROTOCOLS: Record<string, string> = {
  "0xc216fcdeb961eef95657cb45dee20e379c7624b8": "Camelot xGRAIL Staking Vault",
  "0xf05902d8eb53a354c9ddc67175df3d9bee1f9581": "Camelot YieldBooster Engine",
  "0x79ea6cb3889fe1fc7490a1c69c7861761d882d4a": "Camelot Position Manager",
  "0x248ab79bbb9bc29bb72f7cd42f17e054fc40188e": "Uniswap V3 Core Factory",
  "0x101f443b4d1b059569d643917553c771e1b9663e": "Uniswap V3 Swap Router",
  "0x31957b0c184a0870416d2518084ada6e24759193": "Arbitrum Alpha Whale",
  "0x5ff40197c83c3a2705ba912333cf1a37ba249eb7": "Arbitrum Strategy Deployer",
  "0x254611a0f914427cd20e6076df5fe081c7777777": "Arbitrum Treasury Reserve",
  "0x71b61c2e250afa05dfc36304d6c91501be0965d8": "Arbitrum Whale Liquidity",
};

export function getProtocolName(address: string): string {
  const lower = address.toLowerCase();
  if (KNOWN_PROTOCOLS[lower]) return KNOWN_PROTOCOLS[lower];
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function getTokenSymbolFromAddress(address: string, chainId: number = ARBITRUM_SEPOLIA_CHAIN_ID): string {
  const tokenMap = MIRRO_TOKENS[chainId] || MIRRO_TOKENS[ARBITRUM_SEPOLIA_CHAIN_ID];
  const lower = address.toLowerCase();
  for (const [sym, addr] of Object.entries(tokenMap)) {
    if (addr.toLowerCase() === lower) return sym;
  }
  return "USDG";
}

function formatRelativeTime(timestampSec: number): string {
  if (!timestampSec) return "Recently";
  const now = Math.floor(Date.now() / 1000);
  const diff = now - timestampSec;
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(timestampSec * 1000).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Hook to fetch live on-chain leaderboard stats directly from MirroRegistry and MirroVault on Arbitrum Sepolia
 */
export function useOnChainLeaderboard() {
  const publicClient = usePublicClient({ chainId: ARBITRUM_SEPOLIA_CHAIN_ID });
  const activeChainId = ARBITRUM_SEPOLIA_CHAIN_ID;

  const registryAddress = (MIRRO_REGISTRY_ADDRESSES[activeChainId] ||
    MIRRO_REGISTRY_ADDRESSES[ARBITRUM_SEPOLIA_CHAIN_ID]) as Address;
  const vaultAddress = (MIRRO_VAULT_ADDRESSES[activeChainId] ||
    MIRRO_VAULT_ADDRESSES[ARBITRUM_SEPOLIA_CHAIN_ID]) as Address;
  const tokens = MIRRO_TOKENS[activeChainId] || MIRRO_TOKENS[ARBITRUM_SEPOLIA_CHAIN_ID];
  const usdgAddress = tokens.USDG as Address;

  const query = useQuery({
    queryKey: ["onchain-leaderboard", activeChainId, registryAddress, vaultAddress],
    queryFn: async () => {
      if (!publicClient) throw new Error("Public client not ready");

      // 1. Get indexed wallets from registry
      const indexedWallets = (await publicClient.readContract({
        address: registryAddress,
        abi: MIRRO_REGISTRY_ABI,
        functionName: "getIndexedWallets",
      })) as Address[];

      // 2. Multicall for wallet stats & copied capital
      const contracts: any[] = [];
      for (const wallet of indexedWallets) {
        contracts.push({
          address: registryAddress,
          abi: MIRRO_REGISTRY_ABI,
          functionName: "getWalletStats",
          args: [wallet],
        });
        contracts.push({
          address: vaultAddress,
          abi: MIRRO_VAULT_ABI,
          functionName: "getTotalCopiedCapital",
          args: [wallet, usdgAddress],
        });
      }

      // Add vault TVL and reserve queries
      contracts.push({
        address: vaultAddress,
        abi: MIRRO_VAULT_ABI,
        functionName: "totalValueLockedToken",
        args: [usdgAddress],
      });
      contracts.push({
        address: vaultAddress,
        abi: MIRRO_VAULT_ABI,
        functionName: "yieldReserveToken",
        args: [usdgAddress],
      });

      const results = await publicClient.multicall({ contracts });

      const statsMap = new Map<string, OnChainFarmerStats>();
      let totalProtocolCopiers = 0;
      let totalProtocolMoves = 0;
      let totalCopiedCapitalAll = 0;

      for (let i = 0; i < indexedWallets.length; i++) {
        const wallet = indexedWallets[i];
        const statsRes: any = results[i * 2]?.result;
        const capitalRes: any = results[i * 2 + 1]?.result;

        const activeCopiers = Number(statsRes?.activeCopiers ?? 0n);
        const totalCopiers = Number(statsRes?.totalCopiers ?? 0n);
        const totalMoves = Number(statsRes?.totalMoves ?? 0n);
        const firstSeenTimestamp = Number(statsRes?.firstSeenTimestamp ?? 0n);
        const lastActiveTimestamp = Number(statsRes?.lastActiveTimestamp ?? 0n);
        const isIndexed = Boolean(statsRes?.isIndexed ?? false);
        const capitalUsd = capitalRes ? parseFloat(formatUnits(capitalRes, 18)) : 0;

        totalProtocolCopiers += activeCopiers;
        totalProtocolMoves += totalMoves;
        totalCopiedCapitalAll += capitalUsd;

        statsMap.set(wallet.toLowerCase(), {
          wallet,
          totalMoves,
          activeCopiers,
          totalCopiers,
          isIndexed,
          firstSeenTimestamp,
          lastActiveTimestamp,
          totalCopiedCapitalUsd: capitalUsd,
        });
      }

      const vaultTvlRes: any = results[indexedWallets.length * 2]?.result;
      const vaultReserveRes: any = results[indexedWallets.length * 2 + 1]?.result;

      const vaultTvlUsd = vaultTvlRes ? parseFloat(formatUnits(vaultTvlRes, 18)) : 0;
      const vaultReserveUsd = vaultReserveRes ? parseFloat(formatUnits(vaultReserveRes, 18)) : 0;

      return {
        indexedWallets,
        statsMap,
        summary: {
          totalCopiedTVL: totalCopiedCapitalAll,
          vaultTvlUsd,
          vaultReserveUsd,
          totalIndexedTVLFormatted:
            vaultReserveUsd > 0
              ? `$${(totalCopiedCapitalAll + vaultReserveUsd).toLocaleString(undefined, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}`
              : `$${totalCopiedCapitalAll.toLocaleString(undefined, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })} USDG`,
          trackedVaults: indexedWallets.length,
          activeMirrors: totalProtocolCopiers,
          totalMoves: totalProtocolMoves,
        },
      };
    },
    refetchInterval: 12000, // auto refetch every 12s on testnet
    staleTime: 6000,
  });

  // Merge static metadata with live on-chain stats
  const enrichedFarmers: (Farmer & {
    onchainStats?: OnChainFarmerStats;
    onchainTvlFormatted?: string;
  })[] = useMemo(() => {
    return staticFarmers.map((f) => {
      const stats = query.data?.statsMap.get(f.wallet.toLowerCase());
      if (!stats) return f;

      const tvlDisplay =
        stats.totalCopiedCapitalUsd > 0
          ? `$${stats.totalCopiedCapitalUsd.toLocaleString(undefined, {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })} USDG`
          : f.tvl;

      return {
        ...f,
        tvl: tvlDisplay,
        followers: stats.activeCopiers > 0 ? stats.activeCopiers : f.followers,
        mirrors: stats.activeCopiers > 0 ? stats.activeCopiers : f.mirrors,
        onchainStats: stats,
        onchainTvlFormatted: tvlDisplay,
      };
    });
  }, [query.data]);

  return {
    farmers: enrichedFarmers,
    summary: query.data?.summary || {
      totalCopiedTVL: 2500,
      vaultTvlUsd: 2500,
      vaultReserveUsd: 0,
      totalIndexedTVLFormatted: "$2,500 USDG",
      trackedVaults: 9,
      activeMirrors: 1,
      totalMoves: 3,
    },
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

/**
 * Hook to query live moves, stats, and user copy position for a specific target farmer
 */
export function useOnChainFarmer(targetWalletAddress?: string) {
  const publicClient = usePublicClient({ chainId: ARBITRUM_SEPOLIA_CHAIN_ID });
  const { address: userAddress } = useAccount();
  const activeChainId = ARBITRUM_SEPOLIA_CHAIN_ID;

  const registryAddress = (MIRRO_REGISTRY_ADDRESSES[activeChainId] ||
    MIRRO_REGISTRY_ADDRESSES[ARBITRUM_SEPOLIA_CHAIN_ID]) as Address;
  const vaultAddress = (MIRRO_VAULT_ADDRESSES[activeChainId] ||
    MIRRO_VAULT_ADDRESSES[ARBITRUM_SEPOLIA_CHAIN_ID]) as Address;
  const tokens = MIRRO_TOKENS[activeChainId] || MIRRO_TOKENS[ARBITRUM_SEPOLIA_CHAIN_ID];
  const usdgAddress = tokens.USDG as Address;

  const validTarget = useMemo(() => {
    if (!targetWalletAddress || !isAddress(targetWalletAddress)) return null;
    return getAddress(targetWalletAddress) as Address;
  }, [targetWalletAddress]);

  return useQuery({
    queryKey: ["onchain-farmer", validTarget, userAddress, activeChainId],
    enabled: Boolean(validTarget && publicClient),
    queryFn: async () => {
      if (!publicClient || !validTarget) throw new Error("Invalid parameters");

      const [statsRes, movesRes, copiedCapitalRes, userPositionRes] = await Promise.all([
        publicClient.readContract({
          address: registryAddress,
          abi: MIRRO_REGISTRY_ABI,
          functionName: "getWalletStats",
          args: [validTarget],
        }) as Promise<any>,
        publicClient.readContract({
          address: registryAddress,
          abi: MIRRO_REGISTRY_ABI,
          functionName: "getMoveHistory",
          args: [validTarget],
        }) as Promise<any[]>,
        publicClient.readContract({
          address: vaultAddress,
          abi: MIRRO_VAULT_ABI,
          functionName: "getTotalCopiedCapital",
          args: [validTarget, usdgAddress],
        }) as Promise<bigint>,
        userAddress && isAddress(userAddress)
          ? (publicClient.readContract({
              address: vaultAddress,
              abi: MIRRO_VAULT_ABI,
              functionName: "getPosition",
              args: [getAddress(userAddress) as Address, validTarget, usdgAddress],
            }) as Promise<any>)
          : Promise.resolve(null),
      ]);

      const moves: OnChainMove[] = movesRes.map((m: any) => {
        const token = m.token as Address;
        const fromProtocol = m.fromProtocol as Address;
        const toProtocol = m.toProtocol as Address;
        const allocationBps = m.allocationBps as bigint;
        const timestamp = Number(m.timestamp);

        return {
          token,
          tokenSymbol: getTokenSymbolFromAddress(token, activeChainId),
          fromProtocol,
          fromProtocolName: getProtocolName(fromProtocol),
          toProtocol,
          toProtocolName: getProtocolName(toProtocol),
          allocationBps,
          allocationPct: Number(allocationBps) / 100,
          timestamp,
          date: new Date(timestamp * 1000).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          relativeTime: formatRelativeTime(timestamp),
          note: m.note || "Yield strategy rebalance",
        };
      });

      const copiedCapitalUsd = copiedCapitalRes ? parseFloat(formatUnits(copiedCapitalRes, 18)) : 0;

      let userPosition: OnChainUserPosition | null = null;
      if (userPositionRes && userPositionRes.active) {
        const deposited = parseFloat(formatUnits(userPositionRes.depositedAmount, 18));
        const currentVal = parseFloat(formatUnits(userPositionRes.currentValue, 18));
        const startTime = Number(userPositionRes.startTime);
        userPosition = {
          targetWallet: validTarget,
          token: userPositionRes.token as Address,
          tokenSymbol: getTokenSymbolFromAddress(userPositionRes.token, activeChainId),
          farmerName: staticFarmers.find((f) => f.wallet.toLowerCase() === validTarget.toLowerCase())?.name || "Target Vault",
          farmerId: staticFarmers.find((f) => f.wallet.toLowerCase() === validTarget.toLowerCase())?.id || "unknown",
          depositedAmount: deposited,
          currentValue: currentVal,
          startTime,
          lastMoveTime: Number(userPositionRes.lastMoveTime),
          active: Boolean(userPositionRes.active),
          activeSince: formatRelativeTime(startTime),
        };
      }

      return {
        stats: {
          wallet: validTarget,
          totalMoves: Number(statsRes.totalMoves),
          activeCopiers: Number(statsRes.activeCopiers),
          totalCopiers: Number(statsRes.totalCopiers),
          firstSeenTimestamp: Number(statsRes.firstSeenTimestamp),
          lastActiveTimestamp: Number(statsRes.lastActiveTimestamp),
          isIndexed: Boolean(statsRes.isIndexed),
          totalCopiedCapitalUsd: copiedCapitalUsd,
        },
        moves,
        copiedCapitalUsd,
        userPosition,
      };
    },
    refetchInterval: 12000,
  });
}

/**
 * Hook to query all active on-chain copy positions for the connected wallet
 */
export function useOnChainUserPositions() {
  const publicClient = usePublicClient({ chainId: ARBITRUM_SEPOLIA_CHAIN_ID });
  const { address: userAddress } = useAccount();
  const activeChainId = ARBITRUM_SEPOLIA_CHAIN_ID;

  const vaultAddress = (MIRRO_VAULT_ADDRESSES[activeChainId] ||
    MIRRO_VAULT_ADDRESSES[ARBITRUM_SEPOLIA_CHAIN_ID]) as Address;

  return useQuery({
    queryKey: ["onchain-user-positions", userAddress, activeChainId],
    enabled: Boolean(userAddress && isAddress(userAddress) && publicClient),
    queryFn: async () => {
      if (!publicClient || !userAddress) return [];

      const positions = (await publicClient.readContract({
        address: vaultAddress,
        abi: MIRRO_VAULT_ABI,
        functionName: "getUserPositions",
        args: [getAddress(userAddress) as Address],
      })) as any[];

      return positions
        .filter((p: any) => p.active)
        .map((p: any) => {
          const targetWallet = p.targetWallet as Address;
          const token = p.token as Address;
          const tokenSymbol = getTokenSymbolFromAddress(token, activeChainId);
          const matchedFarmer = staticFarmers.find(
            (f) => f.wallet.toLowerCase() === targetWallet.toLowerCase()
          );
          const startTime = Number(p.startTime);

          return {
            targetWallet,
            token,
            tokenSymbol,
            farmerName: matchedFarmer?.name || `Vault (${targetWallet.slice(0, 6)}...${targetWallet.slice(-4)})`,
            farmerId: matchedFarmer?.id || targetWallet,
            depositedAmount: parseFloat(formatUnits(p.depositedAmount, 18)),
            currentValue: parseFloat(formatUnits(p.currentValue, 18)),
            startTime,
            lastMoveTime: Number(p.lastMoveTime),
            active: Boolean(p.active),
            activeSince: formatRelativeTime(startTime),
            apy: matchedFarmer?.apy || 9.4,
            fee: matchedFarmer?.fee || 5,
          };
        });
    },
    refetchInterval: 12000,
  });
}
