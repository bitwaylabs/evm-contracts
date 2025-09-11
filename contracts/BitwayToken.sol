// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

/**
 * @title Bitway token contract.
 */
contract BitwayToken is Ownable, Pausable, ERC20Permit {
    uint8 private constant DECIMALS = 6; // decimals

    /**
     * @notice Constructor.
     * @param totalSupply Total supply
     * @param owner Owner address
     */
    constructor(
        uint256 totalSupply,
        address owner
    ) Ownable(owner) ERC20("Bitway Token", "BTW") ERC20Permit("Bitway Token") {
        _mint(owner, totalSupply);
    }

    /**
     * @notice Override {ERC20-transfer}.
     */
    function transfer(
        address to,
        uint256 value
    ) public virtual override whenNotPaused returns (bool) {
        return super.transfer(to, value);
    }

    /**
     * @notice Override {ERC20-transferFrom}.
     */
    function transferFrom(
        address from,
        address to,
        uint256 value
    ) public virtual override whenNotPaused returns (bool) {
        return super.transferFrom(from, to, value);
    }

    /**
     * @notice Burn the specified amount of tokens.
     * @param value Amount of tokens to be burned
     */
    function burn(uint256 value) public {
        _burn(_msgSender(), value);
    }

    /**
     * @notice Pause. Transfer will be disabled when paused.
     */
    function pause() public onlyOwner {
        _pause();
    }

    /**
     * @notice Unpause. Transfer will be enabled when unpaused.
     */
    function unpause() public onlyOwner {
        _unpause();
    }

    /**
     * @notice Override {ERC20-decimals}.
     */
    function decimals() public view virtual override returns (uint8) {
        return DECIMALS;
    }
}
