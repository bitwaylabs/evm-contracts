const { ethers } = require("hardhat");
const { addressToBytes32 } = require("@layerzerolabs/lz-v2-utilities");
const {Options} = require('@layerzerolabs/lz-v2-utilities');



async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("🚀 Deployer:", deployer.address);
  const BSC_EID = 40102;
  const OFT_ADDRESS = "0x3A63DE3572c69a1307ff08394f3Ee7702C16d25d";
  const BitwayOFT = await ethers.getContractAt("BitwayOFT",OFT_ADDRESS);

  // second step: send 100 tokens（18 decimals）to bsc testnet
  const AMOUNT = ethers.parseUnits("100", 18);
    let options = Options.newOptions().addExecutorLzReceiveOption(65000, 0).toBytes();
    const sendParam = {
    dstEid: BSC_EID,
    to: addressToBytes32(deployer.address),
    amountLD: AMOUNT,
    minAmountLD: AMOUNT,
    extraOptions: options,
    composeMsg: "0x",
    oftCmd: "0x",
  };
    console.log("💸 Getting fee quote...");
    const quote = await BitwayOFT.quoteSend(sendParam, false);
    console.log(quote)
    console.log(`💸 Native fee: ${ethers.formatEther(quote.nativeFee)} ETH`);
    console.log(`💸 LZ token fee: ${ethers.formatEther(quote.lzTokenFee)} LZ`);
  console.log("💰 Native fee:", ethers.formatEther(quote.nativeFee));

  // ===== 2️⃣ send to BSC=====
  const tx = await BitwayOFT.send(
    {
      dstEid: BSC_EID,
      to: addressToBytes32(deployer.address),
      amountLD: AMOUNT,
      minAmountLD: AMOUNT,
      extraOptions: options,
      composeMsg: "0x",
      oftCmd: "0x",
    },
    {
      nativeFee: quote.nativeFee,
      lzTokenFee: 0,
    },
    deployer.address,
    {
      value: quote.nativeFee,
    }
  );

  console.log("⏳ tx sent:", tx.hash);

  await tx.wait();

  console.log("✅ sepolia → bsc crosschain success");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});