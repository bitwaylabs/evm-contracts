// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

/**
 * @title Bitway token contract.
 */
contract BitwayToken is ERC20Permit {
    uint8 private constant DECIMALS = 6; // decimals

    /**
     * @notice Constructor.
     * @param totalSupply Total supply
     * @param treasury Treasury address
     */
    constructor(
        uint256 totalSupply,
        address treasury
    ) ERC20("Bitway Token", "BTW") ERC20Permit("Bitway Token") {
        _mint(treasury, totalSupply);
    }

    /**
     * @notice Burn the specified amount of tokens.
     * @param value Amount of tokens to be burned
     */
    function burn(uint256 value) public {
        _burn(_msgSender(), value);
    }

    /**
     * @notice Override {ERC20-decimals}.
     */
    function decimals() public view virtual override returns (uint8) {
        return DECIMALS;
    }
}
