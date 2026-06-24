// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @notice Fixed-rate ETH <-> ERC20 swap for testnet demos.
contract SimpleSwap {
    using SafeERC20 for IERC20;

    IERC20 public immutable token;
    uint256 public immutable tokensPerEth;

    event SwappedEthForToken(address indexed user, uint256 ethIn, uint256 tokenOut);
    event SwappedTokenForEth(address indexed user, uint256 tokenIn, uint256 ethOut);

    constructor(address token_, uint256 tokensPerEth_) {
        require(token_ != address(0), "Invalid token");
        require(tokensPerEth_ > 0, "Invalid rate");
        token = IERC20(token_);
        tokensPerEth = tokensPerEth_;
    }

    function swapEthForTokens() external payable {
        require(msg.value > 0, "ETH required");
        uint256 tokenOut = (msg.value * tokensPerEth) / 1 ether;
        require(token.balanceOf(address(this)) >= tokenOut, "Insufficient liquidity");
        token.safeTransfer(msg.sender, tokenOut);
        emit SwappedEthForToken(msg.sender, msg.value, tokenOut);
    }

    function swapTokensForEth(uint256 tokenIn) external {
        require(tokenIn > 0, "Token amount required");
        uint256 ethOut = (tokenIn * 1 ether) / tokensPerEth;
        require(address(this).balance >= ethOut, "Insufficient ETH liquidity");
        token.safeTransferFrom(msg.sender, address(this), tokenIn);
        (bool ok, ) = payable(msg.sender).call{value: ethOut}("");
        require(ok, "ETH transfer failed");
        emit SwappedTokenForEth(msg.sender, tokenIn, ethOut);
    }

    function getQuoteEthForTokens(uint256 ethIn) external view returns (uint256) {
        return (ethIn * tokensPerEth) / 1 ether;
    }

    function getQuoteTokensForEth(uint256 tokenIn) external view returns (uint256) {
        return (tokenIn * 1 ether) / tokensPerEth;
    }

    receive() external payable {}
}
