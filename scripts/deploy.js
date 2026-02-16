const hre = require("hardhat");

async function main() {
  console.log("Deploying ChainMate contracts to BSC Testnet...");

  
  console.log("\n1. Deploying ChainMateToken...");
  const ChainMateToken = await hre.ethers.getContractFactory("ChainMateToken");
  const token = await ChainMateToken.deploy();
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("✅ ChainMateToken deployed to:", tokenAddress);

  
  console.log("\n2. Deploying ChainMateCore...");
  const ChainMateCore = await hre.ethers.getContractFactory("ChainMateCore");
  const core = await ChainMateCore.deploy();
  await core.waitForDeployment();
  const coreAddress = await core.getAddress();
  console.log("✅ ChainMateCore deployed to:", coreAddress);

  console.log("\n📝 Deployment Summary:");
  console.log("========================");
  console.log("ChainMateToken:", tokenAddress);
  console.log("ChainMateCore:", coreAddress);
  console.log("\n📋 Add these to your .env file:");
  console.log("NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS=" + tokenAddress);
  console.log("NEXT_PUBLIC_CORE_CONTRACT_ADDRESS=" + coreAddress);

  console.log("\n⏳ Waiting 30 seconds before verification...");
  await new Promise(resolve => setTimeout(resolve, 30000));

  
  console.log("\n🔍 Verifying contracts on BscScan...");

  try {
    await hre.run("verify:verify", {
      address: tokenAddress,
      constructorArguments: [],
    });
    console.log("✅ ChainMateToken verified");
  } catch (error) {
    console.log("❌ Token verification failed:", error.message);
  }

  try {
    await hre.run("verify:verify", {
      address: coreAddress,
      constructorArguments: [],
    });
    console.log("✅ ChainMateCore verified");
  } catch (error) {
    console.log("❌ Core verification failed:", error.message);
  }

  console.log("\n✨ Deployment Complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
