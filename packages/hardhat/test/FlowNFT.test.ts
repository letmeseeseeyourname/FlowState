import { expect } from "chai";
import { ethers } from "hardhat";
import { FlowNFT, ActivityTracker, TipModule } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("FlowState", function () {
  let flowNFT: FlowNFT;
  let activityTracker: ActivityTracker;
  let tipModule: TipModule;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let user3: SignerWithAddress;

  const MIN_TIP = ethers.parseEther("0.0001");

  beforeEach(async function () {
    [owner, user1, user2, user3] = await ethers.getSigners();

    // Deploy FlowNFT
    const FlowNFTFactory = await ethers.getContractFactory("FlowNFT");
    flowNFT = await FlowNFTFactory.deploy();
    await flowNFT.waitForDeployment();

    // Deploy ActivityTracker
    const ActivityTrackerFactory = await ethers.getContractFactory("ActivityTracker");
    activityTracker = await ActivityTrackerFactory.deploy(await flowNFT.getAddress());
    await activityTracker.waitForDeployment();

    // Deploy TipModule
    const TipModuleFactory = await ethers.getContractFactory("TipModule");
    tipModule = await TipModuleFactory.deploy(await flowNFT.getAddress());
    await tipModule.waitForDeployment();

    // Configure FlowNFT
    await flowNFT.setActivityTracker(await activityTracker.getAddress());
    await flowNFT.setTipModule(await tipModule.getAddress());
  });

  describe("FlowNFT Minting", function () {
    it("Should mint only once per address", async function () {
      await flowNFT.connect(user1).mint();
      expect(await flowNFT.hasMinted(user1.address)).to.be.true;
      expect(await flowNFT.tokenOfOwner(user1.address)).to.equal(1);

      await expect(flowNFT.connect(user1).mint()).to.be.revertedWith("Already minted");
    });

    it("Should emit NFTMinted event", async function () {
      await expect(flowNFT.connect(user1).mint())
        .to.emit(flowNFT, "NFTMinted")
        .withArgs(user1.address, 1);
    });

    it("Should increment token IDs correctly", async function () {
      await flowNFT.connect(user1).mint();
      await flowNFT.connect(user2).mint();
      await flowNFT.connect(user3).mint();

      expect(await flowNFT.tokenOfOwner(user1.address)).to.equal(1);
      expect(await flowNFT.tokenOfOwner(user2.address)).to.equal(2);
      expect(await flowNFT.tokenOfOwner(user3.address)).to.equal(3);
    });
  });

  describe("Like Functionality", function () {
    beforeEach(async function () {
      await flowNFT.connect(user1).mint();
      await flowNFT.connect(user2).mint();
    });

    it("Should allow liking another user", async function () {
      await expect(activityTracker.connect(user1).like(user2.address))
        .to.emit(activityTracker, "Liked")
        .withArgs(user1.address, user2.address, await activityTracker.getCurrentEpoch());
    });

    it("Should update state on like", async function () {
      await activityTracker.connect(user1).like(user2.address);

      const [, likesReceived, likesSent, , , ,] = await flowNFT.getFlowState(user1.address);
      expect(likesSent).to.equal(1);

      const [, targetLikesReceived, , , , ,] = await flowNFT.getFlowState(user2.address);
      expect(targetLikesReceived).to.equal(1);
    });

    it("Should prevent liking yourself", async function () {
      await expect(activityTracker.connect(user1).like(user1.address)).to.be.revertedWith(
        "Cannot like yourself"
      );
    });

    it("Should prevent liking same user twice in same epoch", async function () {
      await activityTracker.connect(user1).like(user2.address);
      await expect(activityTracker.connect(user1).like(user2.address)).to.be.revertedWith(
        "Already liked this epoch"
      );
    });

    it("Should require FlowNFT ownership to like", async function () {
      await expect(activityTracker.connect(user3).like(user2.address)).to.be.revertedWith(
        "Must own FlowNFT to like"
      );
    });
  });

  describe("Tip Functionality", function () {
    beforeEach(async function () {
      await flowNFT.connect(user1).mint();
      await flowNFT.connect(user2).mint();
    });

    it("Should allow tipping with minimum amount", async function () {
      await expect(tipModule.connect(user1).tip(user2.address, { value: MIN_TIP }))
        .to.emit(tipModule, "Tipped")
        .withArgs(user1.address, user2.address, MIN_TIP, await tipModule.getCurrentEpoch());
    });

    it("Should reject tips below minimum", async function () {
      const belowMin = ethers.parseEther("0.00001");
      await expect(tipModule.connect(user1).tip(user2.address, { value: belowMin })).to.be.revertedWith(
        "Tip amount too small"
      );
    });

    it("Should update both parties' states on tip", async function () {
      await tipModule.connect(user1).tip(user2.address, { value: MIN_TIP });

      const [, , , , tipsSent, ,] = await flowNFT.getFlowState(user1.address);
      expect(tipsSent).to.equal(1);

      const [, , , tipsReceived, , ,] = await flowNFT.getFlowState(user2.address);
      expect(tipsReceived).to.equal(1);
    });

    it("Should track pending withdrawals", async function () {
      await tipModule.connect(user1).tip(user2.address, { value: MIN_TIP });
      expect(await tipModule.pendingWithdrawals(user2.address)).to.equal(MIN_TIP);
    });

    it("Should allow withdrawal of tips", async function () {
      await tipModule.connect(user1).tip(user2.address, { value: ethers.parseEther("1") });

      const balanceBefore = await ethers.provider.getBalance(user2.address);
      const tx = await tipModule.connect(user2).withdraw();
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;
      const balanceAfter = await ethers.provider.getBalance(user2.address);

      expect(balanceAfter - balanceBefore + gasUsed).to.equal(ethers.parseEther("1"));
      expect(await tipModule.pendingWithdrawals(user2.address)).to.equal(0);
    });

    it("Should prevent tipping yourself", async function () {
      await expect(tipModule.connect(user1).tip(user1.address, { value: MIN_TIP })).to.be.revertedWith(
        "Cannot tip yourself"
      );
    });
  });

  describe("State Calculation", function () {
    beforeEach(async function () {
      await flowNFT.connect(user1).mint();
      await flowNFT.connect(user2).mint();
      await flowNFT.connect(user3).mint();
    });

    it("Should start in Idle state", async function () {
      const stateLevel = await flowNFT.getStateLevel(user1.address);
      expect(stateLevel).to.equal(0); // IDLE
    });

    it("Should transition to Active state after 5 interactions", async function () {
      // 5 interactions to reach Active
      for (let i = 0; i < 5; i++) {
        await tipModule.connect(user2).tip(user1.address, { value: MIN_TIP });
      }

      const stateLevel = await flowNFT.getStateLevel(user1.address);
      expect(stateLevel).to.equal(1); // ACTIVE
    });

    it("Should transition to Burning state after 20 interactions", async function () {
      // 20 interactions to reach Burning
      for (let i = 0; i < 20; i++) {
        await tipModule.connect(user2).tip(user1.address, { value: MIN_TIP });
      }

      const stateLevel = await flowNFT.getStateLevel(user1.address);
      expect(stateLevel).to.equal(2); // BURNING
    });

    it("Should emit StateChanged event on level transition", async function () {
      // Go from Idle to Active
      for (let i = 0; i < 4; i++) {
        await tipModule.connect(user2).tip(user1.address, { value: MIN_TIP });
      }

      await expect(tipModule.connect(user2).tip(user1.address, { value: MIN_TIP }))
        .to.emit(flowNFT, "StateChanged")
        .withArgs(user1.address, 0, 1); // IDLE -> ACTIVE
    });
  });

  describe("Token URI", function () {
    it("Should return dynamic token URI with state", async function () {
      await flowNFT.connect(user1).mint();

      const uri = await flowNFT.tokenURI(1);
      expect(uri).to.include("data:application/json;base64,");

      // Decode and verify metadata
      const json = Buffer.from(uri.split(",")[1], "base64").toString();
      const metadata = JSON.parse(json);

      expect(metadata.name).to.equal("FlowNFT #1");
      expect(metadata.description).to.include("dynamic NFT");
      expect(metadata.attributes).to.be.an("array");
      expect(metadata.image).to.include("data:image/svg+xml;base64,");
    });
  });

  describe("Batch Operations", function () {
    beforeEach(async function () {
      await flowNFT.connect(user1).mint();
      await flowNFT.connect(user2).mint();
      await flowNFT.connect(user3).mint();
    });

    it("Should support batch liking", async function () {
      await activityTracker.connect(user1).batchLike([user2.address, user3.address]);

      expect(await activityTracker.hasLikedInEpoch(user1.address, user2.address)).to.be.true;
      expect(await activityTracker.hasLikedInEpoch(user1.address, user3.address)).to.be.true;
    });

    it("Should support batch tipping", async function () {
      const amounts = [MIN_TIP, MIN_TIP];
      const totalValue = MIN_TIP * BigInt(2);

      await tipModule.connect(user1).batchTip([user2.address, user3.address], amounts, { value: totalValue });

      expect(await tipModule.pendingWithdrawals(user2.address)).to.equal(MIN_TIP);
      expect(await tipModule.pendingWithdrawals(user3.address)).to.equal(MIN_TIP);
    });
  });
});
