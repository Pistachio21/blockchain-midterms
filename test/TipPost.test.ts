import { expect } from "chai";
import { ethers } from "hardhat";
import { TipPost } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

// Import chai matchers for hardhat
import "@nomicfoundation/hardhat-chai-matchers";

describe("TipPost", function () {
  let tipPost: TipPost;
  let owner: HardhatEthersSigner;
  let user1: HardhatEthersSigner;
  let user2: HardhatEthersSigner;

  beforeEach(async function () {
    const TipPostFactory = await ethers.getContractFactory("TipPost");
    tipPost = await TipPostFactory.deploy();
    await tipPost.waitForDeployment();

    [owner, user1, user2] = await ethers.getSigners();
  });

  it("should create a post and emit PostCreated event", async function () {
    await expect(tipPost.connect(user1).createPost("http://example.com/img.jpg", "Test caption"))
      .to.emit(tipPost, "PostCreated")
      .withArgs(1, user1.address, "http://example.com/img.jpg", "Test caption");

    const posts = await tipPost.getAllPosts();
    expect(posts.length).to.equal(1);
    expect(posts[0].id).to.equal(1);
    expect(posts[0].creator).to.equal(user1.address);
    expect(posts[0].imageUrl).to.equal("http://example.com/img.jpg");
    expect(posts[0].caption).to.equal("Test caption");
    expect(posts[0].likes).to.equal(0);
    expect(posts[0].totalEarned).to.equal(0);
  });

  it("should allow liking a post and transfer ETH", async function () {
    await tipPost.connect(user1).createPost("img", "cap");

    const initialBalance = await ethers.provider.getBalance(user1.address);

    await expect(tipPost.connect(user2).likePost(1, { value: ethers.parseEther("0.0001") }))
      .to.emit(tipPost, "PostLiked")
      .withArgs(1, user2.address);

    const posts = await tipPost.getAllPosts();
    expect(posts[0].likes).to.equal(1);
    expect(posts[0].totalEarned).to.equal(ethers.parseEther("0.0001"));

    const finalBalance = await ethers.provider.getBalance(user1.address);
    expect(finalBalance).to.be.gt(initialBalance); // Should have received the tip
  });

  it("should reject double liking", async function () {
    await tipPost.connect(user1).createPost("img", "cap");
    await tipPost.connect(user2).likePost(1, { value: ethers.parseEther("0.0001") });

    await expect(
      tipPost.connect(user2).likePost(1, { value: ethers.parseEther("0.0001") })
    ).to.be.revertedWith("Already liked this post");
  });

  it("should reject self-liking", async function () {
    await tipPost.connect(user1).createPost("img", "cap");

    await expect(
      tipPost.connect(user1).likePost(1, { value: ethers.parseEther("0.0001") })
    ).to.be.revertedWith("Cannot like your own post");
  });
});