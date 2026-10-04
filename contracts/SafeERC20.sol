// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IMirro.sol";

/**
 * @title SafeERC20
 * @notice Wrappers around ERC-20 operations that throw on failure.
 * Handles tokens that do not return a bool (such as USDT) as well as standard tokens.
 * Matches the canonical OpenZeppelin SafeERC20 pattern.
 */
library SafeERC20 {
    function safeTransfer(
        IERC20 token,
        address to,
        uint256 value
    ) internal {
        _callOptionalReturn(token, abi.encodeWithSelector(token.transfer.selector, to, value));
    }

    function safeTransferFrom(
        IERC20 token,
        address from,
        address to,
        uint256 value
    ) internal {
        _callOptionalReturn(token, abi.encodeWithSelector(token.transferFrom.selector, from, to, value));
    }

    function _callOptionalReturn(IERC20 token, bytes memory data) private {
        require(address(token).code.length > 0, "SafeERC20: Call to non-contract");
        (bool success, bytes memory returndata) = address(token).call(data);
        require(success, "SafeERC20: Low-level call failed");

        if (returndata.length > 0) {
            require(abi.decode(returndata, (bool)), "SafeERC20: ERC20 operation did not succeed");
        }
    }
}
