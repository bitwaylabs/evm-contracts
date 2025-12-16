// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title Bitway Token Lock Contract (Final Audited Version)
 * @notice Stores BTW tokens and allows:
 *         - Minter (IDO Contract) to mint (distribute) tokens to users
 *         - Owner (Multisig) to rescue leftover tokens after releaseTime
 */
contract BitwayTokenLock is Ownable {
    using SafeERC20 for IERC20Metadata;

    /// @notice The Bitway Token (BTW)
    IERC20Metadata public immutable BTW;

    /// @notice Address allowed to mint tokens (the IDO Contract)
    address public minter;

    /// @notice Timestamp after which the owner can rescue leftover BTW
    uint256 public immutable releaseTime;

    /// Events
    event MinterUpdated(address indexed newMinter);
    event Minted(address indexed to, uint256 amount);
    event Rescued(address indexed to, uint256 amount);

    /**
     * @param btw_ Address of the BTW token
     * @param owner_ 4/6 multisig owner
     * @param delayHours Hours after which owner can rescue leftover BTW
     */
    constructor(address btw_, address owner_, uint256 delayHours)
        Ownable(owner_)
    {
        require(btw_ != address(0), "BTW address zero");
        require(owner_ != address(0), "Owner address zero");

        BTW = IERC20Metadata(btw_);
        releaseTime = block.timestamp + (delayHours * 1 hours);
    }

    // -------------------------------------------------------------------------
    //  Minter Logic
    // -------------------------------------------------------------------------

    modifier onlyMinter() {
        require(msg.sender == minter, "Not minter");
        _;
    }

    /**
     * @notice Set the IDO contract as the minter
     * @dev Only Owner (multisig) can set this
     */
    function setMinter(address newMinter) external onlyOwner {
        require(newMinter != address(0), "Minter zero");
        minter = newMinter;
        emit MinterUpdated(newMinter);
    }

    // -------------------------------------------------------------------------
    //  Mint (Distribution)
    // -------------------------------------------------------------------------

    /**
     * @notice Mint (distribute) tokens to a user
     * @dev Called only by the IDO contract
     */
    function mint(address to, uint256 amount) external onlyMinter {
        require(to != address(0), "Recipient zero address");
        require(amount > 0, "Amount > 0");
        require(balance() >= amount, "Insufficient balance");

        BTW.safeTransfer(to, amount);
        emit Minted(to, amount);
    }

    // -------------------------------------------------------------------------
    //  Rescue Logic
    // -------------------------------------------------------------------------

    /**
     * @notice Owner (multisig) rescues leftover tokens after releaseTime
     */
    function rescue(address to, uint256 amount) external onlyOwner {
        require(block.timestamp >= releaseTime, "Time lock active");
        require(to != address(0), "Recipient zero address");
        require(amount > 0, "Amount > 0");
        require(balance() >= amount, "Not enough balance");

        BTW.safeTransfer(to, amount);
        emit Rescued(to, amount);
    }

    // -------------------------------------------------------------------------
    //  Public View Helpers
    // -------------------------------------------------------------------------

    function name() external view returns (string memory) {
        return BTW.name();
    }

    function symbol() external view returns (string memory) {
        return BTW.symbol();
    }

    function decimals() external view returns (uint8) {
        return BTW.decimals();
    }

    function balance() public view returns (uint256) {
        return BTW.balanceOf(address(this));
    }
}