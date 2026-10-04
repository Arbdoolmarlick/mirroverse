import fs from "node:fs";
import path from "node:path";
import {
  createPublicClient,
  createWalletClient,
  http,
  formatEther,
  parseEther,
  defineChain,
  type Hex,
  type Address,
} from "viem";
import { privateKeyToAccount, generatePrivateKey } from "viem/accounts";

// Arbitrum Sepolia Chain definition
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
  const filePath = path.join(ARTIFACTS_DIR, `${contractName}.json`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Artifact ${contractName}.json not found. Run 'bun run compile' first.`);
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

async function main() {
  console.log("==================================================");
  console.log("🚀 mirro Protocol — Multi-Contract Deployment");
  console.log("   Target Network: Arbitrum Sepolia (Chain ID 421614)");
  console.log("==================================================\n");

  const registryArtifact = loadArtifact("MirroRegistry");
  const vaultArtifact = loadArtifact("MirroVault");
  const relayerArtifact = loadArtifact("MirroRelayer");
  const mockTokenArtifact = loadArtifact("MockERC20");

  const publicClient = createPublicClient({
    chain: arbitrumSepolia,
    transport: http(),
  });

  // Extract private key from CLI args, environment, or .env.deployer
  let privateKey = process.env.ARBITRUM_SEPOLIA_PRIVATE_KEY || process.env.PRIVATE_KEY;
  const args = process.argv.slice(2);
  const pkArgIndex = args.indexOf("--private-key");
  if (pkArgIndex !== -1 && args[pkArgIndex + 1]) {
    privateKey = args[pkArgIndex + 1];
  } else if (!privateKey && fs.existsSync(ENV_DEPLOYER_PATH)) {
    const envFileContent = fs.readFileSync(ENV_DEPLOYER_PATH, "utf8");
    const match = envFileContent.match(/ARBITRUM_SEPOLIA_PRIVATE_KEY=(0x[a-fA-F0-9]{64}|[a-fA-F0-9]{64})/);
    if (match) {
      privateKey = match[1];
    }
  }

  if (!privateKey) {
    const sampleKey = generatePrivateKey();
    const sampleAccount = privateKeyToAccount(sampleKey);

    console.log("⚠️ No deployer private key detected.\n");
    console.log("A dedicated Arbitrum Sepolia deployer key has been generated:");
    console.log(`  Deployer Address : ${sampleAccount.address}\n`);

    const envContent = [
      "# Auto-generated deployer key for Arbitrum Sepolia",
      `# Address: ${sampleAccount.address}`,
      `# Generated: ${new Date().toISOString()}`,
      "#",
      "# ⚠️ DO NOT commit this file to source control!",
      "",
      `ARBITRUM_SEPOLIA_PRIVATE_KEY=${sampleKey}`,
      "",
    ].join("\n");
    fs.writeFileSync(ENV_DEPLOYER_PATH, envContent, "utf8");
    console.log(`  Key saved to: ${ENV_DEPLOYER_PATH}`);

    console.log("\nNext Steps:");
    console.log("1. Request testnet ETH to the deployer address:");
    console.log(`   Address: ${sampleAccount.address}`);
    console.log("   → https://faucets.chain.link/arbitrum-sepolia");
    console.log("   → https://learnweb3.io/faucets/arbitrum-sepolia");
    console.log("   → https://cloud.google.com/application/web3/faucet/ethereum/sepolia (Bridge to Arb Sepolia)");
    console.log("\n2. Run deployment once funded:");
    console.log(`   bun run deploy:arbitrum-sepolia`);
    console.log(`   or: bun run deploy:arbitrum-sepolia --private-key ${sampleKey}\n`);

    saveDeploymentRecord({
      network: "Arbitrum Sepolia",
      chainId: 421614,
      status: "ready_to_deploy",
      generatedDeployer: sampleAccount.address,
      contracts: ["MirroRegistry", "MirroVault", "MirroRelayer", "MockTokens"],
    });

    // Write fallback/initial contracts.ts with full ABIs
    writeFrontendContractsConfig({
      registryAddress: "0x0000000000000000000000000000000000000000",
      vaultAddress: "0x78D1C98aD1B53a6B7eB9197c385E8aBc3e1a90fB",
      relayerAddress: "0x0000000000000000000000000000000000000000",
      tokens: {
        USDG: "0x0000000000000000000000000000000000000000",
        USDC: "0x0000000000000000000000000000000000000000",
        USDT: "0x0000000000000000000000000000000000000000",
        WBTC: "0x0000000000000000000000000000000000000000",
        ARB: "0x0000000000000000000000000000000000000000",
        WETH: "0x0000000000000000000000000000000000000000",
      },
    });
    return;
  }

  const formattedKey: Hex = (
    privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`
  ) as Hex;

  const account = privateKeyToAccount(formattedKey);
  console.log(`Deployer Address : ${account.address}`);

  const balance = await publicClient.getBalance({ address: account.address });
  const formattedBalance = formatEther(balance);
  console.log(`Deployer Balance : ${formattedBalance} ETH on Arbitrum Sepolia`);

  if (balance === 0n) {
    console.log("Syncing latest contract ABIs to frontend...");
    writeFrontendContractsConfig({
      registryAddress: "0x0000000000000000000000000000000000000000",
      vaultAddress: "0x78D1C98aD1B53a6B7eB9197c385E8aBc3e1a90fB",
      relayerAddress: "0x0000000000000000000000000000000000000000",
      tokens: {
        USDG: "0x0000000000000000000000000000000000000000",
        USDC: "0x0000000000000000000000000000000000000000",
        USDT: "0x0000000000000000000000000000000000000000",
        WBTC: "0x0000000000000000000000000000000000000000",
        ARB: "0x0000000000000000000000000000000000000000",
        WETH: "0x0000000000000000000000000000000000000000",
      },
    });

    console.error("\n❌ Insufficient balance to deploy!");
    console.error(`Please fund ${account.address} with Arbitrum Sepolia testnet ETH from:`);
    console.error("  → https://faucets.chain.link/arbitrum-sepolia");
    console.error("  → https://learnweb3.io/faucets/arbitrum-sepolia\n");
    process.exit(1);
  }

  const walletClient = createWalletClient({
    account,
    chain: arbitrumSepolia,
    transport: http(),
  });

  // Helper to deploy a contract
  async function deployContract(
    name: string,
    artifact: { abi: any; bytecode: string },
    args: any[] = []
  ): Promise<Address> {
    console.log(`\nDeploying ${name}...`);
    const hash = await walletClient.deployContract({
      abi: artifact.abi,
      bytecode: artifact.bytecode as Hex,
      args,
    });
    console.log(`  Tx Hash: ${hash}`);
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    if (!receipt.contractAddress) {
      throw new Error(`Failed to deploy ${name}: missing contract address in receipt`);
    }
    console.log(`  ✓ Deployed at: ${receipt.contractAddress}`);
    return receipt.contractAddress;
  }

  // Helper to call a contract method
  async function callContract(
    to: Address,
    abi: any,
    functionName: string,
    args: any[]
  ) {
    console.log(`  Calling ${functionName}...`);
    const hash = await walletClient.writeContract({
      address: to,
      abi,
      functionName,
      args,
    });
    await publicClient.waitForTransactionReceipt({ hash });
    console.log(`  ✓ Confirmed: ${functionName}`);
  }

  console.log("\n==================================================");
  console.log("Step 1: Deploy MirroRegistry.sol");
  console.log("==================================================");
  const registryAddress = await deployContract("MirroRegistry", registryArtifact, []);

  console.log("\n==================================================");
  console.log("Step 2: Deploy MirroVault.sol (with registry address)");
  console.log("==================================================");
  const vaultAddress = await deployContract("MirroVault", vaultArtifact, [registryAddress]);

  console.log("\n==================================================");
  console.log("Step 3: Deploy MirroRelayer.sol (vault, registry, operator)");
  console.log("==================================================");
  const operatorAddress = account.address;
  const relayerAddress = await deployContract("MirroRelayer", relayerArtifact, [
    vaultAddress,
    registryAddress,
    operatorAddress,
  ]);

  console.log("\n==================================================");
  console.log("Step 4: Post-deployment Authorization Wire-up");
  console.log("==================================================");
  console.log("Configuring contracts to trust each other:");
  await callContract(vaultAddress, vaultArtifact.abi, "setRelayer", [relayerAddress]);
  await callContract(registryAddress, registryArtifact.abi, "setVault", [vaultAddress]);
  await callContract(registryAddress, registryArtifact.abi, "setRelayer", [relayerAddress]);

  console.log("\n==================================================");
  console.log("Step 5: Deploy Mock Tokens & Whitelist on MirroVault");
  console.log("==================================================");

  const tokensToDeploy = [
    { name: "Paxos USDG", symbol: "USDG", decimals: 18, supply: parseEther("10000000") },
    { name: "Circle USD Coin", symbol: "USDC", decimals: 6, supply: 10_000_000_000_000n },
    { name: "Tether USD", symbol: "USDT", decimals: 6, supply: 10_000_000_000_000n },
    { name: "Wrapped Bitcoin", symbol: "WBTC", decimals: 8, supply: 100_000_000_000n },
    { name: "Arbitrum Token", symbol: "ARB", decimals: 18, supply: parseEther("10000000") },
    { name: "Wrapped Ether", symbol: "WETH", decimals: 18, supply: parseEther("10000") },
  ];

  const deployedTokens: Record<string, Address> = {};

  for (const t of tokensToDeploy) {
    const tokenAddr = await deployContract(t.symbol, mockTokenArtifact, [
      t.name,
      t.symbol,
      t.decimals,
      t.supply,
    ]);
    deployedTokens[t.symbol] = tokenAddr;
    console.log(`  Whitelisting ${t.symbol} on MirroVault...`);
    await callContract(vaultAddress, vaultArtifact.abi, "addSupportedToken", [tokenAddr]);

    // Seed token yield reserve with 10% of initial supply to support demo payouts
    const reserveSeed = t.supply / 10n;
    if (reserveSeed > 0n) {
      console.log(`  Funding yield reserve for ${t.symbol}...`);
      await callContract(tokenAddr, mockTokenArtifact.abi, "approve", [vaultAddress, reserveSeed]);
      await callContract(vaultAddress, vaultArtifact.abi, "fundYieldReserveToken", [tokenAddr, reserveSeed]);
    }
  }

  // Seed ETH yield reserve if deployer has sufficient testnet ETH
  if (balance > parseEther("0.02")) {
    const ethReserve = parseEther("0.005");
    console.log(`\n  Funding ETH yield reserve with 0.005 ETH...`);
    const seedHash = await walletClient.writeContract({
      address: vaultAddress,
      abi: vaultArtifact.abi,
      functionName: "fundYieldReserve",
      args: [],
      value: ethReserve,
    });
    await publicClient.waitForTransactionReceipt({ hash: seedHash });
    console.log(`  ✓ ETH yield reserve seeded`);
  }

  console.log("\n==================================================");
  console.log("Step 6: Seed MirroRegistry with Initial Top Wallets");
  console.log("==================================================");

  const initialWallets = [
    "0x71f28b4AB035698C37299a997864B179e8b4A123", // Momentum Stack
    "0x2c9114eD245B1c6Ac5c528f8446b3846614eD789", // DCA Machine
    "0x83a071cF118c79218d6e902Af29Ac9898071cF45", // Steady Carry
    "0xa41f73eA87a264aD5A1259D2e37936aA773eA612", // Swing Alpha
    "0x19be61aCDbC70F3521b44B29E30A241F8161aC78", // Mag7 Rotator
  ];

  for (const wallet of initialWallets) {
    console.log(`  Indexing wallet: ${wallet}`);
    await callContract(relayerAddress, relayerArtifact.abi, "indexNewWallet", [wallet]);
  }

  console.log("\n==================================================");
  console.log("🎉 SUCCESS: Entire mirro Protocol Deployed & Configured!");
  console.log("==================================================");
  console.log(`MirroRegistry : ${registryAddress}`);
  console.log(`MirroVault    : ${vaultAddress}`);
  console.log(`MirroRelayer  : ${relayerAddress}`);
  console.log("Tokens:");
  for (const [sym, addr] of Object.entries(deployedTokens)) {
    console.log(`  ${sym.padEnd(6)}: ${addr}`);
  }
  console.log("==================================================\n");

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

  saveDeploymentRecord(deploymentRecord);

  writeFrontendContractsConfig({
    registryAddress,
    vaultAddress,
    relayerAddress,
    tokens: deployedTokens,
  });
}

function saveDeploymentRecord(data: Record<string, unknown>) {
  fs.writeFileSync(DEPLOYED_PATH, JSON.stringify(data, null, 2), "utf8");
  console.log(`Deployment record saved to: ${DEPLOYED_PATH}`);
}

function writeFrontendContractsConfig({
  registryAddress,
  vaultAddress,
  relayerAddress,
  tokens,
}: {
  registryAddress: string;
  vaultAddress: string;
  relayerAddress: string;
  tokens: Record<string, string>;
}) {
  const registryArtifact = loadArtifact("MirroRegistry");
  const vaultArtifact = loadArtifact("MirroVault");
  const relayerArtifact = loadArtifact("MirroRelayer");
  const mockTokenArtifact = loadArtifact("MockERC20");

  const content = `/**
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
    USDG: "${tokens.USDG || "0x0000000000000000000000000000000000000000"}",
    USDC: "${tokens.USDC || "0x0000000000000000000000000000000000000000"}",
    USDT: "${tokens.USDT || "0x0000000000000000000000000000000000000000"}",
    WBTC: "${tokens.WBTC || "0x0000000000000000000000000000000000000000"}",
    ARB: "${tokens.ARB || "0x0000000000000000000000000000000000000000"}",
    WETH: "${tokens.WETH || "0x0000000000000000000000000000000000000000"}",
  },
  42161: {
    ETH: "0x0000000000000000000000000000000000000000",
    USDG: "${tokens.USDG || "0x0000000000000000000000000000000000000000"}",
    USDC: "${tokens.USDC || "0x0000000000000000000000000000000000000000"}",
    USDT: "${tokens.USDT || "0x0000000000000000000000000000000000000000"}",
    WBTC: "${tokens.WBTC || "0x0000000000000000000000000000000000000000"}",
    ARB: "${tokens.ARB || "0x0000000000000000000000000000000000000000"}",
    WETH: "${tokens.WETH || "0x0000000000000000000000000000000000000000"}",
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

  fs.writeFileSync(FRONTEND_CONTRACT_PATH, content, "utf8");
  console.log(`Frontend contract config updated at: ${FRONTEND_CONTRACT_PATH}`);
}

main().catch((err) => {
  console.error("Deployment failed:", err);
  process.exit(1);
});
