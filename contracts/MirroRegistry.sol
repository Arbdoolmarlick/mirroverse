// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IMirro.sol";

/**
 * @title MirroRegistry
 * @notice The on-chain record of indexed wallets and their yield farming stats.
 * The frontend reads this contract to populate the leaderboard and move histories.
 * The relayer writes to it when it detects yield farming activity.
 * The vault writes to it when users start/stop copying.
 */
contract MirroRegistry is IMirroRegistry {
    address public owner;
    address public relayer;
    address public vault;

    address[] public indexedWallets;
    mapping(address => WalletStats) public walletStats;
    mapping(address => MoveRecord[]) public moveHistory;

    // Track unique copiers per target wallet
    mapping(address => mapping(address => bool)) private _hasCopied;

    event WalletIndexed(address indexed wallet, uint256 timestamp);
    event MoveRecorded(
        address indexed wallet,
        address token,
        address fromProtocol,
        address toProtocol,
        uint256 allocationBps,
        uint256 timestamp
    );
    event CopierRecorded(address indexed targetWallet, address indexed copier, uint256 activeCopiers, uint256 totalCopiers);
    event CopierRemoved(address indexed targetWallet, address indexed copier, uint256 activeCopiers);
    event RelayerUpdated(address indexed relayer);
    event VaultUpdated(address indexed vault);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "MirroRegistry: Only owner");
        _;
    }

    modifier onlyRelayer() {
        require(msg.sender == relayer || msg.sender == owner, "MirroRegistry: Only relayer");
        _;
    }

    modifier onlyVault() {
        require(msg.sender == vault || msg.sender == owner, "MirroRegistry: Only vault");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "MirroRegistry: Invalid new owner");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function setRelayer(address _relayer) external onlyOwner {
        require(_relayer != address(0), "MirroRegistry: Invalid relayer address");
        relayer = _relayer;
        emit RelayerUpdated(_relayer);
    }

    function setVault(address _vault) external onlyOwner {
        require(_vault != address(0), "MirroRegistry: Invalid vault address");
        vault = _vault;
        emit VaultUpdated(_vault);
    }

    /**
     * @notice Indexes a wallet if not already indexed.
     */
    function indexWallet(address wallet) public onlyRelayer {
        require(wallet != address(0), "MirroRegistry: Invalid wallet address");
        _ensureIndexed(wallet);
    }

    /**
     * @notice Records a move executed by an indexed wallet.
     */
    function recordMove(
        address wallet,
        address token,
        address fromProtocol,
        address toProtocol,
        uint256 allocationBps,
        string calldata note
    ) external onlyRelayer {
        require(wallet != address(0), "MirroRegistry: Invalid wallet");
        _ensureIndexed(wallet);

        walletStats[wallet].totalMoves += 1;
        walletStats[wallet].lastActiveTimestamp = block.timestamp;

        moveHistory[wallet].push(
            MoveRecord({
                token: token,
                fromProtocol: fromProtocol,
                toProtocol: toProtocol,
                allocationBps: allocationBps,
                timestamp: block.timestamp,
                note: note
            })
        );

        emit MoveRecorded(
            wallet,
            token,
            fromProtocol,
            toProtocol,
            allocationBps,
            block.timestamp
        );
    }

    /**
     * @notice Records a new copy action by a user on a target wallet.
     */
    function recordCopier(address targetWallet, address copier) external onlyVault {
        require(targetWallet != address(0), "MirroRegistry: Invalid target wallet");
        _ensureIndexed(targetWallet);

        walletStats[targetWallet].activeCopiers += 1;

        if (!_hasCopied[targetWallet][copier]) {
            _hasCopied[targetWallet][copier] = true;
            walletStats[targetWallet].totalCopiers += 1;
        }

        emit CopierRecorded(
            targetWallet,
            copier,
            walletStats[targetWallet].activeCopiers,
            walletStats[targetWallet].totalCopiers
        );
    }

    /**
     * @notice Records when a user stops copying a target wallet.
     */
    function removeCopier(address targetWallet, address copier) external onlyVault {
        require(targetWallet != address(0), "MirroRegistry: Invalid target wallet");
        if (walletStats[targetWallet].activeCopiers > 0) {
            walletStats[targetWallet].activeCopiers -= 1;
        }

        emit CopierRemoved(targetWallet, copier, walletStats[targetWallet].activeCopiers);
    }

    function _ensureIndexed(address wallet) internal {
        if (!walletStats[wallet].isIndexed) {
            indexedWallets.push(wallet);
            walletStats[wallet] = WalletStats({
                wallet: wallet,
                totalMoves: 0,
                firstSeenTimestamp: block.timestamp,
                lastActiveTimestamp: block.timestamp,
                totalCopiers: 0,
                activeCopiers: 0,
                isIndexed: true
            });
            emit WalletIndexed(wallet, block.timestamp);
        }
    }

    // --- View Functions ---

    function getIndexedWallets() external view returns (address[] memory) {
        return indexedWallets;
    }

    function getWalletStats(address wallet) external view returns (WalletStats memory) {
        return walletStats[wallet];
    }

    function getMoveHistory(address wallet) external view returns (MoveRecord[] memory) {
        return moveHistory[wallet];
    }

    function getMoveCount(address wallet) external view returns (uint256) {
        return moveHistory[wallet].length;
    }
}
