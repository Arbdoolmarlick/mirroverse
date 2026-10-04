import { useState } from "react";
import {
  useAccount,
  useChainId,
  usePublicClient,
  useWriteContract,
  useReadContract,
} from "wagmi";
import { parseEther, parseUnits, formatEther, formatUnits, type Address, isAddress } from "viem";
import { toast } from "sonner";
import {
  getMirroVaultAddress,
  getMirroRegistryAddress,
  getMirroTokens,
  MIRRO_VAULT_ABI,
  MIRRO_REGISTRY_ABI,
  MOCK_ERC20_ABI,
  ARBITRUM_SEPOLIA_CHAIN_ID,
  PROTOCOL_TARGET_ADDRESSES,
  getProtocolTargetAddress,
} from "./contracts";
import { useWallet } from "./web3-wallet";

export interface CopyParams {
  targetWallet: string;
  assetSymbol: string;
  amount: number | string;
}

export interface StopCopyParams {
  targetWallet: string;
  assetSymbol?: string;
}

export interface DepositPoolParams {
  protocol: string;
  assetSymbol: string;
  amount: number | string;
  targetAddress?: string;
}

export interface WithdrawPoolParams {
  protocol: string;
  assetSymbol?: string;
  targetAddress?: string;
}

// Token decimals mapping for Arbitrum Sepolia mock tokens
const TOKEN_DECIMALS: Record<string, number> = {
  ETH: 18,
  USDG: 18,
  USDC: 6,
  USDT: 6,
  WBTC: 8,
  ARB: 18,
  WETH: 18,
};

