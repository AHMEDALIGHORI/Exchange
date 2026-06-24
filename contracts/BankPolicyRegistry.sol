// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/// @notice Demo compliance registry for permissioned institutional settlement.
contract BankPolicyRegistry is Ownable {
    mapping(address => bool) public approved;
    mapping(address => bool) public blocked;
    mapping(address => uint256) public transferLimits;
    mapping(address => string) public complianceReference;

    uint256 public defaultTransferLimit;

    event WalletApprovalChanged(address indexed account, bool approved, string auditRef);
    event WalletBlockChanged(address indexed account, bool blocked, string reason);
    event TransferLimitChanged(address indexed account, uint256 amount);
    event DefaultTransferLimitChanged(uint256 amount);

    constructor(address owner_, uint256 defaultTransferLimit_) Ownable(owner_) {
        require(owner_ != address(0), "Invalid owner");
        defaultTransferLimit = defaultTransferLimit_;
        approved[owner_] = true;
        complianceReference[owner_] = "BANK_ADMIN";
        emit WalletApprovalChanged(owner_, true, "BANK_ADMIN");
    }

    function setApproved(address account, bool value, string calldata auditRef) external onlyOwner {
        require(account != address(0), "Invalid account");
        approved[account] = value;
        complianceReference[account] = auditRef;
        if (value) {
            blocked[account] = false;
        }
        emit WalletApprovalChanged(account, value, auditRef);
    }

    function setBlocked(address account, bool value, string calldata reason) external onlyOwner {
        require(account != address(0), "Invalid account");
        blocked[account] = value;
        emit WalletBlockChanged(account, value, reason);
    }

    function setTransferLimit(address account, uint256 amount) external onlyOwner {
        require(account != address(0), "Invalid account");
        transferLimits[account] = amount;
        emit TransferLimitChanged(account, amount);
    }

    function setDefaultTransferLimit(uint256 amount) external onlyOwner {
        defaultTransferLimit = amount;
        emit DefaultTransferLimitChanged(amount);
    }

    function effectiveTransferLimit(address account) public view returns (uint256) {
        uint256 customLimit = transferLimits[account];
        return customLimit == 0 ? defaultTransferLimit : customLimit;
    }

    function canTransfer(address from, address to, uint256 amount) external view returns (bool, string memory) {
        if (blocked[from]) return (false, "SENDER_BLOCKED");
        if (blocked[to]) return (false, "RECIPIENT_BLOCKED");
        if (!approved[from]) return (false, "SENDER_NOT_APPROVED");
        if (!approved[to]) return (false, "RECIPIENT_NOT_APPROVED");

        uint256 limit = effectiveTransferLimit(from);
        if (limit > 0 && amount > limit) return (false, "TRANSFER_LIMIT_EXCEEDED");

        return (true, "APPROVED");
    }
}
