import { ethers } from "hardhat";

async function main() {
  const flowNFT = await ethers.getContract("FlowNFT");
  const signers = await ethers.getSigners();

  console.log("\n--- Adding IDLE users ---\n");

  // Mint for accounts 5, 6, 7 - they'll stay IDLE with 0 interactions
  for (let i = 5; i <= 7; i++) {
    const user = signers[i];
    const hasMinted = await flowNFT.hasMinted(user.address);
    if (!hasMinted) {
      await flowNFT.connect(user).mint();
      console.log(`Minted IDLE NFT for Account ${i}: ${user.address}`);
    } else {
      console.log(`Already minted for Account ${i}: ${user.address}`);
    }
  }

  console.log("\n=== All Demo Accounts Ready ===\n");
  console.log("View these profiles in the UI:\n");
  console.log("BURNING (24 interactions):");
  console.log("  0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266\n");
  console.log("ACTIVE (16 interactions):");
  console.log("  0x70997970C51812dc3A010C7d01b50e0d17dc79C8\n");
  console.log("ACTIVE (12 interactions):");
  console.log("  0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC\n");
  console.log("IDLE (0 interactions):");
  console.log("  0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc");
  console.log("  0x976EA74026E726554dB657fA54763abd0C3a0aa9");
  console.log("  0x14dC79964da2C08b23698B3D3cc7Ca32193d9955");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
