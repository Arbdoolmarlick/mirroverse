import fs from "node:fs";
import path from "node:path";
import {
  createPublicClient,
  createWalletClient,
  http,
  defineChain,
  type Hex,
  type Address,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

const arbitrumSepolia = defineChain({
  id: 421614,
  name: "Arbitrum Sepolia",
  nativeCurrency: { name: "Arbitrum Sepolia Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://sepolia-rollup.arbitrum.io/rpc"] },
  },
  blockExplorers: {
    default: { name: "Arbiscan", url: "https://sepolia.arbiscan.io" },
  },
  testnet: true,
});

const ARTIFACTS_DIR = path.resolve(process.cwd(), "contracts/artifacts");
const DEPLOYED_PATH = path.resolve(process.cwd(), "contracts/deployed.json");
const FRONTEND_CONTRACT_PATH = path.resolve(process.cwd(), "src/lib/contracts.ts");
const ENV_DEPLOYER_PATH = path.resolve(process.cwd(), ".env.deployer");

function loadArtifact(contractName: string) {
  return JSON.parse(fs.readFileSync(path.join(ARTIFACTS_DIR, `${contractName}.json`), "utf8"));
}

async function main() {
  console.log("Seeding and recording deployed contracts on Arbitrum Sepolia...");

  const registryAddress: Address = "0x13bdb556d4cf0a8f61a0412f9f20b54f044433cb";
  const vaultAddress: Address = "0xdfd5dc623e16b01eb9ae7982ab6cf5dc78dc4c40";
  const relayerAddress: Address = "0x159dfd13ec6b23a63044f147ea49e5be2ea62357";

  const deployedTokens: Record<string, Address> = {
    USDG: "0x7148335910ff42d0f2b1bb44fdba7d0a11934f28",
    USDC: "0xbfdf56472e6e220949f349525d5c3f2b2272f7c1",
    USDT: "0x020b7b752a438b27cc9745024c5c3f86c7ff154f",
    WBTC: "0x527dbc4667c3b0c5b6808b1e2b863b6327ecc0e3",
    ARB: "0x57692e4eaeefcc9a93dbfa74ba71fac5cd5c5403",
    WETH: "0x380add9bb2fe00eab1860269e9642fbf805984f5",
  };

  const relayerArtifact = loadArtifact("MirroRelayer");

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

  const initialWallets: Address[] = [
    "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB",
    "0xa258C6308e820508291a47cCe2da64573466D07c",
    "0xb05b630043813fa2503254e0bcfb044d0c1ff87d",
    "0xF403C135812408BFbE8713b5A23a04b3CA8064E0",
    "0x176F3DAb24a159341c0509bB36B833E7fdd0a132",
  ];

  console.log("\nIndexing verified wallets on MirroRelayer...");
  for (const wallet of initialWallets) {
    console.log(`  Indexing ${wallet}...`);
    try {
      const hash = await walletClient.writeContract({
        address: relayerAddress,
        abi: relayerArtifact.abi,
        functionName: "indexNewWallet",
        args: [wallet],
      });
      await publicClient.waitForTransactionReceipt({ hash });
      console.log(`  ✓ Indexed: ${wallet}`);
    } catch (err: any) {
      console.warn(`  Note for ${wallet}: ${err.message?.slice(0, 80)}`);
    }
  }

  // Save deployment record
  const deploymentRecord = {
    network: "Arbitrum Sepolia",
    chainId: 421614,
    status: "deployed",
    deployedAt: new Date().toISOString(),
    deployer: account.address,
    contracts: {
      MirroRegistry: registryAddress,
      MirroVault: vaultAddress,
      MirroRelayer: relayerAddress,
    },
    tokens: deployedTokens,
    initialWallets,
  };

  fs.writeFileSync(DEPLOYED_PATH, JSON.stringify(deploymentRecord, null, 2), "utf8");
  console.log(`Deployment record saved to: ${DEPLOYED_PATH}`);

  // Update frontend contracts config
  const registryArtifact = loadArtifact("MirroRegistry");
  const vaultArtifact = loadArtifact("MirroVault");
  const mockTokenArtifact = loadArtifact("MockERC20");

  const frontendContent = `/**
 * mirro Smart Contract Deployments and Interfaces
 * Deployed on Arbitrum Sepolia (Chain ID: 421614)
 * Automatically updated by deployment scripts — do not edit manually.
 */

export const ARBITRUM_SEPOLIA_CHAIN_ID = 421614;

export const MIRRO_REGISTRY_ADDRESSES: Record<number, string> = {
  421614: "${registryAddress}",
  42161: "${registryAddress}",
};

export const MIRRO_VAULT_ADDRESSES: Record<number, string> = {
  421614: "${vaultAddress}",
  42161: "${vaultAddress}",
};

export const MIRRO_RELAYER_ADDRESSES: Record<number, string> = {
  421614: "${relayerAddress}",
  42161: "${relayerAddress}",
};

export const MIRRO_TOKENS: Record<number, Record<string, string>> = {
  421614: {
    ETH: "0x0000000000000000000000000000000000000000",
    USDG: "${deployedTokens.USDG}",
    USDC: "${deployedTokens.USDC}",
    USDT: "${deployedTokens.USDT}",
    WBTC: "${deployedTokens.WBTC}",
    ARB: "${deployedTokens.ARB}",
    WETH: "${deployedTokens.WETH}",
  },
  42161: {
    ETH: "0x0000000000000000000000000000000000000000",
    USDG: "${deployedTokens.USDG}",
    USDC: "${deployedTokens.USDC}",
    USDT: "${deployedTokens.USDT}",
    WBTC: "${deployedTokens.WBTC}",
    ARB: "${deployedTokens.ARB}",
    WETH: "${deployedTokens.WETH}",
  },
};

export const getMirroRegistryAddress = (chainId: number): string => {
  return MIRRO_REGISTRY_ADDRESSES[chainId] || MIRRO_REGISTRY_ADDRESSES[ARBITRUM_SEPOLIA_CHAIN_ID];
};

export const getMirroVaultAddress = (chainId: number): string => {
  return MIRRO_VAULT_ADDRESSES[chainId] || MIRRO_VAULT_ADDRESSES[ARBITRUM_SEPOLIA_CHAIN_ID];
};

export const getMirroRelayerAddress = (chainId: number): string => {
  return MIRRO_RELAYER_ADDRESSES[chainId] || MIRRO_RELAYER_ADDRESSES[ARBITRUM_SEPOLIA_CHAIN_ID];
};

export const getMirroTokens = (chainId: number): Record<string, string> => {
  return MIRRO_TOKENS[chainId] || MIRRO_TOKENS[ARBITRUM_SEPOLIA_CHAIN_ID];
};

export const MIRRO_REGISTRY_ABI = ${JSON.stringify(registryArtifact.abi, null, 2)} as const;

export const MIRRO_VAULT_ABI = ${JSON.stringify(vaultArtifact.abi, null, 2)} as const;

export const MIRRO_RELAYER_ABI = ${JSON.stringify(relayerArtifact.abi, null, 2)} as const;

export const MOCK_ERC20_ABI = ${JSON.stringify(mockTokenArtifact.abi, null, 2)} as const;
`;

  fs.writeFileSync(FRONTEND_CONTRACT_PATH, frontendContent, "utf8");
  console.log(`Frontend contract config updated at: ${FRONTEND_CONTRACT_PATH}`);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
