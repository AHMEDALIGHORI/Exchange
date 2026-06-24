// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MultiSigWallet {
    event Deposit(address indexed sender, uint256 amount);
    event SubmitTransaction(address indexed owner, uint256 indexed txId, address indexed to, uint256 value, bytes data);
    event ConfirmTransaction(address indexed owner, uint256 indexed txId);
    event ExecuteTransaction(address indexed owner, uint256 indexed txId);

    struct Transaction {
        address to;
        uint256 value;
        bytes data;
        bool executed;
        uint256 numConfirmations;
    }

    address[] public owners;
    mapping(address => bool) public isOwner;
    uint256 public required;

    Transaction[] public transactions;
    mapping(uint256 => mapping(address => bool)) public confirmations;

    modifier onlyOwner() {
        require(isOwner[msg.sender], "Not owner");
        _;
    }

    modifier txExists(uint256 txId) {
        require(txId < transactions.length, "Tx does not exist");
        _;
    }

    modifier notExecuted(uint256 txId) {
        require(!transactions[txId].executed, "Already executed");
        _;
    }

    modifier notConfirmed(uint256 txId) {
        require(!confirmations[txId][msg.sender], "Already confirmed");
        _;
    }

    constructor(address[] memory owners_, uint256 required_) {
        require(owners_.length > 0 && required_ > 0 && required_ <= owners_.length, "Invalid params");
        for (uint256 i = 0; i < owners_.length; i++) {
            address owner = owners_[i];
            require(owner != address(0) && !isOwner[owner], "Invalid owner");
            isOwner[owner] = true;
            owners.push(owner);
        }
        required = required_;
    }

    receive() external payable {
        emit Deposit(msg.sender, msg.value);
    }

    function submitTransaction(address to, uint256 value, bytes memory data) public onlyOwner returns (uint256) {
        uint256 txId = transactions.length;
        transactions.push(Transaction({
            to: to,
            value: value,
            data: data,
            executed: false,
            numConfirmations: 0
        }));
        emit SubmitTransaction(msg.sender, txId, to, value, data);
        confirmTransaction(txId);
        return txId;
    }

    function confirmTransaction(uint256 txId) public onlyOwner txExists(txId) notExecuted(txId) notConfirmed(txId) {
        Transaction storage txn = transactions[txId];
        confirmations[txId][msg.sender] = true;
        txn.numConfirmations++;
        emit ConfirmTransaction(msg.sender, txId);
        if (txn.numConfirmations >= required) {
            executeTransaction(txId);
        }
    }

    function executeTransaction(uint256 txId) public onlyOwner txExists(txId) notExecuted(txId) {
        Transaction storage txn = transactions[txId];
        require(txn.numConfirmations >= required, "Not enough confirmations");
        txn.executed = true;
        (bool success, ) = txn.to.call{value: txn.value}(txn.data);
        require(success, "Tx failed");
        emit ExecuteTransaction(msg.sender, txId);
    }

    function getTransactionCount() public view returns (uint256) {
        return transactions.length;
    }

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }
}
