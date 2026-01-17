import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

/**
 * Deploys FlowState contracts: FlowNFT, ActivityTracker, TipModule
 * Configures contract relationships after deployment
 */
const deployFlowState: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  console.log("\n----- Deploying FlowState Contracts -----\n");
  console.log("Deployer:", deployer);

  // 1. Deploy FlowNFT
  const flowNFT = await deploy("FlowNFT", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });
  console.log("FlowNFT deployed to:", flowNFT.address);

  // 2. Deploy ActivityTracker with FlowNFT address
  const activityTracker = await deploy("ActivityTracker", {
    from: deployer,
    args: [flowNFT.address],
    log: true,
    autoMine: true,
  });
  console.log("ActivityTracker deployed to:", activityTracker.address);

  // 3. Deploy TipModule with FlowNFT address
  const tipModule = await deploy("TipModule", {
    from: deployer,
    args: [flowNFT.address],
    log: true,
    autoMine: true,
  });
  console.log("TipModule deployed to:", tipModule.address);

  // 4. Configure FlowNFT with ActivityTracker and TipModule addresses
  const flowNFTContract = await hre.ethers.getContract("FlowNFT", deployer);

  console.log("\nConfiguring FlowNFT...");

  const tx1 = await flowNFTContract.setActivityTracker(activityTracker.address);
  await tx1.wait();
  console.log("ActivityTracker set on FlowNFT");

  const tx2 = await flowNFTContract.setTipModule(tipModule.address);
  await tx2.wait();
  console.log("TipModule set on FlowNFT");

  console.log("\n----- FlowState Deployment Complete -----\n");
  console.log("FlowNFT:", flowNFT.address);
  console.log("ActivityTracker:", activityTracker.address);
  console.log("TipModule:", tipModule.address);
};

export default deployFlowState;

deployFlowState.tags = ["FlowState", "FlowNFT", "ActivityTracker", "TipModule"];