export function useMirroContracts() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const publicClient = usePublicClient();
  const { writeContractAsync } = useWriteContract();
  const { currentNetwork, switchChain } = useWallet();

  const [isPending, setIsPending] = useState(false);
  const [pendingStep, setPendingStep] = useState<string | null>(null);

  const activeChainId = chainId || ARBITRUM_SEPOLIA_CHAIN_ID;
  const vaultAddress = getMirroVaultAddress(activeChainId) as Address;
  const registryAddress = getMirroRegistryAddress(activeChainId) as Address;
  const tokens = getMirroTokens(activeChainId);

  // Helper to ensure user is connected on Arbitrum Sepolia
  const ensureNetwork = async () => {
    if (!isConnected || !address) {
      throw new Error("Please connect your wallet first");
    }
    if (activeChainId !== ARBITRUM_SEPOLIA_CHAIN_ID) {
      toast.info("Switching to Arbitrum Sepolia testnet...");
      await switchChain(ARBITRUM_SEPOLIA_CHAIN_ID);
    }
  };

  /**
   * Start copying a target wallet on Arbitrum Sepolia
   */
  const startCopying = async ({ targetWallet, assetSymbol, amount }: CopyParams) => {
    try {
      await ensureNetwork();
      setIsPending(true);

      // Validate target wallet address
      if (!isAddress(targetWallet)) {
        throw new Error(`Invalid target wallet address: ${targetWallet}`);
      }
      const formattedTarget = targetWallet as Address;

      const numAmount = parseFloat(amount.toString());
      if (isNaN(numAmount) || numAmount <= 0) {
        throw new Error("Invalid deposit amount");
      }

      const isEth = assetSymbol === "ETH";
      const tokenAddress = (isEth
        ? "0x0000000000000000000000000000000000000000"
        : tokens[assetSymbol] || tokens.USDG) as Address;

      const decimals = TOKEN_DECIMALS[assetSymbol] ?? 18;

      if (isEth) {
        // Native ETH deposit
        setPendingStep("Confirm transaction in your wallet...");
        const weiAmount = parseEther(numAmount.toString());

        const hash = await writeContractAsync({
          address: vaultAddress,
          abi: MIRRO_VAULT_ABI,
          functionName: "startCopying",
          args: [formattedTarget, tokenAddress, 0n],
          value: weiAmount,
        });

        setPendingStep("Waiting for block confirmation on Arbitrum Sepolia...");
        if (publicClient) {
          await publicClient.waitForTransactionReceipt({ hash });
        }

        toast.success(`Successfully mirrored ${formattedTarget.slice(0, 6)}...${formattedTarget.slice(-4)} on-chain!`, {
          action: {
            label: "View Tx",
            onClick: () => window.open(`https://sepolia.arbiscan.io/tx/${hash}`, "_blank"),
          },
        });

        return { hash, targetWallet: formattedTarget };
      } else {
        // ERC-20 token deposit (USDG, USDC, USDT, WBTC, ARB, WETH)
        const parsedAmount = parseUnits(numAmount.toString(), decimals);

        // Check allowance
        setPendingStep("Checking token allowance...");
        if (publicClient) {
          const currentAllowance = (await publicClient.readContract({
            address: tokenAddress,
            abi: MOCK_ERC20_ABI,
            functionName: "allowance",
            args: [address as Address, vaultAddress],
          })) as bigint;

          if (currentAllowance < parsedAmount) {
            setPendingStep(`Approving ${assetSymbol} on MirroVault...`);
            const approveHash = await writeContractAsync({
              address: tokenAddress,
              abi: MOCK_ERC20_ABI,
              functionName: "approve",
              args: [vaultAddress, parsedAmount],
            });

            await publicClient.waitForTransactionReceipt({ hash: approveHash });
            toast.info(`Approved ${assetSymbol} for MirroVault`);
          }
        }

        // Execute startCopying
        setPendingStep("Confirming mirror position in your wallet...");
        const hash = await writeContractAsync({
          address: vaultAddress,
          abi: MIRRO_VAULT_ABI,
          functionName: "startCopying",
          args: [formattedTarget, tokenAddress, parsedAmount],
        });

        setPendingStep("Waiting for block confirmation on Arbitrum Sepolia...");
        if (publicClient) {
          await publicClient.waitForTransactionReceipt({ hash });
        }

        toast.success(`Successfully mirrored ${formattedTarget.slice(0, 6)}... with ${numAmount} ${assetSymbol}!`, {
          action: {
            label: "View Tx",
            onClick: () => window.open(`https://sepolia.arbiscan.io/tx/${hash}`, "_blank"),
          },
        });

        return { hash, targetWallet: formattedTarget };
      }
    } catch (err: any) {
      const errorMsg = err?.shortMessage || err?.message || "Transaction failed";
      toast.error(`Mirror failed: ${errorMsg}`);
      throw err;
    } finally {
      setIsPending(false);
      setPendingStep(null);
    }
  };

  /**
   * Stop copying a target wallet on Arbitrum Sepolia
   */
  const stopCopying = async ({ targetWallet, assetSymbol = "USDG" }: StopCopyParams) => {
    try {
      await ensureNetwork();
      setIsPending(true);

      if (!isAddress(targetWallet)) {
        throw new Error(`Invalid target wallet address: ${targetWallet}`);
      }
      const formattedTarget = targetWallet as Address;

      const isEth = assetSymbol === "ETH";
      const tokenAddress = (isEth
        ? "0x0000000000000000000000000000000000000000"
        : tokens[assetSymbol] || tokens.USDG) as Address;

      setPendingStep("Confirm withdraw transaction in wallet...");

      const hash = await writeContractAsync({
        address: vaultAddress,
        abi: MIRRO_VAULT_ABI,
        functionName: "stopCopying",
        args: [formattedTarget, tokenAddress],
      });

      setPendingStep("Withdrawing capital and returns from Arbitrum Sepolia...");
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      }

      toast.success("Successfully stopped mirroring & returned capital to wallet!", {
        action: {
          label: "View Tx",
          onClick: () => window.open(`https://sepolia.arbiscan.io/tx/${hash}`, "_blank"),
        },
      });

      return { hash };
    } catch (err: any) {
      const errorMsg = err?.shortMessage || err?.message || "Stop copy failed";
      toast.error(`Failed to stop copying: ${errorMsg}`);
      throw err;
    } finally {
      setIsPending(false);
      setPendingStep(null);
    }
  };

  /**
   * Claim free testnet mock tokens from public faucet
   */
  const claimFaucet = async (assetSymbol: string) => {
    try {
      await ensureNetwork();
      setIsPending(true);

      const tokenAddress = tokens[assetSymbol] as Address;
      if (!tokenAddress || tokenAddress === "0x0000000000000000000000000000000000000000") {
        throw new Error(`Cannot mint native ${assetSymbol} from token faucet`);
      }

      setPendingStep(`Minting 1,000 testnet ${assetSymbol}...`);
      const hash = await writeContractAsync({
        address: tokenAddress,
        abi: MOCK_ERC20_ABI,
        functionName: "faucet",
        args: [],
      });

      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      }

      toast.success(`Claimed 1,000 ${assetSymbol} testnet tokens!`, {
        action: {
          label: "View Tx",
          onClick: () => window.open(`https://sepolia.arbiscan.io/tx/${hash}`, "_blank"),
        },
      });
      return { hash };
    } catch (err: any) {
      const errorMsg = err?.shortMessage || err?.message || "Faucet claim failed";
      toast.error(`Faucet failed: ${errorMsg}`);
      throw err;
    } finally {
      setIsPending(false);
      setPendingStep(null);
    }
  };

  /**
   * Deposit capital into a protocol yield pool on Arbitrum Sepolia
   */
  const depositToPool = async ({
    protocol,
    assetSymbol,
    amount,
    targetAddress,
  }: DepositPoolParams) => {
    try {
      await ensureNetwork();
      setIsPending(true);

      const targetWallet = getProtocolTargetAddress(protocol, targetAddress) as Address;
      const numAmount = parseFloat(amount.toString());
      if (isNaN(numAmount) || numAmount <= 0) {
        throw new Error("Invalid deposit amount");
      }

      const isEth = assetSymbol === "ETH";
      const tokenAddress = (isEth
        ? "0x0000000000000000000000000000000000000000"
        : tokens[assetSymbol] || tokens.USDG) as Address;

      const decimals = TOKEN_DECIMALS[assetSymbol] ?? 18;

      if (isEth) {
        setPendingStep(`Confirming ${numAmount} ETH deposit into ${protocol} in your wallet...`);
        const weiAmount = parseEther(numAmount.toString());

        const hash = await writeContractAsync({
          address: vaultAddress,
          abi: MIRRO_VAULT_ABI,
          functionName: "startCopying",
          args: [targetWallet, tokenAddress, 0n],
          value: weiAmount,
        });

        setPendingStep(`Confirming ${protocol} deposit on Arbitrum Sepolia...`);
        if (publicClient) {
          await publicClient.waitForTransactionReceipt({ hash });
        }

        toast.success(`Successfully deposited ${numAmount} ETH into ${protocol} on-chain!`, {
          action: {
            label: "View Tx",
            onClick: () => window.open(`https://sepolia.arbiscan.io/tx/${hash}`, "_blank"),
          },
        });

        return { hash, targetWallet };
      } else {
        const parsedAmount = parseUnits(numAmount.toString(), decimals);

        setPendingStep(`Checking ${assetSymbol} allowance for ${protocol}...`);
        if (publicClient) {
          const currentAllowance = (await publicClient.readContract({
            address: tokenAddress,
            abi: MOCK_ERC20_ABI,
            functionName: "allowance",
            args: [address as Address, vaultAddress],
          })) as bigint;

          if (currentAllowance < parsedAmount) {
            setPendingStep(`Approving ${assetSymbol} on MirroVault...`);
            const approveHash = await writeContractAsync({
              address: tokenAddress,
              abi: MOCK_ERC20_ABI,
              functionName: "approve",
              args: [vaultAddress, parsedAmount],
            });

            await publicClient.waitForTransactionReceipt({ hash: approveHash });
            toast.info(`Approved ${assetSymbol} for MirroVault`);
          }
        }

        setPendingStep(`Confirming ${numAmount} ${assetSymbol} deposit into ${protocol}...`);
        const hash = await writeContractAsync({
          address: vaultAddress,
          abi: MIRRO_VAULT_ABI,
          functionName: "startCopying",
          args: [targetWallet, tokenAddress, parsedAmount],
        });

        setPendingStep(`Waiting for block confirmation on Arbitrum Sepolia...`);
        if (publicClient) {
          await publicClient.waitForTransactionReceipt({ hash });
        }

        toast.success(`Successfully deposited ${numAmount} ${assetSymbol} into ${protocol} on-chain!`, {
          action: {
            label: "View Tx",
            onClick: () => window.open(`https://sepolia.arbiscan.io/tx/${hash}`, "_blank"),
          },
        });

        return { hash, targetWallet };
      }
    } catch (err: any) {
      const errorMsg = err?.shortMessage || err?.message || "Pool deposit failed";
      toast.error(`Deposit failed: ${errorMsg}`);
      throw err;
    } finally {
      setIsPending(false);
      setPendingStep(null);
    }
  };

  /**
   * Withdraw capital from a protocol yield pool on Arbitrum Sepolia
   */
  const withdrawFromPool = async ({
    protocol,
    assetSymbol = "USDG",
    targetAddress,
  }: WithdrawPoolParams) => {
    try {
      await ensureNetwork();
      setIsPending(true);

      const targetWallet = getProtocolTargetAddress(protocol, targetAddress) as Address;
      const isEth = assetSymbol === "ETH";
      const tokenAddress = (isEth
        ? "0x0000000000000000000000000000000000000000"
        : tokens[assetSymbol] || tokens.USDG) as Address;

      setPendingStep(`Confirm withdraw from ${protocol} in your wallet...`);

      const hash = await writeContractAsync({
        address: vaultAddress,
        abi: MIRRO_VAULT_ABI,
        functionName: "stopCopying",
        args: [targetWallet, tokenAddress],
      });

      setPendingStep(`Withdrawing capital and returns from ${protocol}...`);
      if (publicClient) {
        await publicClient.waitForTransactionReceipt({ hash });
      }

      toast.success(`Successfully withdrew from ${protocol}! Capital returned to wallet.`, {
        action: {
          label: "View Tx",
          onClick: () => window.open(`https://sepolia.arbiscan.io/tx/${hash}`, "_blank"),
        },
      });

      return { hash };
    } catch (err: any) {
      const errorMsg = err?.shortMessage || err?.message || "Withdraw failed";
      toast.error(`Withdraw from ${protocol} failed: ${errorMsg}`);
      throw err;
    } finally {
      setIsPending(false);
      setPendingStep(null);
    }
  };

  return {
    vaultAddress,
    registryAddress,
    tokens,
    isPending,
    pendingStep,
    startCopying,
    stopCopying,
    depositToPool,
    withdrawFromPool,
    claimFaucet,
  };
}
