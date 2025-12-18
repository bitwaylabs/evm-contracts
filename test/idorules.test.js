const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BitwayToken — IDO, TGE, TimeLock, ETA Logic", function () {
    let owner, minter, user, partner, other, token, lock;

    beforeEach(async function () {
        [owner, minter, user, partner, other] = await ethers.getSigners();

        const now = (await ethers.provider.getBlock()).timestamp;

        const BitwayToken = await ethers.getContractFactory("BitwayToken");

        token = await BitwayToken.deploy(
            ethers.parseEther("1000000"),
            owner.address,
            now + 3600 // 1 hour later
        );
        await token.waitForDeployment();



        const BitwayTokenLock = await ethers.getContractFactory("BitwayTokenLock");
        lock = await BitwayTokenLock.deploy(await token.getAddress(), owner.address, 0);
        await lock.waitForDeployment();

        await token.addToWhitelist(await lock.getAddress());
        await token.transfer(await lock.getAddress(), ethers.parseEther("50000"));

    });

    // -------------------------------------------------------
    it("1. Whitelist add/remove", async function () {
        await token.addToWhitelist(partner.address);
        expect(await token.whitelist(partner.address)).to.equal(true);

        await token.removeFromWhitelist(partner.address);
        expect(await token.whitelist(partner.address)).to.equal(false);
    });

    // -------------------------------------------------------
    it("2. User cannot transfer before TGE", async function () {
        await lock.setMinter(minter.address)
        await lock.connect(minter).mint(user.address, ethers.parseEther("100"));

        await expect(
            token.connect(user).transfer(other.address, ethers.parseEther("1"))
        ).to.be.revertedWith("Not allowed");
    });

    // -------------------------------------------------------
    it("3. Whitelisted address can transfer before TGE", async function () {
        await token.addToWhitelist(partner.address);
        await lock.setMinter(minter.address)
        await lock.connect(minter).mint(partner.address, ethers.parseEther("1000"));

        await expect(
            token.connect(partner).transfer(user.address, ethers.parseEther("1"))
        ).to.not.be.reverted;
    });

    // -------------------------------------------------------
    it("4. After TGE, anyone can transfer", async function () {
        await lock.setMinter(minter.address)
        await lock.connect(minter).mint(user.address, ethers.parseEther("1000"));

        const unlockTs = await token.transferAllowedTimestamp();
        const now = (await ethers.provider.getBlock()).timestamp;

        await ethers.provider.send("evm_increaseTime", [Number(unlockTs) - now + 5]);
        await ethers.provider.send("evm_mine");

        await expect(
            token.connect(user).transfer(other.address, ethers.parseEther("1"))
        ).to.not.be.reverted;
    });

    // =======================================================
    // ETA LOGIC
    // =======================================================

    it("5. First update BEFORE TGE is free", async function () {
        const original = await token.transferAllowedTimestamp();
        const now = (await ethers.provider.getBlock()).timestamp;

        const newTs = Math.max(Number(original) + 500, now + 10);

        await expect(token.setTransferAllowedTimestamp(newTs)).to.not.be.reverted;

        expect(await token.transferAllowedTimestamp()).to.equal(newTs);
    });

    // -------------------------------------------------------
    it("6. Second update enforces ETA (first update occurs AFTER TGE)", async function () {
        const original = await token.transferAllowedTimestamp();

        // Move time to AFTER TGE
        const now = (await ethers.provider.getBlock()).timestamp;
        await ethers.provider.send("evm_increaseTime", [Number(original) - now + 5]);
        await ethers.provider.send("evm_mine");

        // First update now triggers ETA mode
        await token.setTransferAllowedTimestamp(Number(original) + 100);

        const ETA = Number(original) + 86400;
        
        // Allowed
        await expect(
            token.setTransferAllowedTimestamp(ETA)
        ).to.not.be.reverted;

        // Not allowed → MUST revert now
        await expect(
            token.setTransferAllowedTimestamp(ETA + 1)
        ).to.be.revertedWith("The timestamp exceeds the ETA");
    });

    // -------------------------------------------------------
    it("7. If TGE already passed, first update must obey ETA", async function () {
        const original = await token.transferAllowedTimestamp();
        const now = (await ethers.provider.getBlock()).timestamp;

        await ethers.provider.send("evm_increaseTime", [Number(original) - now + 5]);
        await ethers.provider.send("evm_mine");

        const newTs = Number(original) + 1000;

        // First update triggers ETA mode
        await expect(token.setTransferAllowedTimestamp(newTs)).to.not.be.reverted;

        const ETA = Number(original) + 86400;

        await expect(
            token.setTransferAllowedTimestamp(ETA + 100)
        ).to.be.revertedWith("The timestamp exceeds the ETA");
    });
});