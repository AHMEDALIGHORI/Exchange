// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SimpleStorage {
    uint256 private storedData = 100;

    event ValueChanged(address indexed author, uint256 newValue);

    function set(uint256 x) public {
        storedData = x;
        emit ValueChanged(msg.sender, x);
    }

    function get() public view returns (uint256) {
        return storedData;
    }
}
