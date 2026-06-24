// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

interface IBankPolicyRegistry {
    function canTransfer(address from, address to, uint256 amount) external view returns (bool, string memory);
}

/// @notice Permissioned tokenized deposit demo for regulated settlement pilots.
contract BankDepositToken is ERC20, Ownable, Pausable {
    IBankPolicyRegistry public policyRegistry;

    event PolicyRegistryChanged(address indexed registry);
    event DepositIssued(address indexed to, uint256 amount, string auditRef);
    event DepositRedeemed(address indexed from, uint256 amount, string auditRef);

    constructor(
        string memory name_,
        string memory symbol_,
        address owner_,
        address policyRegistry_
    ) ERC20(name_, symbol_) Ownable(owner_) {
        require(owner_ != address(0), "Invalid owner");
        require(policyRegistry_ != address(0), "Invalid registry");
        policyRegistry = IBankPolicyRegistry(policyRegistry_);
    }

    function setPolicyRegistry(address policyRegistry_) external onlyOwner {
        require(policyRegistry_ != address(0), "Invalid registry");
        policyRegistry = IBankPolicyRegistry(policyRegistry_);
        emit PolicyRegistryChanged(policyRegistry_);
    }

    function issue(address to, uint256 amount, string calldata auditRef) external onlyOwner {
        require(to != address(0), "Invalid recipient");
        _mint(to, amount);
        emit DepositIssued(to, amount, auditRef);
    }

    function redeem(address from, uint256 amount, string calldata auditRef) external onlyOwner {
        require(from != address(0), "Invalid account");
        _burn(from, amount);
        emit DepositRedeemed(from, amount, auditRef);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function _update(address from, address to, uint256 amount) internal override whenNotPaused {
        if (from != address(0) && to != address(0)) {
            (bool allowed, string memory reason) = policyRegistry.canTransfer(from, to, amount);
            require(allowed, reason);
        }
        super._update(from, to, amount);
    }
}
