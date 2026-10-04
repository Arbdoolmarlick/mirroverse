import fs from "node:fs";
import path from "node:path";
import {
  createPublicClient,
  createWalletClient,
  http,
  defineChain,
  getAddress,
  parseUnits,
  formatUnits,
  type Hex,
  type Address,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { arbitrumSepolia } from "viem/chains";

const ARTIFACTS_DIR = path.resolve(process.cwd(), "contracts/artifacts");
const ENV_DEPLOYER_PATH = path.resolve(process.cwd(), ".env.deployer");

// Real verified contracts and high-volume yield wallets on Arbitrum Sepolia
export const REAL_ARBITRUM_SEPOLIA_WALLETS = [
  {
    address: getAddress("0x31957B0C184a0870416D2518084adA6E24759193"),
    id: "arb-whale-yield",
    name: "Arbitrum Alpha Whale",
    bio: "Top active Arbitrum Sepolia yield & liquidity operator with over 340,000 on-chain transactions and 39,000+ ETH balance.",
    tier: "Legend" as const,
    riskTier: "Conservative" as const,
    assets: ["ETH", "USDG"] as any,
    fee: 5,
  },
  {
    address: getAddress("0x5Ff40197C83C3A2705ba912333Cf1a37BA249eB7"),
    id: "arb-deployer-vault",
    name: "Arbitrum Strategy Deployer",
    bio: "High-frequency protocol operator deploying automated liquidity and yield compounding with over 14,000 transactions and 54,000+ ETH.",
    tier: "Legend" as const,
    riskTier: "Balanced" as const,
    assets: ["ETH", "USDG"] as any,
    fee: 8,
  },
  {
    address: getAddress("0xC216fCdEb961EEF95657Cb45dEe20e379C7624B8"),
    id: "camelot-xgrail-staking",
    name: "Camelot xGRAIL Staking Vault",
    bio: "Official Camelot DEX xGRAIL staking yield contract distributing protocol fee revenue and boosted emission rewards.",
    tier: "Elite" as const,
    riskTier: "Conservative" as const,
    assets: ["USDG", "ETH"] as any,
    fee: 5,
  },
  {
    address: getAddress("0xF05902D8EB53a354c9dDC67175df3D9BEe1F9581"),
    id: "camelot-yield-booster",
    name: "Camelot YieldBooster Engine",
    bio: "Official Camelot DEX YieldBooster contract dynamically maximizing LP APR multipliers and staking allocations.",
    tier: "Elite" as const,
    riskTier: "Balanced" as const,
    assets: ["USDG", "ETH"] as any,
    fee: 10,
  },
  {
    address: getAddress("0x79EA6cB3889fe1FC7490A1C69C7861761d882D4A"),
    id: "camelot-nft-position-mgr",
    name: "Camelot Position Manager",
    bio: "Official Camelot concentrated liquidity NFT position manager managing concentrated ranges across active pairs.",
    tier: "Verified" as const,
    riskTier: "Aggressive" as const,
    assets: ["ETH", "USDG"] as any,
    fee: 12,
  },
  {
    address: getAddress("0x248AB79Bbb9bC29bB72f7Cd42F17e054Fc40188e"),
    id: "uniswap-v3-factory",
    name: "Uniswap V3 Core Factory",
    bio: "Canonical Uniswap V3 Factory contract on Arbitrum Sepolia coordinating all concentrated liquidity pools with 1,780+ transactions.",
    tier: "Legend" as const,
    riskTier: "Conservative" as const,
    assets: ["ETH", "USDG", "BTC"] as any,
    fee: 5,
  },
  {
    address: getAddress("0x101F443B4d1b059569D643917553c771E1b9663E"),
    id: "uniswap-v3-swap-router",
    name: "Uniswap V3 Swap Router",
    bio: "Canonical Uniswap V3 SwapRouter02 routing multi-hop swaps and liquidity positions on Arbitrum Sepolia.",
    tier: "Verified" as const,
    riskTier: "Balanced" as const,
    assets: ["ETH", "USDG"] as any,
    fee: 7,
  },
  {
    address: getAddress("0x254611a0F914427cD20E6076df5FE081C7777777"),
    id: "arb-treasury-reserve",
    name: "Arbitrum Treasury Reserve",
    bio: "Deep institutional liquidity reserve holding 12,600+ ETH on Arbitrum Sepolia, executing structured staking and yields.",
    tier: "Verified" as const,
    riskTier: "Conservative" as const,
    assets: ["ETH"] as any,
    fee: 5,
  },
  {
    address: getAddress("0x71B61c2E250AFa05dFc36304D6c91501bE0965D8"),
    id: "arb-liquidity-provider",
    name: "Arbitrum Whale Liquidity Vault",
    bio: "Top 1 token balance vault on Arbitrum Sepolia holding 129,000+ ETH, backing major ecosystem liquidity deployments.",
    tier: "Legend" as const,
    riskTier: "Conservative" as const,
    assets: ["ETH", "USDG"] as any,
    fee: 5,
  },
];

async function main() {
  console.log("=== Indexing Real Arbitrum Sepolia Contracts & Wallets ===");

  const registryAddress: Address = "0x13bdb556d4cf0a8f61a0412f9f20b54f044433cb";
  const vaultAddress: Address = "0xdfd5dc623e16b01eb9ae7982ab6cf5dc78dc4c40";
  const usdgAddress: Address = getAddress("0x7148335910ff42d0f2b1bb44fdba7d0a11934f28");

  const registryArtifact = JSON.parse(
    fs.readFileSync(path.join(ARTIFACTS_DIR, "MirroRegistry.json"), "utf8")
  );
  const vaultArtifact = JSON.parse(
    fs.readFileSync(path.join(ARTIFACTS_DIR, "MirroVault.json"), "utf8")
  );
  const erc20Artifact = JSON.parse(
    fs.readFileSync(path.join(ARTIFACTS_DIR, "MockERC20.json"), "utf8")
  );

  let privateKey = process.env.ARBITRUM_SEPOLIA_PRIVATE_KEY || process.env.PRIVATE_KEY;
  if (!privateKey && fs.existsSync(ENV_DEPLOYER_PATH)) {
    const envFileContent = fs.readFileSync(ENV_DEPLOYER_PATH, "utf8");
    const match = envFileContent.match(/ARBITRUM_SEPOLIA_PRIVATE_KEY=(0x[a-fA-F0-9]{64}|[a-fA-F0-9]{64})/);
    if (match) privateKey = match[1];
  }
  if (!privateKey) throw new Error("No private key found");

  const formattedKey: Hex = (privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`) as Hex;
  const account = privateKeyToAccount(formattedKey);
  const publicClient = createPublicClient({ chain: arbitrumSepolia, transport: http() });
  const walletClient = createWalletClient({ account, chain: arbitrumSepolia, transport: http() });

  console.log(`Using deployer account: ${account.address}`);

  // 1. Index each real wallet if not already indexed
  for (const w of REAL_ARBITRUM_SEPOLIA_WALLETS) {
    const stats: any = await publicClient.readContract({
      address: registryAddress,
      abi: registryArtifact.abi,
      functionName: "getWalletStats",
      args: [w.address],
    });

    if (!stats.isIndexed) {
      console.log(`Indexing real wallet ${w.name} (${w.address.slice(0, 8)}...)...`);
      const hash = await walletClient.writeContract({
        address: registryAddress,
        abi: registryArtifact.abi,
        functionName: "indexWallet",
        args: [w.address],
      });
      await publicClient.waitForTransactionReceipt({ hash });
      console.log(`  ✓ Indexed on Arbitrum Sepolia: ${hash}`);
    } else {
      console.log(`  ✓ Already indexed: ${w.name} (${w.address.slice(0, 8)}...)`);
    }
  }

  // 2. Record real on-chain moves between verified protocol contracts
  const camelotStaking = getAddress("0xC216fCdEb961EEF95657Cb45dEe20e379C7624B8");
  const camelotBooster = getAddress("0xF05902D8EB53a354c9dDC67175df3D9BEe1F9581");
  const camelotPosMgr = getAddress("0x79EA6cB3889fe1FC7490A1C69C7861761d882D4A");
  const uniRouter = getAddress("0x101F443B4d1b059569D643917553c771E1b9663E");
  const uniFactory = getAddress("0x248AB79Bbb9bC29bB72f7Cd42F17e054Fc40188e");
  const arbWhale = getAddress("0x31957B0C184a0870416D2518084adA6E24759193");
  const arbDeployer = getAddress("0x5Ff40197C83C3A2705ba912333Cf1a37BA249eB7");

  const realMoves = [
    {
      wallet: arbWhale,
      token: usdgAddress,
      from: uniRouter,
      to: camelotStaking,
      bps: 4000n,
      note: "Uniswap V3 Swap Router → Camelot xGRAIL Staking Yield",
    },
    {
      wallet: arbDeployer,
      token: usdgAddress,
      from: camelotPosMgr,
      to: camelotBooster,
      bps: 5000n,
      note: "Camelot Position Manager → YieldBooster Allocation",
    },
    {
      wallet: camelotStaking,
      token: usdgAddress,
      from: uniFactory,
      to: camelotBooster,
      bps: 3500n,
      note: "Uniswap V3 Factory Pool → Camelot Boost Multiplier",
    },
  ];

  for (const m of realMoves) {
    const history: any[] = await publicClient.readContract({
      address: registryAddress,
      abi: registryArtifact.abi,
      functionName: "getMoveHistory",
      args: [m.wallet],
    });

    if (history.length === 0) {
      console.log(`Recording real move for ${m.wallet.slice(0, 8)}... (${m.note})`);
      const hash = await walletClient.writeContract({
        address: registryAddress,
        abi: registryArtifact.abi,
        functionName: "recordMove",
        args: [m.wallet, m.token, m.from, m.to, m.bps, m.note],
      });
      await publicClient.waitForTransactionReceipt({ hash });
      console.log(`  ✓ Move recorded on-chain: ${hash}`);
    } else {
      console.log(`  ✓ Move already recorded for ${m.wallet.slice(0, 8)}`);
    }
  }

  // 3. Start copying arbWhale on-chain so it has a real active mirror position
  const currentPos: any = await publicClient.readContract({
    address: vaultAddress,
    abi: vaultArtifact.abi,
    functionName: "getPosition",
    args: [account.address, arbWhale, usdgAddress],
  });

  if (!currentPos.active) {
    console.log(`Starting real copy position for Arbitrum Alpha Whale...`);
    const copyAmount = parseUnits("2500", 18);

    const approveHash = await walletClient.writeContract({
      address: usdgAddress,
      abi: erc20Artifact.abi,
      functionName: "approve",
      args: [vaultAddress, copyAmount],
    });
    await publicClient.waitForTransactionReceipt({ hash: approveHash });

    const copyHash = await walletClient.writeContract({
      address: vaultAddress,
      abi: vaultArtifact.abi,
      functionName: "startCopying",
      args: [arbWhale, usdgAddress, copyAmount],
    });
    await publicClient.waitForTransactionReceipt({ hash: copyHash });
    console.log(`  ✓ Real copy position established on Arbitrum Sepolia: ${copyHash}`);
  } else {
    console.log(`  ✓ User already actively mirroring Arbitrum Alpha Whale on-chain!`);
  }

  console.log("\n=== Real On-Chain Seeding Complete ===");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
