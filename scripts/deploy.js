const { ethers } = require("hardhat");

async function deploy() {
    const [deployer] = await ethers.getSigners();

    // deploy BitwayToken contract

    const totalSupply = "1000000000000000"; // 1B
    const treasury = ""; // treasury address

    console.log("Deploying with the account:", deployer.address);
    console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)));

    const contractFactory = await ethers.getContractFactory("BitwayToken");

    const contract = await contractFactory.deploy(totalSupply, treasury);
    await contract.waitForDeployment();

    console.log("contract address:", contract.target);
}

deploy()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
