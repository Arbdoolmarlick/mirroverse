export type Asset = "USDG" | "ETH" | "USDC" | "WBTC" | "BTC" | "SOL";
export type Protocol = { name: string; apy: number };
export type TokenGroup = { asset: Asset; balance: string; protocols: Protocol[] };

export interface PoolRow {
  id: string;
  protocol: string;
  asset: Asset;
  pool: string;
  apy: number;
  tvl: string;
  aiApproved: boolean;
  type: "Lending" | "Liquidity" | "Fixed Yield" | "Liquid Staking";
}

export const tokenGroups: TokenGroup[] = [
  {
    asset: "USDG",
    balance: "$0.00",
    protocols: [
      { name: "Pendle Fixed Pool", apy: 9.8 },
      { name: "Curve 3pool", apy: 7.8 },
      { name: "Aave USDG", apy: 6.1 },
    ],
  },
  {
    asset: "ETH",
    balance: "$0.00",
    protocols: [
      { name: "Camelot DEX", apy: 11.2 },
      { name: "Uniswap V3", apy: 8.4 },
      { name: "Aave V3", apy: 4.8 },
    ],
  },
  {
    asset: "USDC",
    balance: "$0.00",
    protocols: [
      { name: "Camelot USDC/USDG", apy: 9.6 },
      { name: "Aave V3 USDC", apy: 5.4 },
    ],
  },
  {
    asset: "WBTC",
    balance: "$0.00",
    protocols: [
      { name: "Pendle WBTC Yield", apy: 5.2 },
      { name: "Aave WBTC", apy: 3.9 },
    ],
  },
];

export interface LegacyActivePool {
  protocol: string;
  asset: Asset;
  deposited: string;
  apy: string;
  today: string;
  total: string;
}

export interface LegacyMirroredFarmer {
  farmer: string;
  id: string;
  asset: Asset;
  deposited: string;
  farmerApy: string;
  yourApy: string;
  alpha: string;
  today: string;
}

export const activePools: LegacyActivePool[] = [];
export const mirroredFarmers: LegacyMirroredFarmer[] = [];

export type FarmerTier = "Legend" | "Elite" | "Verified" | "Rookie";
export type RiskTier = "Conservative" | "Balanced" | "Aggressive";

export interface FarmerAllocation {
  weight: number;
  protocol: string;
  asset: Asset;
  apy: string;
  value: string;
}

export interface FarmerRebalance {
  date: string;
  move: string;
  before: string;
  after: string;
  reason: string;
}

export interface Farmer {
  rank: number;
  id: string;
  name: string;
  wallet: string; // Full 42-char address
  fullAddress?: string;
  assets: Asset[];
  apy: number;
  alpha: number;
  tvl: string;
  followers: number;
  mirrors: number;
  fee: number;
  bio: string;
  tier: FarmerTier;
  riskTier: RiskTier;
  activeSince: string;
  daysBeatenBaseline: number;
  capacity: { current: string; max: string; pct: number };
  minMirror: string;
  maxMirror: string;
  feesEarnedAllTime: string;
  allocations?: FarmerAllocation[];
  rebalances?: FarmerRebalance[];
}

