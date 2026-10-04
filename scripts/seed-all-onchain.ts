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
  console.log("==================================================");
  console.log("⚡ Seeding All 9 Farmers on MirroRegistry on Arbitrum Sepolia");
  console.log("==================================================\n");

  const relayerAddress: Address = "0x159dfd13ec6b23a63044f147ea49e5be2ea62357";
  const relayerArtifact = JSON.parse(
    fs.readFileSync(path.join(ARTIFACTS_DIR, "MirroRelayer.json"), "utf8")
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

  const allWallets: { name: string; wallet: Address }[] = [
    { name: "Steakhouse MetaVault", wallet: getAddress("0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB") },
    { name: "Yearn Yield Engine", wallet: getAddress("0xa258C6308e820508291a47Cce2DA64573466d07c") },
    { name: "Pendle PT Arbitrage", wallet: getAddress("0xB05B630043813fa2503254e0BCFB044D0C1Ff87d") },
    { name: "Convex 3pool Booster", wallet: getAddress("0xF403C135812408BFBE8713b5a23a04b3CA8064E0") },
    { name: "Lido Staking Allocator", wallet: getAddress("0x176F3DAb24a159341c0509bB36B833E7fdd0a132") },
    { name: "Ethena Basis Strategy", wallet: getAddress("0x9d39A5DE30e57443BfF2A8307a4406C407485802") },
    { name: "Balancer WBTC Syndicate", wallet: getAddress("0xBA12222222228d8Ba445958a75a0704d566BF2C8") },
    { name: "Marinade SOL Delegator", wallet: getAddress("0x71f2A3E0213794d255673e1b9b4aB440409F8b4A") },
    { name: "Robinhood Paxos Reserve", wallet: getAddress("0x40ec5B33f54e0E8A33A975908C5BA1c14e5BbbDf") },
  ];

  for (const item of allWallets) {
    console.log(`Indexing ${item.name} (${item.wallet})...`);
    try {
      const hash = await walletClient.writeContract({
        address: relayerAddress,
        abi: relayerArtifact.abi,
        functionName: "indexNewWallet",
        args: [item.wallet],
      });
      await publicClient.waitForTransactionReceipt({ hash });
      console.log(`  ✓ Indexed: ${item.name}`);
    } catch (err: any) {
      console.log(`  (Already indexed or processed: ${err.message?.slice(0, 50)})`);
    }
  }

  console.log("\n==================================================");
  console.log("✓ All 9 Farmers Successfully Indexed On-Chain!");
  console.log("==================================================");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
