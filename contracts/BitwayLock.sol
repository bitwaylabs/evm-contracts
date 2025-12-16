// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title Bitway Token Lock Contract
 * @notice Stores BTW tokens and allows controlled distribution with a time-lock for owner rescue.
 */
contract BitwayTokenLock is Ownable {
    using SafeERC20 for IERC20Metadata;

    /// @notice The Bitway Token (BTW)
    IERC20Metadata public immutable BTW;

    /// @notice Timestamp after which the owner can rescue leftover BTW
    uint256 public immutable releaseTime;

    /// @notice Emitted when tokens are distributed
    event Distributed(address indexed to, uint256 amount);

    /// @notice Emitted when owner rescues leftover tokens
    event Rescued(address indexed to, uint256 amount);

    /**
     * @param btw_ The address of the Bitway token
     * @param owner_ Owner of the lock contract
     * @param delayHours Number of hours after which owner can rescue leftover BTW
     */
    constructor(address btw_, address owner_, uint256 delayHours) Ownable(owner_) {
        require(btw_ != address(0), "BTW address zero");
        require(owner_ != address(0), "Owner address zero");

        BTW = IERC20Metadata(btw_);
        releaseTime = block.timestamp + (delayHours * 1 hours);
    }

    /**
     * @notice Returns the name of the locked token
     */
    function name() external view returns (string memory) {
        return BTW.name();
    }

    /**
     * @notice Returns the symbol of the locked token
     */
    function symbol() external view returns (string memory) {
        return BTW.symbol();
    }

    /**
     * @notice Returns decimals of the locked token
     */
    function decimals() external view returns (uint8) {
        return BTW.decimals();
    }

    /**
     * @notice Returns Bitway token balance inside this lock contract
     */
    function balance() public view returns (uint256) {
        return BTW.balanceOf(address(this));
    }

    /**
     * @notice Distribute BTW to a user
     * @param to Recipient of the tokens
     * @param amount Amount of tokens to send
     */
    function distribute(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Recipient zero address");
        require(amount > 0, "Amount > 0");
        require(balance() >= amount, "Insufficient contract balance");

        BTW.safeTransfer(to, amount);
        emit Distributed(to, amount);
    }

    /**
     * @notice Owner rescues leftover BTW after releaseTime
     * @param to Address receiving the rescued tokens
     * @param amount Amount to rescue
     */
    function rescue(address to, uint256 amount) external onlyOwner {
        require(block.timestamp >= releaseTime, "Time lock active");
        require(to != address(0), "Recipient zero address");
        require(amount > 0, "Amount > 0");
        require(balance() >= amount, "Not enough balance");

        BTW.safeTransfer(to, amount);
        emit Rescued(to, amount);
    }
}