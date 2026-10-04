import { type HardhatUserConfig } from "hardhat/config";

const deployerPrivateKey = process.env.PRIVATE_KEY || process.env.ARBITRUM_SEPOLIA_PRIVATE_KEY;

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    arbitrumSepolia: {
      url: "https://sepolia-rollup.arbitrum.io/rpc",
      chainId: 421614,
      accounts: deployerPrivateKey ? [deployerPrivateKey.startsWith("0x") ? deployerPrivateKey : `0x${deployerPrivateKey}`] : [],
    },
  },
};

export default config;
