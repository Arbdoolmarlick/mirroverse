/**
 * Official Reown AppKit Integration (https://docs.reown.com/)
 * Configured specifically for Arbitrum Sepolia (Chain ID 421614).
 * Ensures WalletConnect session proposals and network switches include
 * full RPC URLs ('chainDefault') and Arbiscan explorer metadata.
 */

import { initSsrShims } from "./ssr-shim";
initSsrShims();

import { createAppKit } from "@reown/appkit/react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { defineChain } from "@reown/appkit/networks";

// 1. Get Project ID (https://cloud.reown.com/)
export const projectId =
  (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_REOWN_PROJECT_ID ||
  (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_WALLETCONNECT_PROJECT_ID ||
  "3a8170812b534d0ff9d794f19a901d64";

// 2. Define Arbitrum Sepolia with complete RPC configs
// Note: 'chainDefault' is required by AppKit's WalletConnectConnector for wallet_addEthereumChain
export const arbitrumSepolia = defineChain({
  id: 421614,
  name: "Arbitrum Sepolia",
  network: "arbitrum-sepolia",
  nativeCurrency: { name: "Arbitrum Sepolia Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: {
      http: [
        "https://sepolia-rollup.arbitrum.io/rpc",
        "https://arbitrum-sepolia-rpc.publicnode.com",
      ],
    },
    chainDefault: {
      http: [
        "https://sepolia-rollup.arbitrum.io/rpc",
        "https://arbitrum-sepolia-rpc.publicnode.com",
      ],
    },
    public: {
      http: ["https://sepolia-rollup.arbitrum.io/rpc"],
    },
  },
  blockExplorers: {
    default: {
      name: "Arbiscan",
      url: "https://sepolia.arbiscan.io",
      apiUrl: "https://api-sepolia.arbiscan.io/api",
    },
  },
  contracts: {
    multicall3: {
      address: "0xca11bde05977b3631167028862be2a173976ca11",
      blockCreated: 81930,
    },
  },
  testnet: true,
});

// Arbitrum One for optional mainnet reference
export const arbitrumOne = defineChain({
  id: 42161,
  name: "Arbitrum One",
  network: "arbitrum",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://arb1.arbitrum.io/rpc"] },
    chainDefault: { http: ["https://arb1.arbitrum.io/rpc"] },
  },
  blockExplorers: {
    default: { name: "Arbiscan", url: "https://arbiscan.io" },
  },
  testnet: false,
});

// Primary network list: Arbitrum Sepolia is strictly primary
export const networks = [arbitrumSepolia] as const;

// 3. Set up Wagmi Adapter
export const wagmiAdapter = new WagmiAdapter({
  networks: [arbitrumSepolia],
  projectId,
  ssr: true,
});

// 4. Initialize Reown AppKit instance
export const appKit = createAppKit({
  adapters: [wagmiAdapter],
  networks: [arbitrumSepolia],
  defaultNetwork: arbitrumSepolia,
  projectId,
  metadata: {
    name: "mirro",
    description: "Permissionless copy-yield protocol on Arbitrum Sepolia.",
    url:
      typeof window !== "undefined" && window.location?.origin
        ? window.location.origin
        : "https://mirro.fi",
    icons: [
      typeof window !== "undefined" && window.location?.origin
        ? `${window.location.origin}/favicon.png`
        : "https://mirro.fi/favicon.png",
    ],
  },
  themeMode: "light",
  themeVariables: {
    "--wcm-font-family": "DM Sans, sans-serif",
    "--wcm-accent-color": "#f36c55",
    "--wcm-border-radius-master": "4px",
  },
  chainImages: {
    421614: "https://assets.coingecko.com/coins/images/16547/large/arbitrum_logo.png",
  },
  features: {
    analytics: false,
    email: false,
    socials: false,
  },
  allowUnsupportedChain: false,
});
