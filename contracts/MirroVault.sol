// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IMirro.sol";
import "./SafeERC20.sol";

/**
 * @title MirroVault
 * @notice Core copy-yield vault deployed on Arbitrum Sepolia.
 * Holds user funds, allows starting/stopping copy positions on target wallets,
 * and executes proportional mirror moves when commanded by MirroRelayer.
 *
 * Implements SafeERC20 for all token interactions (including USDT).
 * Tracks a dedicated yield reserve funded by protocol administrators.
 */
contract MirroVault is IMirroVault {
    using SafeERC20 for IERC20;

    // --- Reentrancy Guard ---
    bool private _locked;

    modifier nonReentrant() {
        require(!_locked, "MirroVault: Reentrant call");
        _locked = true;
        _;
        _locked = false;
    }

    // --- State Variables ---
    address public owner;
    address public relayer;
    address public registry;

    uint256 public constant BPS_DIVISOR = 10000;
    uint256 public constant BASELINE_APY_BPS = 710; // 7.10% baseline

    mapping(address => bool) public supportedTokens;
    // token address => bool. address(0) = native ETH.

    mapping(address => mapping(address => mapping(address => CopyPosition))) public copyPositions;
    // user => targetWallet => token => CopyPosition

    mapping(address => mapping(address => uint256)) public totalCopiedCapital;
    // targetWallet => token => total capital currently copying them in that token

    mapping(address => mapping(address => address[])) public copierList;
    // targetWallet => token => list of copier addresses

    mapping(address => mapping(address => uint256)) public vaultBalances;
    // user => token => their total balance in the vault across all positions

    uint256 public totalValueLockedETH;
    mapping(address => uint256) public totalValueLockedToken;
    // token => total TVL in that token

    // --- Yield Reserve (Funded by Owner for Demo APY Payouts) ---
    uint256 public yieldReserveETH;
    mapping(address => uint256) public yieldReserveToken;

    // Enumeration for all target wallets with active or historical copying
    address[] public allTargetWallets;
    mapping(address => bool) private _isTargetWalletIndexed;

    // O(1) removal tracking for copierList
    mapping(address => mapping(address => mapping(address => uint256))) private _copierListIndex;
    mapping(address => mapping(address => mapping(address => bool))) private _isInCopierList;

    // Enumerable tracking for getUserPositions(user)
    struct PositionKey {
        address targetWallet;
        address token;
    }
    mapping(address => PositionKey[]) private _userPositionKeys;
    mapping(address => mapping(address => mapping(address => uint256))) private _userPositionKeyIndex;
    mapping(address => mapping(address => mapping(address => bool))) private _userPositionKeyExists;

    // --- Events ---
    event TokenAdded(address indexed token);
    event RelayerUpdated(address indexed relayer);
    event RegistryUpdated(address indexed registry);
    event CopyStarted(
        address indexed user,
        address indexed targetWallet,
        address indexed token,
        uint256 amount
    );
    event CopyTopUp(
        address indexed user,
        address indexed targetWallet,
        address indexed token,
        uint256 addedAmount,
        uint256 newTotal
    );
    event CopyStopped(
        address indexed user,
        address indexed targetWallet,
        address indexed token,
        uint256 amountReturned
    );
    event MirrorMoveExecuted(
        address indexed targetWallet,
        address indexed token,
        address fromProtocol,
        address toProtocol,
        uint256 allocationBps,
        uint256 affectedCopiers
    );
    event YieldReserveFundedETH(address indexed funder, uint256 amount, uint256 newReserve);
    event YieldReserveFundedToken(
        address indexed token,
        address indexed funder,
        uint256 amount,
        uint256 newReserve
    );
    event EmergencyWithdraw(
        address indexed token,
        address indexed to,
        uint256 amount
    );
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "MirroVault: Only owner");
        _;
    }

    modifier onlyRelayer() {
        require(msg.sender == relayer, "MirroVault: Only relayer");
        _;
    }

    constructor(address _registry) {
        owner = msg.sender;
        registry = _registry;
        // Native ETH is whitelisted at deployment
        supportedTokens[address(0)] = true;
        emit TokenAdded(address(0));
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "MirroVault: Invalid new owner");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function addSupportedToken(address token) external onlyOwner {
        require(token != address(0), "MirroVault: ETH already supported");
        require(!supportedTokens[token], "MirroVault: Token already supported");
        supportedTokens[token] = true;
        emit TokenAdded(token);
    }

    function setRelayer(address _relayer) external onlyOwner {
        require(_relayer != address(0), "MirroVault: Invalid relayer");
        relayer = _relayer;
        emit RelayerUpdated(_relayer);
    }

    function setRegistry(address _registry) external onlyOwner {
        require(_registry != address(0), "MirroVault: Invalid registry");
        registry = _registry;
        emit RegistryUpdated(_registry);
    }

    /**
     * @notice Owner funds the vault with extra ETH to cover simulated demo yield payouts.
     */
    function fundYieldReserve() external payable onlyOwner {
        require(msg.value > 0, "MirroVault: Must fund with > 0 ETH");
        yieldReserveETH += msg.value;
        emit YieldReserveFundedETH(msg.sender, msg.value, yieldReserveETH);
    }

    /**
     * @notice Owner funds the vault with extra ERC-20 tokens to cover simulated demo yield payouts.
     */
    function fundYieldReserveToken(address token, uint256 amount) external onlyOwner {
        require(supportedTokens[token] && token != address(0), "MirroVault: Invalid token");
        require(amount > 0, "MirroVault: Amount must be > 0");
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        yieldReserveToken[token] += amount;
        emit YieldReserveFundedToken(token, msg.sender, amount, yieldReserveToken[token]);
    }

    /**
     * @notice Start copying a target wallet with a chosen token or native ETH.
     * @param targetWallet The wallet to mirror.
     * @param token Address of token (address(0) for native ETH).
     * @param amount Deposit amount (ignored if token == address(0)).
     */
    function startCopying(
        address targetWallet,
        address token,
        uint256 amount
    ) external payable nonReentrant {
        require(supportedTokens[token], "MirroVault: Unsupported token");
        require(targetWallet != address(0), "MirroVault: Invalid target wallet");

        uint256 actualAmount;
        if (token == address(0)) {
            require(msg.value > 0, "MirroVault: Must send ETH");
            actualAmount = msg.value;
        } else {
            require(msg.value == 0, "MirroVault: Cannot send ETH with ERC20");
            require(amount > 0, "MirroVault: Amount must be > 0");
            actualAmount = amount;
            IERC20(token).safeTransferFrom(msg.sender, address(this), actualAmount);
        }

        CopyPosition storage pos = copyPositions[msg.sender][targetWallet][token];

        if (pos.active) {
            // Top up existing position
            pos.depositedAmount += actualAmount;
            pos.currentValue += actualAmount;
            pos.lastMoveTime = block.timestamp;

            emit CopyTopUp(msg.sender, targetWallet, token, actualAmount, pos.currentValue);
        } else {
            // New position
            pos.targetWallet = targetWallet;
            pos.token = token;
            pos.depositedAmount = actualAmount;
            pos.currentValue = actualAmount;
            pos.startTime = block.timestamp;
            pos.lastMoveTime = block.timestamp;
            pos.active = true;

            // Track target wallet for enumeration
            if (!_isTargetWalletIndexed[targetWallet]) {
                allTargetWallets.push(targetWallet);
                _isTargetWalletIndexed[targetWallet] = true;
            }

            // Add to copier list
            _addCopier(targetWallet, token, msg.sender);

            // Add to enumerable user position keys
            _addUserPositionKey(msg.sender, targetWallet, token);

            // Notify registry of new copier
            if (registry != address(0)) {
                IMirroRegistry(registry).recordCopier(targetWallet, msg.sender);
            }

            emit CopyStarted(msg.sender, targetWallet, token, actualAmount);
        }

        totalCopiedCapital[targetWallet][token] += actualAmount;
        vaultBalances[msg.sender][token] += actualAmount;

        if (token == address(0)) {
            totalValueLockedETH += actualAmount;
        } else {
            totalValueLockedToken[token] += actualAmount;
        }
    }

    /**
     * @notice Stop copying a target wallet and withdraw capital + returns.
     * @param targetWallet The wallet being copied.
     * @param token Address of the asset deposited.
     */
    function stopCopying(address targetWallet, address token) external nonReentrant {
        CopyPosition storage pos = copyPositions[msg.sender][targetWallet][token];
        require(pos.active, "MirroVault: No active copy position");

        uint256 deposited = pos.depositedAmount;
        uint256 currentVal = pos.currentValue;
        uint256 elapsed = block.timestamp - pos.startTime;

        // Simulated testnet yield: 10% annualised (1000 BPS)
        uint256 simulatedYield = (deposited * 1000 * elapsed) / (BPS_DIVISOR * 365 days);
        uint256 totalReturn = currentVal + simulatedYield;

        // Ensure contract has sufficient balance to pay totalReturn without reverting
        uint256 availableBalance = token == address(0)
            ? address(this).balance
            : IERC20(token).balanceOf(address(this));

        if (totalReturn > availableBalance) {
            totalReturn = availableBalance >= currentVal ? currentVal : availableBalance;
        }

        // Deduct from yield reserve if yield was paid out
        if (totalReturn > currentVal) {
            uint256 extraYieldPaid = totalReturn - currentVal;
            if (token == address(0)) {
                if (yieldReserveETH >= extraYieldPaid) yieldReserveETH -= extraYieldPaid;
                else yieldReserveETH = 0;
            } else {
                if (yieldReserveToken[token] >= extraYieldPaid) yieldReserveToken[token] -= extraYieldPaid;
                else yieldReserveToken[token] = 0;
            }
        }

        // --- Checks-Effects-Interactions: All state changes before external calls ---
        _removeCopier(targetWallet, token, msg.sender);
        _removeUserPositionKey(msg.sender, targetWallet, token);

        // Deduct based on current value to prevent TVL accounting drift
        if (totalCopiedCapital[targetWallet][token] >= currentVal) {
            totalCopiedCapital[targetWallet][token] -= currentVal;
        } else {
            totalCopiedCapital[targetWallet][token] = 0;
        }

        if (vaultBalances[msg.sender][token] >= currentVal) {
            vaultBalances[msg.sender][token] -= currentVal;
        } else {
            vaultBalances[msg.sender][token] = 0;
        }

        if (token == address(0)) {
            if (totalValueLockedETH >= currentVal) {
                totalValueLockedETH -= currentVal;
            } else {
                totalValueLockedETH = 0;
            }
        } else {
            if (totalValueLockedToken[token] >= currentVal) {
                totalValueLockedToken[token] -= currentVal;
            } else {
                totalValueLockedToken[token] = 0;
            }
        }

        delete copyPositions[msg.sender][targetWallet][token];

        if (registry != address(0)) {
            IMirroRegistry(registry).removeCopier(targetWallet, msg.sender);
        }

        // --- External calls strictly last ---
        if (token == address(0)) {
            (bool success, ) = msg.sender.call{value: totalReturn}("");
            require(success, "MirroVault: ETH transfer to user failed");
        } else {
            IERC20(token).safeTransfer(msg.sender, totalReturn);
        }

        emit CopyStopped(msg.sender, targetWallet, token, totalReturn);
    }

    /**
     * @notice Executes a mirror move across active copiers of targetWallet.
     * Bounded to a maximum of 100 copiers per batch to avoid gas limit exhaustion.
     */
    function executeMirrorMove(
        address targetWallet,
        address token,
        address fromProtocol,
        address toProtocol,
        uint256 allocationBps
    ) external onlyRelayer nonReentrant {
        require(allocationBps <= BPS_DIVISOR, "MirroVault: Invalid allocation BPS");
        address[] storage copiers = copierList[targetWallet][token];
        require(copiers.length > 0, "MirroVault: No active copiers");

        // Cap batch execution at 100 copiers to ensure block gas limits are respected
        uint256 maxCopiers = copiers.length < 100 ? copiers.length : 100;
        uint256 affectedCopiers = 0;

        for (uint256 i = 0; i < maxCopiers; i++) {
            address copier = copiers[i];
            CopyPosition storage pos = copyPositions[copier][targetWallet][token];
            if (pos.active) {
                pos.lastMoveTime = block.timestamp;
                affectedCopiers++;
            }
        }

        emit MirrorMoveExecuted(
            targetWallet,
            token,
            fromProtocol,
            toProtocol,
            allocationBps,
            affectedCopiers
        );
    }

    /**
     * @notice Emergency withdrawal of contract assets to owner.
     */
    function emergencyWithdraw(address token) external onlyOwner nonReentrant {
        if (token == address(0)) {
            uint256 balance = address(this).balance;
            require(balance > 0, "MirroVault: No ETH to withdraw");
            totalValueLockedETH = 0;
            yieldReserveETH = 0;
            (bool success, ) = owner.call{value: balance}("");
            require(success, "MirroVault: ETH emergency withdrawal failed");
            emit EmergencyWithdraw(address(0), owner, balance);
        } else {
            uint256 balance = IERC20(token).balanceOf(address(this));
            require(balance > 0, "MirroVault: No token balance to withdraw");
            totalValueLockedToken[token] = 0;
            yieldReserveToken[token] = 0;
            IERC20(token).safeTransfer(owner, balance);
            emit EmergencyWithdraw(token, owner, balance);
        }
    }

    // --- Internal Helpers ---

    function _addCopier(address targetWallet, address token, address copier) internal {
        if (!_isInCopierList[targetWallet][token][copier]) {
            _copierListIndex[targetWallet][token][copier] = copierList[targetWallet][token].length;
            copierList[targetWallet][token].push(copier);
            _isInCopierList[targetWallet][token][copier] = true;
        }
    }

    function _removeCopier(address targetWallet, address token, address copier) internal {
        if (_isInCopierList[targetWallet][token][copier]) {
            uint256 index = _copierListIndex[targetWallet][token][copier];
            uint256 lastIndex = copierList[targetWallet][token].length - 1;

            if (index != lastIndex) {
                address lastCopier = copierList[targetWallet][token][lastIndex];
                copierList[targetWallet][token][index] = lastCopier;
                _copierListIndex[targetWallet][token][lastCopier] = index;
            }

            copierList[targetWallet][token].pop();
            delete _copierListIndex[targetWallet][token][copier];
            delete _isInCopierList[targetWallet][token][copier];
        }
    }

    function _addUserPositionKey(address user, address targetWallet, address token) internal {
        if (!_userPositionKeyExists[user][targetWallet][token]) {
            _userPositionKeyIndex[user][targetWallet][token] = _userPositionKeys[user].length;
            _userPositionKeys[user].push(PositionKey({ targetWallet: targetWallet, token: token }));
            _userPositionKeyExists[user][targetWallet][token] = true;
        }
    }

    function _removeUserPositionKey(address user, address targetWallet, address token) internal {
        if (_userPositionKeyExists[user][targetWallet][token]) {
            uint256 index = _userPositionKeyIndex[user][targetWallet][token];
            uint256 lastIndex = _userPositionKeys[user].length - 1;

            if (index != lastIndex) {
                PositionKey memory lastKey = _userPositionKeys[user][lastIndex];
                _userPositionKeys[user][index] = lastKey;
                _userPositionKeyIndex[user][lastKey.targetWallet][lastKey.token] = index;
            }

            _userPositionKeys[user].pop();
            delete _userPositionKeyIndex[user][targetWallet][token];
            delete _userPositionKeyExists[user][targetWallet][token];
        }
    }

    // --- View Functions ---

    function getPosition(
        address user,
        address targetWallet,
        address token
    ) external view returns (CopyPosition memory) {
        return copyPositions[user][targetWallet][token];
    }

    function getCopiers(address targetWallet, address token) external view returns (address[] memory) {
        return copierList[targetWallet][token];
    }

    function getTotalCopiedCapital(address targetWallet, address token) external view returns (uint256) {
        return totalCopiedCapital[targetWallet][token];
    }

    function getUserPositions(address user) external view returns (CopyPosition[] memory) {
        PositionKey[] storage keys = _userPositionKeys[user];
        CopyPosition[] memory positions = new CopyPosition[](keys.length);
        for (uint256 i = 0; i < keys.length; i++) {
            positions[i] = copyPositions[user][keys[i].targetWallet][keys[i].token];
        }
        return positions;
    }

    function getTargetWallets() external view returns (address[] memory) {
        return allTargetWallets;
    }

    /**
     * @notice Reverts plain ETH transfers. Users must deposit via startCopying()
     * or owner via fundYieldReserve(). Prevents untracked funds accumulation.
     */
    receive() external payable {
        revert("MirroVault: Use startCopying()");
    }
}
