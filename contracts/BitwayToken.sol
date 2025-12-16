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
    // Timestamp after which transfers are allowed for non-whitelisted users
    uint256 public transferAllowedTimestamp;
    uint256 internal ETA;

    // Whitelist
    mapping(address => bool) public whitelist;

    // Events
    event NewTransferAllowedTimestamp(uint256 newTimestamp);
    event WhitelistAdded(address indexed user);
    event WhitelistRemoved(address indexed user);

    /**
     * @notice Constructor.
     * @param totalSupply Total supply
     * @param owner Owner address
     * @param transferAllowedTimestamp_ Timestamp after which transfers are allowed
     */
    constructor(
        uint256 totalSupply,
        address owner,
        uint256 transferAllowedTimestamp_
    ) Ownable(owner) ERC20("Bitway Token", "BTW") ERC20Permit("Bitway Token") {
        require(
            transferAllowedTimestamp_ >= block.timestamp,
            "Incorrect timestamp"
        );
        transferAllowedTimestamp = transferAllowedTimestamp_;

        whitelist[owner] = true;

        _mint(owner, totalSupply);
    }

    /**
     * @notice Set the new timestamp after which transfers will be allowed for non-whitelisted addresses
     * @param newTimestamp The new timestamp
     */
    function setTransferAllowedTimestamp(
        uint256 newTimestamp
    ) external onlyOwner {
        if (transferAllowedTimestamp > block.timestamp && ETA == 0) {
            transferAllowedTimestamp = newTimestamp;
        } else {
            if (ETA == 0) {
                ETA = transferAllowedTimestamp + 1 days;
            }

            require(newTimestamp <= ETA, "The timestamp exceeds the ETA");
            transferAllowedTimestamp = newTimestamp;
        }

        emit NewTransferAllowedTimestamp(newTimestamp);
    }

    /**
     * @notice Add the specified address to whitelist
     * @param user The destination address to be added to whitelist
     */
    function addToWhitelist(address user) external onlyOwner {
        whitelist[user] = true;
        emit WhitelistAdded(user);
    }

    /**
     * @notice Remove the specified address from whitelist
     * @param user The destination address to be removed from whitelist
     */
    function removeFromWhitelist(address user) external onlyOwner {
        whitelist[user] = false;
        emit WhitelistRemoved(user);
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
     * @notice Override {ERC20._update} to enforce time lock and whitelist
     */
    function _update(address from, address to, uint256 value) internal override {
        if (block.timestamp < transferAllowedTimestamp) {

            // FIX: allow mint (from = address(0)) and burn (to = address(0))
            if (from != address(0)) {
                require(whitelist[from], "Not allowed");
            }
        }

        super._update(from, to, value);
    }
}
