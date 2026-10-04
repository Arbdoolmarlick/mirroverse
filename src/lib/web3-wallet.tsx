/**
 * Web3 Wallet Context powered exclusively by Reown AppKit (https://docs.reown.com/)
 * Configured strictly for Arbitrum Sepolia (Chain ID 421614).
 * All connection flows, QR codes, wallet discovery, and network switching
 * are delegated directly to Reown AppKit (@reown/appkit/react).
 */

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { WagmiProvider, useAccount, useBalance, useReadContract } from "wagmi";
import { formatEther, createPublicClient, http, isAddress, getAddress, type Address } from "viem";
import { arbitrumSepolia as viemArbitrumSepolia } from "viem/chains";
import { useAppKit, useAppKitAccount, useAppKitNetwork, useDisconnect } from "@reown/appkit/react";
import { wagmiAdapter, networks, arbitrumSepolia } from "./reown-appkit";
import { MOCK_ERC20_ABI } from "./contracts";

export interface NetworkConfig {
  chainId: number;
  name: string;
  symbol: string;
  iconBg: string;
  explorer: string;
}

export const SUPPORTED_NETWORKS: NetworkConfig[] = [
  {
    chainId: 421614,
    name: "Arbitrum Sepolia",
    symbol: "ETH",
    iconBg: "#12AAFF",
    explorer: "https://sepolia.arbiscan.io",
  },
];

export interface WalletState {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  isWrongNetwork: boolean;
  balance: string;
  usdgBalance: string;
  rawEthBalance: number;
  rawUsdgBalance: number;
  walletValueUsd: number;
  isLoadingBalance: boolean;
  chainId: number | null;
  currentNetwork: NetworkConfig;
  openWalletModal: () => void;
  closeWalletModal: () => void;
  openAccountModal: () => void;
  closeAccountModal: () => void;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchChain: (chainId: number) => Promise<void>;
  refetchBalances: () => Promise<void>;
}

const WalletContext = createContext<WalletState | undefined>(undefined);

// Deployed USDG token contract address on Arbitrum Sepolia
const USDG_TOKEN_ADDRESS = "0x7148335910ff42d0f2b1bb44fdba7d0a11934f28" as Address;

const ARBITRUM_SEPOLIA_RPCS = [
  "https://sepolia-rollup.arbitrum.io/rpc",
  "https://arbitrum-sepolia-rpc.publicnode.com",
];

