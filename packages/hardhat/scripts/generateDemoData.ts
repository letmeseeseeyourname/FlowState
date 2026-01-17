import { ethers } from "hardhat";

async function main() {
  const signers = await ethers.getSigners();

  // Get deployed contracts
  const flowNFT = await ethers.getContract("FlowNFT");
  const activityTracker = await ethers.getContract("ActivityTracker");
  const tipModule = await ethers.getContract("TipModule");

  console.log("\n=== Generating Demo Data ===\n");

  // Use first 5 accounts for demo
  const [deployer, user1, user2, user3, user4] = signers;

  console.log("Accounts:");
  console.log(`  Deployer (Burning): ${deployer.address}`);
  console.log(`  User1 (Active):     ${user1.address}`);
  console.log(`  User2 (Active):     ${user2.address}`);
  console.log(`  User3 (Idle):       ${user3.address}`);
  console.log(`  User4 (Idle):       ${user4.address}`);

  // Mint NFTs for all users
  console.log("\n--- Minting NFTs ---");

  for (const user of [deployer, user1, user2, user3, user4]) {
    const hasMinted = await flowNFT.hasMinted(user.address);
    if (!hasMinted) {
      await flowNFT.connect(user).mint();
      console.log(`  Minted NFT for ${user.address.slice(0, 8)}...`);
    } else {
      console.log(`  Already minted for ${user.address.slice(0, 8)}...`);
    }
  }

  // Generate interactions to create different states
  console.log("\n--- Generating Interactions ---");

  // Make deployer "Burning" (20+ interactions)
  console.log("\nMaking Deployer reach BURNING state (20+ interactions)...");
  for (let i = 0; i < 12; i++) {
    // Likes from different users to deployer
    const liker = signers[i % 4 + 1]; // user1-user4 rotate
    const hasLiked = await activityTracker.hasLikedInEpoch(liker.address, deployer.address);
    if (!hasLiked) {
      await activityTracker.connect(liker).like(deployer.address);
      console.log(`  ${liker.address.slice(0, 8)}... liked deployer`);
    }
  }

  // Tips to deployer
  const tipAmount = ethers.parseEther("0.001");
  for (let i = 0; i < 10; i++) {
    const tipper = signers[i % 4 + 1];
    await tipModule.connect(tipper).tip(deployer.address, { value: tipAmount });
    console.log(`  ${tipper.address.slice(0, 8)}... tipped deployer 0.001 ETH`);
  }

  // Make user1 "Active" (5-19 interactions)
  console.log("\nMaking User1 reach ACTIVE state (5-19 interactions)...");
  for (let i = 0; i < 4; i++) {
    const liker = signers[(i + 2) % 5]; // avoid self-like
    if (liker.address !== user1.address) {
      const hasLiked = await activityTracker.hasLikedInEpoch(liker.address, user1.address);
      if (!hasLiked) {
        await activityTracker.connect(liker).like(user1.address);
        console.log(`  ${liker.address.slice(0, 8)}... liked user1`);
      }
    }
  }
  // Add some tips to user1
  for (let i = 0; i < 3; i++) {
    const tipper = signers[(i + 2) % 5];
    if (tipper.address !== user1.address) {
      await tipModule.connect(tipper).tip(user1.address, { value: tipAmount });
      console.log(`  ${tipper.address.slice(0, 8)}... tipped user1`);
    }
  }

  // Make user2 "Active" (5-19 interactions)
  console.log("\nMaking User2 reach ACTIVE state...");
  for (let i = 0; i < 3; i++) {
    const liker = signers[(i + 3) % 5];
    if (liker.address !== user2.address) {
      const hasLiked = await activityTracker.hasLikedInEpoch(liker.address, user2.address);
      if (!hasLiked) {
        await activityTracker.connect(liker).like(user2.address);
        console.log(`  ${liker.address.slice(0, 8)}... liked user2`);
      }
    }
  }
  for (let i = 0; i < 3; i++) {
    const tipper = signers[(i + 3) % 5];
    if (tipper.address !== user2.address) {
      await tipModule.connect(tipper).tip(user2.address, { value: tipAmount });
      console.log(`  ${tipper.address.slice(0, 8)}... tipped user2`);
    }
  }

  // User3 and User4 stay Idle (0-4 interactions)
  console.log("\nUser3 and User4 stay in IDLE state (few interactions)...");
  // Just 1-2 interactions each
  const hasLiked3 = await activityTracker.hasLikedInEpoch(deployer.address, user3.address);
  if (!hasLiked3) {
    await activityTracker.connect(deployer).like(user3.address);
    console.log(`  Deployer liked user3`);
  }
  const hasLiked4 = await activityTracker.hasLikedInEpoch(deployer.address, user4.address);
  if (!hasLiked4) {
    await activityTracker.connect(deployer).like(user4.address);
    console.log(`  Deployer liked user4`);
  }

  // Print final states
  console.log("\n=== Final States ===\n");

  for (const user of [deployer, user1, user2, user3, user4]) {
    const state = await flowNFT.getFlowState(user.address);
    const level = Number(state.stateLevel);
    const levelName = level === 2 ? "BURNING" : level === 1 ? "ACTIVE" : "IDLE";
    const total = Number(state.totalInteractions);
    console.log(`${user.address.slice(0, 10)}...: ${levelName} (${total} interactions)`);
  }

  console.log("\n=== Demo Data Generation Complete ===\n");
  console.log("Demo accounts to try in the UI:");
  console.log(`  BURNING: ${deployer.address}`);
  console.log(`  ACTIVE:  ${user1.address}`);
  console.log(`  ACTIVE:  ${user2.address}`);
  console.log(`  IDLE:    ${user3.address}`);
  console.log(`  IDLE:    ${user4.address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
