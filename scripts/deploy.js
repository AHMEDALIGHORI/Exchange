import hre from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  if (!process.env.SEPOLIA_RPC_URL || !process.env.DEPLOYER_PRIVATE_KEY) {
    throw new Error(
      "Missing SEPOLIA_RPC_URL or DEPLOYER_PRIVATE_KEY in .env. Add both, fund the deployer with Sepolia ETH, then rerun npm run deploy:sepolia."
    );
  }

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const excSupply = hre.ethers.parseUnits("1000000", 18);
  const SimpleERC20 = await hre.ethers.getContractFactory("SimpleERC20");
  const excToken = await SimpleERC20.deploy("ExChange Token", "EXC", 18, excSupply, deployer.address);
  await excToken.waitForDeployment();
  const excAddress = await excToken.getAddress();
  console.log("EXC Token:", excAddress);

  const wexToken = await SimpleERC20.deploy("Wrapped EXC", "WEX", 18, excSupply, deployer.address);
  await wexToken.waitForDeployment();
  const wexAddress = await wexToken.getAddress();
  console.log("WEX Token:", wexAddress);

  const SimpleNFT = await hre.ethers.getContractFactory("SimpleNFT");
  const nft = await SimpleNFT.deploy("ExChange NFT", "EXNFT");
  await nft.waitForDeployment();
  const nftAddress = await nft.getAddress();
  console.log("SimpleNFT:", nftAddress);

  const StakingPool = await hre.ethers.getContractFactory("StakingPool");
  const staking = await StakingPool.deploy(excAddress);
  await staking.waitForDeployment();
  const stakingAddress = await staking.getAddress();
  console.log("StakingPool:", stakingAddress);

  const tokensPerEth = hre.ethers.parseUnits("1000", 18);
  const SimpleSwap = await hre.ethers.getContractFactory("SimpleSwap");
  const swap = await SimpleSwap.deploy(excAddress, tokensPerEth);
  await swap.waitForDeployment();
  const swapAddress = await swap.getAddress();
  console.log("SimpleSwap:", swapAddress);

  const liquidity = hre.ethers.parseUnits("500000", 18);
  const balance = await deployer.provider.getBalance(deployer.address);
  const swapEthTarget = hre.ethers.parseEther("0.02");
  const gasReserve = hre.ethers.parseEther("0.015");
  const swapEth =
    balance > swapEthTarget + gasReserve ? swapEthTarget : balance / 4n;

  await (await excToken.transfer(swapAddress, liquidity)).wait();
  await (await deployer.sendTransaction({ to: swapAddress, value: swapEth })).wait();
  console.log(`Funded SimpleSwap with EXC + ${hre.ethers.formatEther(swapEth)} ETH`);

  const stakingFund = hre.ethers.parseUnits("100000", 18);
  await (await excToken.transfer(stakingAddress, stakingFund)).wait();
  console.log("Funded StakingPool reserve (for future rewards demos)");

  const defaultSettlementLimit = hre.ethers.parseUnits("50000", 18);
  const BankPolicyRegistry = await hre.ethers.getContractFactory("BankPolicyRegistry");
  const bankPolicy = await BankPolicyRegistry.deploy(deployer.address, defaultSettlementLimit);
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
      SimpleERC20: excAddress,
      WEXToken: wexAddress,
      SimpleNFT: nftAddress,
      StakingPool: stakingAddress,
      SimpleSwap: swapAddress,
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
  console.log("\nAdd to .env:");
  console.log(`VITE_EXC_TOKEN_ADDRESS=${excAddress}`);
  console.log(`VITE_WEX_TOKEN_ADDRESS=${wexAddress}`);
  console.log(`VITE_SIMPLE_NFT_ADDRESS=${nftAddress}`);
  console.log(`VITE_STAKING_POOL_ADDRESS=${stakingAddress}`);
  console.log(`VITE_SIMPLE_SWAP_ADDRESS=${swapAddress}`);
  console.log(`VITE_BANK_POLICY_REGISTRY_ADDRESS=${bankPolicyAddress}`);
  console.log(`VITE_BANK_DEPOSIT_TOKEN_ADDRESS=${bankDepositAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
