import hre from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PARTIAL = {
  SimpleERC20: "0xDa25f14fF57b391B927d55484642C83840E3eAAE",
  WEXToken: "0x5053541bB9Ea3c9477346B1d6533Ac2e2B71A3Af",
  SimpleNFT: "0xa2e1E5819D90C1e7DC7dc6e64984AEcb1a06d908",
  StakingPool: "0x1D43F9846DB63557eF860414304E0A892f3B221b",
  SimpleSwap: "0xaA00bA9Eb661e34a9806aD039F6384671A11350b",
};

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Completing deploy with:", deployer.address);

  const excToken = await hre.ethers.getContractAt("SimpleERC20", PARTIAL.SimpleERC20);
  const swapBalance = await excToken.balanceOf(PARTIAL.SimpleSwap);
  const swapEth = await deployer.provider.getBalance(PARTIAL.SimpleSwap);

  if (swapBalance === 0n) {
    const liquidity = hre.ethers.parseUnits("100000", 18);
    await (await excToken.transfer(PARTIAL.SimpleSwap, liquidity)).wait();
    console.log("Funded SimpleSwap with EXC");
  } else {
    console.log(`SimpleSwap already has ${hre.ethers.formatEther(swapBalance)} EXC`);
  }

  if (swapEth < hre.ethers.parseEther("0.005")) {
    const fundEth = hre.ethers.parseEther("0.02");
    await (await deployer.sendTransaction({ to: PARTIAL.SimpleSwap, value: fundEth })).wait();
    console.log("Funded SimpleSwap with 0.02 ETH");
  } else {
    console.log(`SimpleSwap already has ${hre.ethers.formatEther(swapEth)} ETH`);
  }

  const stakingBalance = await excToken.balanceOf(PARTIAL.StakingPool);
  const stakingTarget = hre.ethers.parseUnits("100000", 18);
  if (stakingBalance < stakingTarget) {
    const needed = stakingTarget - stakingBalance;
    await (await excToken.mint(PARTIAL.StakingPool, needed)).wait();
    console.log(`Minted ${hre.ethers.formatEther(needed)} EXC to StakingPool`);
  }

  const defaultSettlementLimit = hre.ethers.parseUnits("50000", 18);
  const BankPolicyRegistry = await hre.ethers.getContractFactory("BankPolicyRegistry");
  const bankPolicy = await BankPolicyRegistry.deploy(
    deployer.address,
    defaultSettlementLimit
  );
  await bankPolicy.waitForDeployment();
  const bankPolicyAddress = await bankPolicy.getAddress();
  console.log("BankPolicyRegistry:", bankPolicyAddress);

  const BankDepositToken = await hre.ethers.getContractFactory("BankDepositToken");
  const bankDeposit = await BankDepositToken.deploy(
    "Bank Demo USD",
    "BDUSD",
    deployer.address,
    bankPolicyAddress
  );
  await bankDeposit.waitForDeployment();
  const bankDepositAddress = await bankDeposit.getAddress();
  console.log("BankDepositToken:", bankDepositAddress);

  const bankPilotFloat = hre.ethers.parseUnits("1000000", 18);
  await (await bankDeposit.issue(deployer.address, bankPilotFloat, "INITIAL_SANDBOX_FLOAT")).wait();
  console.log("Issued initial BDUSD sandbox float");

  const deployments = {
    chainId: 11155111,
    network: "sepolia",
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    contracts: {
      ...PARTIAL,
      BankPolicyRegistry: bankPolicyAddress,
      BankDepositToken: bankDepositAddress,
    },
  };

  const outDir = path.join(__dirname, "..", "src", "config");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(
    path.join(outDir, "deployments.json"),
    JSON.stringify(deployments, null, 2)
  );
  console.log("\nSaved src/config/deployments.json");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