export const farmers: Farmer[] = [
  {
    rank: 1,
    id: "arb-whale-yield",
    name: "Arbitrum Alpha Whale",
    wallet: "0x31957B0C184a0870416D2518084adA6E24759193",
    fullAddress: "0x31957B0C184a0870416D2518084adA6E24759193",
    assets: ["ETH", "USDG"],
    apy: 9.8,
    alpha: 2.7,
    tvl: "39,929 ETH",
    followers: 1,
    mirrors: 1,
    fee: 5,
    tier: "Legend",
    riskTier: "Conservative",
    activeSince: "Active on Arbitrum Sepolia",
    daysBeatenBaseline: 100,
    capacity: { current: "2,500 USDG", max: "50,000 ETH", pct: 15 },
    minMirror: "$100",
    maxMirror: "$250,000",
    feesEarnedAllTime: "$0.00",
    bio: "Top active Arbitrum Sepolia yield & liquidity operator with over 344,000 on-chain transactions and 39,929+ ETH balance.",
    allocations: [
      {
        weight: 60,
        protocol: "Uniswap V3 Swap Router",
        asset: "ETH",
        apy: "9.5%",
        value: "23,950 ETH",
      },
      {
        weight: 40,
        protocol: "Camelot xGRAIL Staking Yield",
        asset: "USDG",
        apy: "10.2%",
        value: "15,979 ETH",
      },
    ],
    rebalances: [
      {
        date: "Live On-Chain",
        move: "Uniswap V3 Swap Router → Camelot xGRAIL Staking Yield",
        before: "6.5%",
        after: "10.2%",
        reason: "Uniswap V3 Swap Router → Camelot xGRAIL Staking Yield",
      },
    ],
  },
  {
    rank: 2,
    id: "arb-deployer-vault",
    name: "Arbitrum Strategy Deployer",
    wallet: "0x5Ff40197C83C3A2705ba912333Cf1a37BA249eB7",
    fullAddress: "0x5Ff40197C83C3A2705ba912333Cf1a37BA249eB7",
    assets: ["ETH", "USDG"],
    apy: 11.4,
    alpha: 4.3,
    tvl: "54,492 ETH",
    followers: 0,
    mirrors: 0,
    fee: 8,
    tier: "Legend",
    riskTier: "Balanced",
    activeSince: "Active on Arbitrum Sepolia",
    daysBeatenBaseline: 94,
    capacity: { current: "$0", max: "60,000 ETH", pct: 0 },
    minMirror: "$250",
    maxMirror: "$150,000",
    feesEarnedAllTime: "$0.00",
    bio: "High-frequency protocol operator deploying automated liquidity and yield compounding with over 14,500 transactions and 54,492+ ETH.",
    allocations: [
      {
        weight: 50,
        protocol: "Camelot Position Manager",
        asset: "ETH",
        apy: "10.8%",
        value: "27,246 ETH",
      },
      {
        weight: 50,
        protocol: "Camelot YieldBooster Allocation",
        asset: "USDG",
        apy: "12.0%",
        value: "27,246 ETH",
      },
    ],
    rebalances: [
      {
        date: "Live On-Chain",
        move: "Camelot Position Manager → YieldBooster Allocation",
        before: "7.1%",
        after: "12.0%",
        reason: "Camelot Position Manager → YieldBooster Allocation",
      },
    ],
  },
  {
    rank: 3,
    id: "camelot-xgrail-staking",
    name: "Camelot xGRAIL Staking Vault",
    wallet: "0xC216fCdEb961EEF95657Cb45dEe20e379C7624B8",
    fullAddress: "0xC216fCdEb961EEF95657Cb45dEe20e379C7624B8",
    assets: ["USDG", "ETH"],
    apy: 10.5,
    alpha: 3.4,
    tvl: "Camelot Protocol",
    followers: 0,
    mirrors: 0,
    fee: 5,
    tier: "Elite",
    riskTier: "Conservative",
    activeSince: "Camelot Core Contract",
    daysBeatenBaseline: 90,
    capacity: { current: "$0", max: "10,000,000 USDG", pct: 0 },
    minMirror: "$100",
    maxMirror: "$100,000",
    feesEarnedAllTime: "$0.00",
    bio: "Official Camelot DEX xGRAIL staking yield contract distributing protocol fee revenue and boosted emission rewards on Arbitrum Sepolia.",
    allocations: [
      {
        weight: 65,
        protocol: "Uniswap V3 Factory Pool",
        asset: "USDG",
        apy: "9.8%",
        value: "Verified Contract",
      },
      {
        weight: 35,
        protocol: "Camelot Boost Multiplier",
        asset: "ETH",
        apy: "11.8%",
        value: "Verified Contract",
      },
    ],
    rebalances: [
      {
        date: "Live On-Chain",
        move: "Uniswap V3 Factory Pool → Camelot Boost Multiplier",
        before: "6.8%",
        after: "11.8%",
        reason: "Uniswap V3 Factory Pool → Camelot Boost Multiplier",
      },
    ],
  },
  {
    rank: 4,
    id: "camelot-yield-booster",
    name: "Camelot YieldBooster Engine",
    wallet: "0xF05902D8EB53a354c9dDC67175df3D9BEe1F9581",
    fullAddress: "0xF05902D8EB53a354c9dDC67175df3D9BEe1F9581",
    assets: ["USDG", "ETH"],
    apy: 9.8,
    alpha: 2.7,
    tvl: "Camelot Engine",
    followers: 0,
    mirrors: 0,
    fee: 10,
    tier: "Elite",
    riskTier: "Balanced",
    activeSince: "Camelot Core Contract",
    daysBeatenBaseline: 85,
    capacity: { current: "$0", max: "5,000,000 USDG", pct: 0 },
    minMirror: "$100",
    maxMirror: "$100,000",
    feesEarnedAllTime: "$0.00",
    bio: "Official Camelot DEX YieldBooster contract dynamically maximizing LP APR multipliers and staking allocations across Arbitrum pools.",
    allocations: [
      {
        weight: 100,
        protocol: "Camelot Boost Multiplier",
        asset: "USDG",
        apy: "9.8%",
        value: "Yield Engine",
      },
    ],
    rebalances: [],
  },
  {
    rank: 5,
    id: "camelot-nft-position-mgr",
    name: "Camelot Position Manager",
    wallet: "0x79EA6cB3889fe1FC7490A1C69C7861761d882D4A",
    fullAddress: "0x79EA6cB3889fe1FC7490A1C69C7861761d882D4A",
    assets: ["ETH", "USDG"],
    apy: 9.2,
    alpha: 2.1,
    tvl: "Camelot Positions",
    followers: 0,
    mirrors: 0,
    fee: 12,
    tier: "Verified",
    riskTier: "Aggressive",
    activeSince: "Camelot Core Contract",
    daysBeatenBaseline: 80,
    capacity: { current: "$0", max: "5,000,000 USDG", pct: 0 },
    minMirror: "$150",
    maxMirror: "$75,000",
    feesEarnedAllTime: "$0.00",
    bio: "Official Camelot concentrated liquidity NFT position manager managing concentrated ranges across active pairs.",
    allocations: [
      {
        weight: 100,
        protocol: "Concentrated Liquidity Ranges",
        asset: "ETH",
        apy: "9.2%",
        value: "Position Manager",
      },
    ],
    rebalances: [],
  },
  {
    rank: 6,
    id: "uniswap-v3-factory",
    name: "Uniswap V3 Core Factory",
    wallet: "0x248AB79Bbb9bC29bB72f7Cd42F17e054Fc40188e",
    fullAddress: "0x248AB79Bbb9bC29bB72f7Cd42F17e054Fc40188e",
    assets: ["ETH", "USDG", "BTC"],
    apy: 8.9,
    alpha: 1.8,
    tvl: "Uniswap Core",
    followers: 0,
    mirrors: 0,
    fee: 5,
    tier: "Legend",
    riskTier: "Conservative",
    activeSince: "Canonical Contract",
    daysBeatenBaseline: 98,
    capacity: { current: "$0", max: "20,000,000 USDG", pct: 0 },
    minMirror: "$100",
    maxMirror: "$500,000",
    feesEarnedAllTime: "$0.00",
    bio: "Canonical Uniswap V3 Factory contract on Arbitrum Sepolia coordinating all concentrated liquidity pools with 1,780+ transactions.",
    allocations: [
      {
        weight: 100,
        protocol: "Concentrated Liquidity Pools",
        asset: "ETH",
        apy: "8.9%",
        value: "Factory Contract",
      },
    ],
    rebalances: [],
  },
  {
    rank: 7,
    id: "uniswap-v3-swap-router",
    name: "Uniswap V3 Swap Router",
    wallet: "0x101F443B4d1b059569D643917553c771E1b9663E",
    fullAddress: "0x101F443B4d1b059569D643917553c771E1b9663E",
    assets: ["ETH", "USDG"],
    apy: 8.6,
    alpha: 1.5,
    tvl: "Swap Router",
    followers: 0,
    mirrors: 0,
    fee: 7,
    tier: "Verified",
    riskTier: "Balanced",
    activeSince: "Canonical Contract",
    daysBeatenBaseline: 82,
    capacity: { current: "$0", max: "10,000,000 USDG", pct: 0 },
    minMirror: "$100",
    maxMirror: "$100,000",
    feesEarnedAllTime: "$0.00",
    bio: "Canonical Uniswap V3 SwapRouter02 routing multi-hop swaps and liquidity positions on Arbitrum Sepolia.",
    allocations: [
      {
        weight: 100,
        protocol: "Router Liquidity Channels",
        asset: "ETH",
        apy: "8.6%",
        value: "Router Contract",
      },
    ],
    rebalances: [],
  },
  {
    rank: 8,
    id: "arb-treasury-reserve",
    name: "Arbitrum Treasury Reserve",
    wallet: "0x254611a0F914427cD20E6076df5FE081C7777777",
    fullAddress: "0x254611a0F914427cD20E6076df5FE081C7777777",
    assets: ["ETH"],
    apy: 7.8,
    alpha: 0.7,
    tvl: "12,613 ETH",
    followers: 0,
    mirrors: 0,
    fee: 5,
    tier: "Verified",
    riskTier: "Conservative",
    activeSince: "Active on Arbitrum Sepolia",
    daysBeatenBaseline: 75,
    capacity: { current: "$0", max: "20,000 ETH", pct: 0 },
    minMirror: "$200",
    maxMirror: "$500,000",
    feesEarnedAllTime: "$0.00",
    bio: "Deep institutional liquidity reserve holding 12,613+ ETH on Arbitrum Sepolia, executing structured staking and yields.",
    allocations: [
      {
        weight: 100,
        protocol: "Arbitrum Native Reserve Staking",
        asset: "ETH",
        apy: "7.8%",
        value: "12,613 ETH",
      },
    ],
    rebalances: [],
  },
  {
    rank: 9,
    id: "arb-liquidity-provider",
    name: "Arbitrum Whale Liquidity Vault",
    wallet: "0x71B61c2E250AFa05dFc36304D6c91501bE0965D8",
    fullAddress: "0x71B61c2E250AFa05dFc36304D6c91501bE0965D8",
    assets: ["ETH", "USDG"],
    apy: 9.1,
    alpha: 2.0,
    tvl: "129,255 ETH",
    followers: 0,
    mirrors: 0,
    fee: 5,
    tier: "Legend",
    riskTier: "Conservative",
    activeSince: "Active on Arbitrum Sepolia",
    daysBeatenBaseline: 92,
    capacity: { current: "$0", max: "150,000 ETH", pct: 0 },
    minMirror: "$100",
    maxMirror: "$1,000,000",
    feesEarnedAllTime: "$0.00",
    bio: "Top token balance vault on Arbitrum Sepolia holding 129,255+ ETH, backing ecosystem liquidity deployments.",
    allocations: [
      {
        weight: 100,
        protocol: "Ecosystem Whale Liquidity",
        asset: "ETH",
        apy: "9.1%",
        value: "129,255 ETH",
      },
    ],
    rebalances: [],
  },
];



