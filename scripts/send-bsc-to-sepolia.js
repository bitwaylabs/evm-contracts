const { ethers } = require("hardhat");
const { addressToBytes32 } = require("@layerzerolabs/lz-v2-utilities");
const {Options} = require('@layerzerolabs/lz-v2-utilities');

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("🚀 Deployer:", deployer.address);

  const ADAPTER_ADDRESS = "0x193A45914D8045FE0a52AC815938dd9e67448AB1";
  const Sepolia_EID = 40161;
//   first step: Approve the adapter address
  const Approve_amount = ethers.parseUnits("1000000000", 18); 
  const BitwayToken = await ethers.getContractAt("BitwayToken","0x32A3A94265eF11b1f19C4841be44f340827d5f11");
  const approval = await BitwayToken.approve(ADAPTER_ADDRESS, Approve_amount);

  // second step: send 100 tokens（18 decimals）to sepolia
  const AMOUNT = ethers.parseUnits("100", 18);
  const adapter = await ethers.getContractAt("BitwayOFTAdapter", ADAPTER_ADDRESS);
  const receiver = ethers.zeroPadValue(deployer.address, 32);
  console.log(receiver)
    let options = Options.newOptions().addExecutorLzReceiveOption(65000, 0).toBytes();
    const sendParam = {
    dstEid: Sepolia_EID,
    to: addressToBytes32(deployer.address),
    amountLD: AMOUNT,
    minAmountLD: AMOUNT,
    extraOptions: options,
    composeMsg: "0x",
    oftCmd: "0x",
  };

    console.log(sendParam )

    console.log("💸 Getting fee quote...");
    const quote = await adapter.quoteSend(sendParam, false);
    console.log(quote)
    console.log(`💸 Native fee: ${ethers.formatEther(quote.nativeFee)} ETH`);
    console.log(`💸 LZ token fee: ${ethers.formatEther(quote.lzTokenFee)} LZ`);


  console.log("💰 Native fee:", ethers.formatEther(quote.nativeFee));

  // ===== 2️⃣ send to sepolia =====
  const tx = await adapter.send(
    {
      dstEid: Sepolia_EID,
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

  console.log("✅ BSC → Sepolia crosschain success");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});