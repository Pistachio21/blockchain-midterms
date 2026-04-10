import { ethers } from "hardhat";

async function main() {
  console.log("Deploying TipPost contract...");

  // Get the contract factory
  const TipPost = await ethers.getContractFactory("TipPost");

  // Deploy the contract
  const tipPost = await TipPost.deploy();

  await tipPost.waitForDeployment();

  const contractAddress = await tipPost.getAddress();

  console.log(`TipPost deployed to: ${contractAddress}`);

  // Verify the contract address for Sepolia
  if (process.env.NETWORK === "sepolia") {
    console.log("\nTo verify the contract on Etherscan, run:");
    console.log(`npx hardhat verify --network sepolia ${contractAddress}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });