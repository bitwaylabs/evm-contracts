const { expect } = require("chai");
const { ethers } = require("hardhat");
require('dotenv').config();

describe("IDO Flow for BitwayToken + BitwayTokenLock", function () {
    let owner, minter, user, other, token, lock;

    beforeEach(async function () {
        [owner, minter, user, other] = await ethers.getSigners();

        // Deploy token
        const BitwayToken = await ethers.getContractFactory("BitwayToken");
        const now = (await ethers.provider.getBlock("latest")).timestamp;
        const unlockTime = now + 30 * 24 * 3600;

        
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
            2
        );
        await lock.waitForDeployment();

        // Add lock contract to whitelist
        await token.addToWhitelist(await lock.getAddress());

        // Transfer to lock
        await token.transfer(await lock.getAddress(), ethers.parseEther("50000"));
    });

    it("Lock contract (whitelist) can distribute to user", async function () {
        await lock.setMinter(minter.address)
        await lock.connect(minter).mint(user.address, ethers.parseEther("1000"));
        expect(await token.balanceOf(user.address)).to.equal(
            ethers.parseEther("1000")
        );
    });
    it("User cannot transfer before listing", async function () {
        await lock.setMinter(minter.address)
        await lock.connect(minter).mint(user.address, ethers.parseEther("1000"));
       await expect(token.connect(user).transfer(other.address, ethers.parseEther("1"))).to.be.revertedWith("Not allowed");
    });

    it("Owner and lock can transfer (whitelist)", async function () {
        await lock.setMinter(minter.address)
        await lock.connect(minter).mint(owner.address, ethers.parseEther("1000"));

        await expect(
            token.transfer(user.address, ethers.parseEther("1"))
        ).to.not.be.reverted;
    });

    it("After unlock time, users can transfer freely", async function () {
        await lock.setMinter(minter.address)
        await lock.connect(minter).mint(user.address, ethers.parseEther("1000"));

        // fast forward 40 days
        await ethers.provider.send("evm_increaseTime", [40 * 24 * 3600]);
        await ethers.provider.send("evm_mine");

        await expect(
            token.connect(user).transfer(owner.address, ethers.parseEther("1"))
        ).to.not.be.reverted;
    });

    it("Rescue cannot be performed before releaseTime", async () => {
        const amount = ethers.parseEther("100");

        await expect(
            lock.connect(owner).rescue(other.address, amount)
        ).to.be.revertedWith("Time lock active");
    });


    it("Only owner can call rescue", async () => {
       // fast forward over release time (delayHours = 2)
        await ethers.provider.send("evm_increaseTime", [3 * 3600]);
        await ethers.provider.send("evm_mine");
        await expect(
            lock.connect(minter).rescue(other.address, ethers.parseEther("100"))
        ).to.be.reverted;
    });

        it("Rescue updates lock contract balance correctly", async () => {
        await ethers.provider.send("evm_increaseTime", [3 * 3600]);
        await ethers.provider.send("evm_mine");

        const rescueAmount = ethers.parseEther("500");

        const lockBalBefore = await token.balanceOf(await lock.getAddress());
        const userBalBefore = await token.balanceOf(user.address);

        await lock.connect(owner).rescue(user.address, rescueAmount);

        const lockBalAfter = await token.balanceOf(await lock.getAddress());
        const userBalAfter = await token.balanceOf(user.address);

        expect(lockBalBefore - lockBalAfter).to.equal(rescueAmount);
        expect(userBalAfter - userBalBefore).to.equal(rescueAmount);
    });

    it("Rescue works multiple times", async () => {
        await ethers.provider.send("evm_increaseTime", [3 * 3600]);
        await ethers.provider.send("evm_mine");

        const amount1 = ethers.parseEther("100");
        const amount2 = ethers.parseEther("150");

        await lock.connect(owner).rescue(other.address, amount1);
        await lock.connect(owner).rescue(other.address, amount2);

        expect(await token.balanceOf(other.address)).to.equal(amount1 + amount2);
    });
    
    it("Owner can rescue after release time", async () => {
        // fast forward over release time (delayHours = 2)
        await ethers.provider.send("evm_increaseTime", [3 * 3600]);
        await ethers.provider.send("evm_mine");

        const rescueTarget = other.address; // not owner
        const amount = ethers.parseEther("200");

        const balanceBefore = await token.balanceOf(rescueTarget);

        await expect(
            lock.connect(owner).rescue(rescueTarget, amount)
        )
            .to.emit(lock, "Rescued")
            .withArgs(rescueTarget, amount);

        const balanceAfter = await token.balanceOf(rescueTarget);

        expect(balanceAfter - balanceBefore).to.equal(amount);
    });
});

