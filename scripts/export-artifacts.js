import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const artifactsDir = path.join(root, "artifacts", "contracts");
const outDir = path.join(root, "src", "abis");

const CONTRACTS = [
  "SimpleERC20",
  "SimpleNFT",
  "SimpleStorage",
  "MultiSigWallet",
  "StakingPool",
  "SimpleSwap",
  "BankPolicyRegistry",
  "BankDepositToken",
];

fs.mkdirSync(outDir, { recursive: true });

for (const name of CONTRACTS) {
  const artifactPath = path.join(artifactsDir, `${name}.sol`, `${name}.json`);
  if (!fs.existsSync(artifactPath)) {
    console.warn(`Skipping ${name}: artifact not found (run hardhat compile first)`);
    continue;
  }
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  fs.writeFileSync(
    path.join(outDir, `${name}.json`),
    JSON.stringify({ abi: artifact.abi, bytecode: artifact.bytecode }, null, 2)
  );
  console.log(`Exported ${name}.json`);
}
