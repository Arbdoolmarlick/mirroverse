import fs from "node:fs";
import path from "node:path";
import {
  createPublicClient,
  createWalletClient,
  http,
  defineChain,
  getAddress,
  type Hex,
  type Address,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

const arbitrumSepolia = defineChain({
  id: 421614,
  name: "Arbitrum Sepolia",
  nativeCurrency: { name: "Arbitrum Sepolia Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["https://sepolia-rollup.arbitrum.io/rpc"] } },
  blockExplorers: { default: { name: "Arbiscan", url: "https://sepolia.arbiscan.io" } },
  testnet: true,
});

const ARTIFACTS_DIR = path.resolve(process.cwd(), "contracts/artifacts");
const ENV_DEPLOYER_PATH = path.resolve(process.cwd(), ".env.deployer");

async function main() {
  console.log("Recording initial on-chain yield moves to MirroRegistry...");

  const registryAddress: Address = "0x13bdb556d4cf0a8f61a0412f9f20b54f044433cb";
  const registryArtifact = JSON.parse(
    fs.readFileSync(path.join(ARTIFACTS_DIR, "MirroRegistry.json"), "utf8")
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

  const usdgToken: Address = getAddress("0x7148335910ff42d0f2b1bb44fdba7d0a11934f28");
  const aaveV3: Address = getAddress("0xa238dd80c259a72e81d7e4664a9801593f98d1c5");
  const morphoBlue: Address = getAddress("0xbbbbbbbbbb9cc5e90e3b3af64bdaf62c37eeffcb");
  const pendleMarket: Address = getAddress("0x00000000005bbb0ef59571e58418f9a4357b68a0");

  const steakhouse = getAddress("0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB");
  const yearn = getAddress("0xa258C6308e820508291a47Cce2DA64573466d07c");
  const pendle = getAddress("0xB05B630043813fa2503254e0BCFB044D0C1Ff87d");

  const moves = [
    {
      wallet: steakhouse,
      token: usdgToken,
      from: aaveV3,
      to: morphoBlue,
      bps: 4500n, // 45%
      note: "Aave V3 → Morpho Blue USDG (spread optimization)",
    },
    {
      wallet: yearn,
      token: usdgToken,
      from: morphoBlue,
      to: pendleMarket,
      bps: 3000n, // 30%
      note: "Morpho Blue → Pendle Fixed Rate PT tranche",
    },
    {
      wallet: pendle,
      token: usdgToken,
      from: aaveV3,
      to: pendleMarket,
      bps: 5000n, // 50%
      note: "Aave V3 → Pendle PT Arbitrage Pool",
    },
  ];

  for (const m of moves) {
    console.log(`Recording move for ${m.wallet.slice(0, 8)}... (${m.note})`);
    const hash = await walletClient.writeContract({
      address: registryAddress,
      abi: registryArtifact.abi,
      functionName: "recordMove",
      args: [m.wallet, m.token, m.from, m.to, m.bps, m.note],
    });
    await publicClient.waitForTransactionReceipt({ hash });
    console.log(`  ✓ Confirmed on Arbitrum Sepolia: ${hash}`);
  }

  console.log("\n✓ On-chain move history seeded successfully!");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
