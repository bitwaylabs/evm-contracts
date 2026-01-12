const { ethers } = require("hardhat");

// BSC testnet endpoint address: 0x6EDCE65403992e310A62460808c4b910D972f10f
// Chain ID: 97
// Endpoint ID: 40102

// BSC mainnet endpoint address: 0x1a44076050125825900e736c501f859c50fE728c
// Chain ID: 56
// Endpoint ID: 30102

//testnet bsc adapter address: 0x193A45914D8045FE0a52AC815938dd9e67448AB1

async function main() {
    const [deployer] = await ethers.getSigners();
    //  deploy BitwayToken contract
    console.log("Deploying with the account:", deployer.address);
    console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)));
    const BitwayTokenAddress = "0x32A3A94265eF11b1f19C4841be44f340827d5f11";
    const BSClzEndpoint = "0x6EDCE65403992e310A62460808c4b910D972f10f"
    const owner = deployer.address;
    const BitwayAdapter = await ethers.getContractFactory("BitwayOFTAdapter");
    const contract = await BitwayAdapter.deploy(
        BitwayTokenAddress,
        BSClzEndpoint,
        owner,
    );
    await contract.waitForDeployment();
    console.log("contract address:", contract.target);

    // verify
    if (network.name !== "hardhat" && network.name !== "localhost") {
      await contract.deploymentTransaction().wait(6);
      
      try {
        await hre.run("verify:verify", {
          address: contract.target,
          constructorArguments: [
          BitwayTokenAddress,
          BSClzEndpoint,
          owner,
          ],
        });
        console.log("Verify Success");
      } catch (error) {
        console.log("verify fail:", error.message);
      }
      }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