export const allocation = [
  {
    weight: 60,
    protocol: "Uniswap V3 Swap Router",
    asset: "ETH" as Asset,
    apy: "9.5%",
    value: "23,950 ETH",
  },
  {
    weight: 40,
    protocol: "Camelot xGRAIL Staking Yield",
    asset: "USDG" as Asset,
    apy: "10.2%",
    value: "15,979 ETH",
  },
];

export const baselineApy = 7.1;

export const blendedStats = { blended: "9.78%", baseline: "7.10%", alpha: "+2.68%" };

export const supportedAssetsOverview = [
  { asset: "USDG" as Asset, protocols: 3, description: "USDG Yield & Liquidity on Arbitrum Sepolia" },
  { asset: "ETH" as Asset, protocols: 3, description: "Camelot DEX & Uniswap V3 Liquidity" },
  { asset: "USDC" as Asset, protocols: 2, description: "Arbitrum Sepolia Stable Lending & AMM" },
  { asset: "WBTC" as Asset, protocols: 2, description: "Wrapped BTC Yield & Prime Vaults" },
];

export const portfolioDiversification = {
  score: 92,
  label: "Well Balanced",
  description:
    "Strong exposure across verified DEX staking contracts and liquid pools on Arbitrum Sepolia.",
  assets: [
    { name: "USDG", pct: 40, amount: "$2,500.00" },
    { name: "ETH", pct: 60, amount: "$3,750.00" },
  ],
  protocols: [
    { name: "Camelot DEX", pct: 50 },
    { name: "Uniswap V3", pct: 50 },
  ],
  correlationWarning: false,
};

