// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IMirro.sol";

/**
 * @title MirroRelayer
 * @notice Trusted bridge between off-chain yield indexer service and on-chain protocol execution.
 * When the indexer detects a move made by an indexed wallet, the authorized operator wallet
 * calls submitMove(), which updates MirroRegistry and triggers MirroVault mirror moves.
 */
contract MirroRelayer {
    address public owner;
    address public vault;
    address public registry;
    address public operator;

    bool private _locked;

    event OperatorUpdated(address indexed operator);
    event VaultUpdated(address indexed vault);
    event RegistryUpdated(address indexed registry);
    event MoveSubmitted(
        address indexed targetWallet,
        address token,
        address fromProtocol,
        address toProtocol,
        uint256 allocationBps,
        uint256 timestamp
    );
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "MirroRelayer: Only owner");
        _;
    }

    modifier onlyOperator() {
        require(msg.sender == operator || msg.sender == owner, "MirroRelayer: Only operator");
        _;
    }

    modifier nonReentrant() {
        require(!_locked, "MirroRelayer: Reentrant call");
        _locked = true;
        _;
        _locked = false;
    }

    constructor(
        address _vault,
        address _registry,
        address _operator
    ) {
        owner = msg.sender;
        vault = _vault;
        registry = _registry;
        operator = _operator;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "MirroRelayer: Invalid new owner");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function setOperator(address _operator) external onlyOwner {
        require(_operator != address(0), "MirroRelayer: Invalid operator");
        operator = _operator;
        emit OperatorUpdated(_operator);
    }

    function setVault(address _vault) external onlyOwner {
        require(_vault != address(0), "MirroRelayer: Invalid vault");
        vault = _vault;
        emit VaultUpdated(_vault);
    }

    function setRegistry(address _registry) external onlyOwner {
        require(_registry != address(0), "MirroRelayer: Invalid registry");
        registry = _registry;
        emit RegistryUpdated(_registry);
    }

    /**
     * @notice Called by the off-chain indexer service when an indexed wallet moves capital.
     */
    function submitMove(
        address targetWallet,
        address token,
        address fromProtocol,
        address toProtocol,
        uint256 allocationBps,
        string calldata note
    ) external onlyOperator nonReentrant {
        require(allocationBps <= 10000, "MirroRelayer: Allocation exceeds 100%");
        require(targetWallet != address(0), "MirroRelayer: Invalid targetWallet");
        require(fromProtocol != address(0), "MirroRelayer: Invalid fromProtocol");
        require(toProtocol != address(0), "MirroRelayer: Invalid toProtocol");

        // 1. Record move in registry
        if (registry != address(0)) {
            IMirroRegistry(registry).recordMove(
                targetWallet,
                token,
                fromProtocol,
                toProtocol,
                allocationBps,
                note
            );

            // 2. Ensure wallet is indexed
            IMirroRegistry(registry).indexWallet(targetWallet);
        }

        // 3. Trigger proportional mirror move in vault
        if (vault != address(0)) {
            IMirroVault(vault).executeMirrorMove(
                targetWallet,
                token,
                fromProtocol,
                toProtocol,
                allocationBps
            );
        }

        emit MoveSubmitted(
            targetWallet,
            token,
            fromProtocol,
            toProtocol,
            allocationBps,
            block.timestamp
        );
    }

    /**
     * @notice Pre-index a new wallet before followers arrive.
     */
    function indexNewWallet(address wallet) external onlyOperator {
        require(wallet != address(0), "MirroRelayer: Invalid wallet");
        if (registry != address(0)) {
            IMirroRegistry(registry).indexWallet(wallet);
        }
    }
}
