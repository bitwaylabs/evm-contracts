const { ethers } = require("hardhat");

// sepolia testnet endpoint address: 0x6EDCE65403992e310A62460808c4b910D972f10f
// Chain ID: 11155111
// Endpoint ID: 40161

// ETH mainnet endpoint address: 0x1a44076050125825900e736c501f859c50fE728c
// Chain ID: 1
// Endpoint ID: 30101

//testnet sepolia OFT address: 0x3A63DE3572c69a1307ff08394f3Ee7702C16d25d

async function main() {
    const [deployer] = await ethers.getSigners();
    //  deploy BitwayToken contract
    console.log("Deploying with the account:", deployer.address);
    console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)));
    const Token_name = "Bitway Token"
    const Token_symbol = "BTW"
    const ETHlzEndpoint = "0x6EDCE65403992e310A62460808c4b910D972f10f"
    const owner = deployer.address;
    const BitwayAdapter = await ethers.getContractFactory("BitwayOFT");
    const contract = await BitwayAdapter.deploy(
        Token_name ,
        Token_symbol,
        ETHlzEndpoint,
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
            Token_name ,
            Token_symbol,
            ETHlzEndpoint,
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