export const aiVettingDetails: Record<
  string,
  {
    verdict: "Approved" | "Caution";
    audit: string;
    revenueSource: string;
    tvlHealth: string;
    sustainability: string;
  }
> = {
  "Camelot xGRAIL Staking Vault": {
    verdict: "Approved",
    audit: "Audited by Paladin & ABDK Consulting",
    revenueSource: "Camelot DEX trading fee revenue & protocol boost yield",
    tvlHealth: "Canonical Arbitrum DEX staking vault with active daily volume",
    sustainability: "Highest — organic revenue from on-chain swap fees and liquidity rewards.",
  },
  "Camelot YieldBooster Engine": {
    verdict: "Approved",
    audit: "Audited by Paladin",
    revenueSource: "Algorithmic position APR multiplier distribution",
    tvlHealth: "Core Camelot DEX yield incentive contract",
    sustainability: "High — driven by protocol governance emissions and staking locks.",
  },
  "Camelot Position Manager": {
    verdict: "Approved",
    audit: "Audited by ABDK Consulting",
    revenueSource: "Concentrated liquidity range fees",
    tvlHealth: "Automated concentrated NFT liquidity engine",
    sustainability: "High — active market-making fee generation.",
  },
  "Uniswap V3 Core Factory": {
    verdict: "Approved",
    audit: "Audited by Trail of Bits, ConsenSys Diligence & ABDK",
    revenueSource: "Canonical AMM pool trading fees",
    tvlHealth: "Battle-tested immutable factory coordinating all V3 pools",
    sustainability: "Highest — pure permissionless market maker fees.",
  },
  "Uniswap V3 Swap Router": {
    verdict: "Approved",
    audit: "Audited by OpenZeppelin & Trail of Bits",
    revenueSource: "Multi-hop routing liquidity fees",
    tvlHealth: "Deep ecosystem liquidity routing contract",
    sustainability: "Highest — swap fees settled automatically per transaction.",
  },
  "Arbitrum Alpha Whale": {
    verdict: "Approved",
    audit: "Verified on-chain activity (344,000+ txs)",
    revenueSource: "Arbitrum Sepolia yield aggregation & LP compounding",
    tvlHealth: "Over 39,900 ETH in on-chain reserve balance",
    sustainability: "High — consistent multi-contract yield allocation.",
  },
  "Arbitrum Strategy Deployer": {
    verdict: "Approved",
    audit: "Verified on-chain activity (14,500+ txs)",
    revenueSource: "Automated strategy execution and LP compounding",
    tvlHealth: "Over 54,400 ETH in on-chain reserve balance",
    sustainability: "High — active execution across Camelot and Uniswap contracts.",
  },
  "Arbitrum Treasury Reserve": {
    verdict: "Approved",
    audit: "Verified institutional reserve contract",
    revenueSource: "Reserve staking and ecosystem support yields",
    tvlHealth: "Over 12,600 ETH reserve balance",
    sustainability: "Highest — foundational ecosystem treasury.",
  },
  "Arbitrum Whale Liquidity Vault": {
    verdict: "Approved",
    audit: "Top token balance contract on Arbitrum Sepolia",
    revenueSource: "Ecosystem liquidity provision",
    tvlHealth: "Over 129,000 ETH liquidity backing",
    sustainability: "Highest — deep reserve liquidity.",
  },
};

export const performanceData = Array.from({ length: 31 }, (_, i) => ({
  day: i,
  farmer: +(7.4 + i * 0.13 + Math.sin(i / 3) * 0.7).toFixed(2),
  baseline: +(6.9 + i * 0.02 + Math.sin(i / 5) * 0.15).toFixed(2),
}));

export const closedPositions = [];

export const rebalanceHistory = [
  [
    "Live On-Chain",
    "Uniswap V3 Router → Camelot xGRAIL Staking",
    "6.5%",
    "10.2%",
    "Uniswap V3 Swap Router → Camelot xGRAIL Staking Yield",
  ],
  [
    "Live On-Chain",
    "Camelot Position Manager → YieldBooster",
    "7.1%",
    "12.0%",
    "Camelot Position Manager → YieldBooster Allocation",
  ],
  [
    "Live On-Chain",
    "Uniswap V3 Factory → Camelot YieldBooster",
    "6.8%",
    "11.8%",
    "Uniswap V3 Factory Pool → Camelot Boost Multiplier",
  ],
];