function WalletProviderInner({ children }: { children: ReactNode }) {
  const { open, close } = useAppKit();
  const { address: wagmiAddress, isConnected: wagmiIsConnected } = useAccount();
  const { address: appKitAddress, isConnected: appKitIsConnected, status } = useAppKitAccount();
  const { chainId, switchNetwork } = useAppKitNetwork();
  const { disconnect } = useDisconnect();

  // Unified address resolution
  const candidateAddress = wagmiAddress || appKitAddress || null;
  const activeAddress =
    candidateAddress && isAddress(candidateAddress)
      ? (getAddress(candidateAddress) as Address)
      : null;

  const isConnected = Boolean((wagmiIsConnected || appKitIsConnected) && activeAddress);

  const numChainId =
    typeof chainId === "number" ? chainId : chainId ? parseInt(String(chainId), 10) : 421614;

  const isWrongNetwork = Boolean(isConnected && numChainId !== 421614);

  const currentNetwork =
    SUPPORTED_NETWORKS.find((n) => n.chainId === numChainId) || SUPPORTED_NETWORKS[0];

  // 1. Wagmi balance reads with automatic 6-second polling
  const { data: balanceData, refetch: refetchWagmiEth } = useBalance({
    address: activeAddress ? (activeAddress as `0x${string}`) : undefined,
    chainId: 421614,
    query: {
      enabled: Boolean(activeAddress),
      refetchInterval: 6000,
    },
  });

  const { data: usdgRawBalance, refetch: refetchWagmiUsdg } = useReadContract({
    address: USDG_TOKEN_ADDRESS,
    abi: MOCK_ERC20_ABI,
    functionName: "balanceOf",
    args: activeAddress ? [activeAddress] : undefined,
    chainId: 421614,
    query: {
      enabled: Boolean(activeAddress),
      refetchInterval: 6000,
    },
  });

  // 2. Direct Viem RPC queries (guaranteed fallback that bypasses any client caching issues)
  const [directEthBalance, setDirectEthBalance] = useState<number | null>(null);
  const [directUsdgBalance, setDirectUsdgBalance] = useState<number | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  const fetchDirectBalances = useCallback(async () => {
    if (!activeAddress) {
      setDirectEthBalance(null);
      setDirectUsdgBalance(null);
      return;
    }

    setIsLoadingBalance(true);
    for (const rpcUrl of ARBITRUM_SEPOLIA_RPCS) {
      try {
        const client = createPublicClient({
          chain: viemArbitrumSepolia,
          transport: http(rpcUrl, { timeout: 6000 }),
        });

        const [ethWei, usdgWei] = await Promise.all([
          client.getBalance({ address: activeAddress }),
          client.readContract({
            address: USDG_TOKEN_ADDRESS,
            abi: MOCK_ERC20_ABI,
            functionName: "balanceOf",
            args: [activeAddress],
          }),
        ]);

        const ethNum = parseFloat(formatEther(ethWei));
        const usdgNum = parseFloat(formatEther(usdgWei as bigint));

        setDirectEthBalance(ethNum);
        setDirectUsdgBalance(usdgNum);
        break;
      } catch (err) {
        // Try next RPC endpoint
        console.warn(`RPC ${rpcUrl} balance query error:`, err);
      }
    }
    setIsLoadingBalance(false);
  }, [activeAddress]);

  useEffect(() => {
    void fetchDirectBalances();
    if (!activeAddress) return;
    const interval = setInterval(() => {
      void fetchDirectBalances();
    }, 6000);
    return () => clearInterval(interval);
  }, [activeAddress, fetchDirectBalances]);

  // Combined balance calculation: direct on-chain RPC takes precedence, fallback to wagmi
  const wagmiEthNum = balanceData ? parseFloat(balanceData.formatted) : 0;
  const wagmiUsdgNum = usdgRawBalance ? parseFloat(formatEther(usdgRawBalance as bigint)) : 0;

  const rawEthBalance = directEthBalance !== null ? directEthBalance : wagmiEthNum;
  const rawUsdgBalance = directUsdgBalance !== null ? directUsdgBalance : wagmiUsdgNum;

  // Format strings
  const balance = rawEthBalance.toLocaleString(undefined, {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  });

  const usdgBalance = rawUsdgBalance.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  // Estimated portfolio value in USD assuming 1 USDG = $1 and ETH ~ $2,600
  const walletValueUsd = rawUsdgBalance + rawEthBalance * 2600;

  const refetchBalances = useCallback(async () => {
    await Promise.all([
      fetchDirectBalances(),
      refetchWagmiEth(),
      refetchWagmiUsdg(),
    ]);
  }, [fetchDirectBalances, refetchWagmiEth, refetchWagmiUsdg]);

  const handleOpenWalletModal = () => {
    void open({ view: "Connect" });
  };

  const handleOpenAccountModal = () => {
    void open({ view: "Account" });
  };

  const handleSwitchChain = async (targetChainId: number) => {
    const net = networks.find((n) => n.id === targetChainId);
    if (net) {
      await switchNetwork(net);
    } else {
      void open({ view: "Networks" });
    }
  };

  // If connected to wrong network (e.g. Ethereum Mainnet), auto-prompt switch to Arbitrum Sepolia
  useEffect(() => {
    if (isConnected && numChainId !== 421614) {
      void switchNetwork(arbitrumSepolia);
    }
  }, [isConnected, numChainId, switchNetwork]);

  return (
    <WalletContext.Provider
      value={{
        address: activeAddress || null,
        isConnected,
        isConnecting: status === "connecting" || status === "reconnecting",
        isWrongNetwork,
        balance,
        usdgBalance,
        rawEthBalance,
        rawUsdgBalance,
        walletValueUsd,
        isLoadingBalance,
        chainId: numChainId,
        currentNetwork,
        openWalletModal: handleOpenWalletModal,
        closeWalletModal: () => {
          void close();
        },
        openAccountModal: handleOpenAccountModal,
        closeAccountModal: () => {
          void close();
        },
        connect: async () => {
          await open({ view: "Connect" });
        },
        disconnect: () => {
          void disconnect();
        },
        switchChain: handleSwitchChain,
        refetchBalances,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function WalletProvider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <WalletProviderInner>{children}</WalletProviderInner>
    </WagmiProvider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return ctx;
}
