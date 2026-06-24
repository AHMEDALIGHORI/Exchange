import { expect } from "chai";
import hre from "hardhat";

const { ethers } = hre;

describe("Bank settlement pilot", function () {
  async function deployFixture() {
    const [admin, sender, recipient, blocked, outsider] = await ethers.getSigners();
    const limit = ethers.parseUnits("1000", 18);

    const Registry = await ethers.getContractFactory("BankPolicyRegistry");
    const registry = await Registry.deploy(admin.address, limit);

    const Token = await ethers.getContractFactory("BankDepositToken");
    const token = await Token.deploy("Bank Demo USD", "BDUSD", admin.address, await registry.getAddress());

    await registry.setApproved(sender.address, true, "KYB-SENDER");
    await registry.setApproved(recipient.address, true, "KYB-RECIPIENT");
    await registry.setApproved(blocked.address, true, "KYB-BLOCKED");
    await registry.setBlocked(blocked.address, true, "SANCTIONS_SCREENING_HIT");

    await token.issue(sender.address, ethers.parseUnits("5000", 18), "TEST_FLOAT");

    return { registry, token, admin, sender, recipient, blocked, outsider, limit };
  }

  it("allows transfers between approved counterparties under the limit", async function () {
    const { token, sender, recipient } = await deployFixture();
    const amount = ethers.parseUnits("250", 18);

    await expect(token.connect(sender).transfer(recipient.address, amount))
      .to.changeTokenBalances(token, [sender, recipient], [-amount, amount]);
  });

  it("allows the bank admin to issue and redeem tokenized deposits", async function () {
    const { token, admin, recipient } = await deployFixture();
    const amount = ethers.parseUnits("750", 18);

    await expect(token.issue(recipient.address, amount, "ISSUE-TEST"))
      .to.changeTokenBalance(token, recipient, amount);

    await expect(token.redeem(recipient.address, amount, "REDEEM-TEST"))
      .to.changeTokenBalance(token, recipient, -amount);

    expect(await token.owner()).to.equal(admin.address);
  });

  it("blocks transfers to unapproved wallets", async function () {
    const { token, sender, outsider } = await deployFixture();

    await expect(
      token.connect(sender).transfer(outsider.address, ethers.parseUnits("100", 18))
    ).to.be.revertedWith("RECIPIENT_NOT_APPROVED");
  });

  it("blocks transfers involving blocked wallets", async function () {
    const { token, sender, blocked } = await deployFixture();

    await expect(
      token.connect(sender).transfer(blocked.address, ethers.parseUnits("100", 18))
    ).to.be.revertedWith("RECIPIENT_BLOCKED");
  });

  it("blocks transfers over the sender limit", async function () {
    const { token, sender, recipient, limit } = await deployFixture();

    await expect(
      token.connect(sender).transfer(recipient.address, limit + 1n)
    ).to.be.revertedWith("TRANSFER_LIMIT_EXCEEDED");
  });

  it("pauses token movement during compliance review", async function () {
    const { token, sender, recipient } = await deployFixture();

    await token.pause();
    await expect(
      token.connect(sender).transfer(recipient.address, ethers.parseUnits("100", 18))
    ).to.be.revertedWithCustomError(token, "EnforcedPause");
  });
});
