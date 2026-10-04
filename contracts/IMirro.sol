// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function totalSupply() external view returns (uint256);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
}

interface IMirroRegistry {
    struct WalletStats {
        address wallet;
        uint256 totalMoves;
        uint256 firstSeenTimestamp;
        uint256 lastActiveTimestamp;
        uint256 totalCopiers;
        uint256 activeCopiers;
        bool isIndexed;
    }

    struct MoveRecord {
        address token;
        address fromProtocol;
        address toProtocol;
        uint256 allocationBps;
        uint256 timestamp;
        string note;
    }

    // Auth & Setup setters
    function setVault(address vault) external;
    function setRelayer(address relayer) external;

    // Relayer & Vault actions
    function indexWallet(address wallet) external;
    function recordMove(
        address wallet,
        address token,
        address fromProtocol,
        address toProtocol,
        uint256 allocationBps,
        string calldata note
    ) external;
    function recordCopier(address targetWallet, address copier) external;
    function removeCopier(address targetWallet, address copier) external;

    // View functions
    function getIndexedWallets() external view returns (address[] memory);
    function getWalletStats(address wallet) external view returns (WalletStats memory);
    function getMoveHistory(address wallet) external view returns (MoveRecord[] memory);
    function getMoveCount(address wallet) external view returns (uint256);
}

interface IMirroVault {
    struct CopyPosition {
        address targetWallet;
        address token;
        uint256 depositedAmount;
        uint256 currentValue;
        uint256 startTime;
        uint256 lastMoveTime;
        bool active;
    }

    // User actions
    function startCopying(address targetWallet, address token, uint256 amount) external payable;
    function stopCopying(address targetWallet, address token) external;

    // Relayer action
    function executeMirrorMove(
        address targetWallet,
        address token,
        address fromProtocol,
        address toProtocol,
        uint256 allocationBps
    ) external;

    // Owner actions
    function fundYieldReserve() external payable;
    function fundYieldReserveToken(address token, uint256 amount) external;
    function addSupportedToken(address token) external;

    // View functions
    function getPosition(address user, address targetWallet, address token)
        external
        view
        returns (CopyPosition memory);

    function getCopiers(address targetWallet, address token)
        external
        view
        returns (address[] memory);

    function getTotalCopiedCapital(address targetWallet, address token)
        external
        view
        returns (uint256);

    function getUserPositions(address user)
        external
        view
        returns (CopyPosition[] memory);

    function getTargetWallets()
        external
        view
        returns (address[] memory);
}
