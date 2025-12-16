const { expect } = require("chai");
const { ethers } = require("hardhat");
require('dotenv').config();

describe("IDO Flow for BitwayToken + BitwayTokenLock", function () {
    let owner, user, other, token, lock;

    beforeEach(async function () {
        [owner, user, other] = await ethers.getSigners();

        // Deploy token
        const BitwayToken = await ethers.getContractFactory("BitwayToken");
        const unlockTime = Math.floor(Date.now() / 1000) + 30 * 24 * 3600;

        
        token = await BitwayToken.deploy(
            ethers.parseEther("1000000"),
            owner.address,
            unlockTime
        );
        await token.waitForDeployment();

        // Deploy lock contract
        const BitwayTokenLock = await ethers.getContractFactory("BitwayTokenLock");
        lock = await BitwayTokenLock.deploy(
            await token.getAddress(),
            owner.address,
            0
        );
        await lock.waitForDeployment();

        // Add lock contract to whitelist
        await token.addToWhitelist(await lock.getAddress());

        // Transfer to lock
        await token.transfer(await lock.getAddress(), ethers.parseEther("50000"));
    });

    it("Lock contract (whitelist) can distribute to user", async function () {
        await lock.distribute(user.address, ethers.parseEther("1000"));
        expect(await token.balanceOf(user.address)).to.equal(
            ethers.parseEther("1000")
        );
    });
    it("User cannot transfer before listing", async function () {
        await lock.distribute(user.address, ethers.parseEther("1000"));
       await expect(token.connect(user).transfer(other.address, ethers.parseEther("1"))).to.be.revertedWith("Not allowed");
    });

    it("Owner and lock can transfer (whitelist)", async function () {
        await lock.distribute(owner.address, ethers.parseEther("1000"));

        await expect(
            token.transfer(user.address, ethers.parseEther("1"))
        ).to.not.be.reverted;
    });

    it("After unlock time, users can transfer freely", async function () {
        await lock.distribute(user.address, ethers.parseEther("1000"));

        // fast forward 40 days
        await ethers.provider.send("evm_increaseTime", [40 * 24 * 3600]);
        await ethers.provider.send("evm_mine");

        await expect(
            token.connect(user).transfer(owner.address, ethers.parseEther("1"))
        ).to.not.be.reverted;
    });
});