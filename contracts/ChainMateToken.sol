// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ChainMateToken (CMT)
 * @dev Test token for ChainMate platform on BSC
 */
contract ChainMateToken is ERC20, Ownable {
    constructor() ERC20("ChainMate Token", "CMT") Ownable(msg.sender) {
        
        _mint(msg.sender, 1_000_000 * 10**decimals());
    }

    /**
     * @dev Mint new tokens (only owner)
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /**
     * @dev Faucet function for testnet - allows users to claim tokens
     */
    function faucet() external {
        
        _mint(msg.sender, 100 * 10**decimals());
    }
}
