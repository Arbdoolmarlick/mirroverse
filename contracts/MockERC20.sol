// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IMirro.sol";

/**
 * @title MockERC20
 * @notice Standard testnet ERC-20 token with a public faucet for Arbitrum Sepolia testing.
 */
contract MockERC20 is IERC20 {
    string public name;
    string public symbol;
    uint8 public decimals;
    uint256 public override totalSupply;

    mapping(address => uint256) public override balanceOf;
    mapping(address => mapping(address => uint256)) public override allowance;

    uint256 public faucetAmount;

    constructor(
        string memory _name,
        string memory _symbol,
        uint8 _decimals,
        uint256 _initialSupply
    ) {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        faucetAmount = 1000 * (10 ** uint256(_decimals));

        if (_initialSupply > 0) {
            _mint(msg.sender, _initialSupply);
        }
    }

    function transfer(address recipient, uint256 amount) external override returns (bool) {
        require(recipient != address(0), "MockERC20: Transfer to zero address");
        require(balanceOf[msg.sender] >= amount, "MockERC20: Insufficient balance");

        balanceOf[msg.sender] -= amount;
        balanceOf[recipient] += amount;
        emit Transfer(msg.sender, recipient, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external override returns (bool) {
        require(spender != address(0), "MockERC20: Approve to zero address");
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external override returns (bool) {
        require(sender != address(0), "MockERC20: Transfer from zero address");
        require(recipient != address(0), "MockERC20: Transfer to zero address");
        require(balanceOf[sender] >= amount, "MockERC20: Insufficient balance");
        require(allowance[sender][msg.sender] >= amount, "MockERC20: Insufficient allowance");

        balanceOf[sender] -= amount;
        balanceOf[recipient] += amount;
        allowance[sender][msg.sender] -= amount;
        emit Transfer(sender, recipient, amount);
        return true;
    }

    /**
     * @notice Free testnet faucet for users to test deposits and mirroring.
     */
    function faucet() external {
        _mint(msg.sender, faucetAmount);
    }

    /**
     * @notice Mint testnet tokens to any address.
     */
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function _mint(address to, uint256 amount) internal {
        require(to != address(0), "MockERC20: Mint to zero address");
        totalSupply += amount;
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }
}
