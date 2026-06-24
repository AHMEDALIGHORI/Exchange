import SimpleERC20Artifact from '../abis/SimpleERC20.json'
import SimpleNFTArtifact from '../abis/SimpleNFT.json'
import SimpleStorageArtifact from '../abis/SimpleStorage.json'
import MultiSigWalletArtifact from '../abis/MultiSigWallet.json'
import StakingPoolArtifact from '../abis/StakingPool.json'
import SimpleSwapArtifact from '../abis/SimpleSwap.json'
import BankPolicyRegistryArtifact from '../abis/BankPolicyRegistry.json'
import BankDepositTokenArtifact from '../abis/BankDepositToken.json'

export const abis = {
  SimpleERC20: SimpleERC20Artifact.abi,
  SimpleNFT: SimpleNFTArtifact.abi,
  SimpleStorage: SimpleStorageArtifact.abi,
  MultiSigWallet: MultiSigWalletArtifact.abi,
  StakingPool: StakingPoolArtifact.abi,
  SimpleSwap: SimpleSwapArtifact.abi,
  BankPolicyRegistry: BankPolicyRegistryArtifact.abi,
  BankDepositToken: BankDepositTokenArtifact.abi,
}

export const bytecodes = {
  SimpleERC20: SimpleERC20Artifact.bytecode,
  SimpleStorage: SimpleStorageArtifact.bytecode,
  MultiSigWallet: MultiSigWalletArtifact.bytecode,
  BankPolicyRegistry: BankPolicyRegistryArtifact.bytecode,
  BankDepositToken: BankDepositTokenArtifact.bytecode,
}

export { SimpleERC20Artifact, SimpleNFTArtifact, SimpleStorageArtifact, MultiSigWalletArtifact, StakingPoolArtifact, SimpleSwapArtifact, BankPolicyRegistryArtifact, BankDepositTokenArtifact }
