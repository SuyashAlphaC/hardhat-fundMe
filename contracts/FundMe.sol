//SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "./PriceConverter.sol";

error FundMe__notOwner();

contract FundMe {
    using PriceConverter for uint256;

    uint256 public constant MINIMUM_USD = 50 * 1e18;
    address public immutable i_owner;
    address[] public s_Funders;
    mapping(address => uint256) public s_AmountAtAddressFunded;

    AggregatorV3Interface private s_priceFeed;

    constructor(address priceFeedAddress) {
        i_owner = msg.sender;
        s_priceFeed = AggregatorV3Interface(priceFeedAddress);
    }

    modifier onlyOwner() {
        if (msg.sender != i_owner) {
            revert FundMe__notOwner();
        }
        _;
    }

    function fund() public payable {
        require(
            msg.value.getConversionRate(s_priceFeed) >= MINIMUM_USD,
            "You need to spend more ETH!!"
        );
        s_Funders.push(msg.sender);
        s_AmountAtAddressFunded[msg.sender] += msg.value;
    }

    function withdraw() public payable onlyOwner {
        for (
            uint256 funderIndex = 0;
            funderIndex < s_Funders.length;
            funderIndex++
        ) {
            address funder = s_Funders[funderIndex];
            s_AmountAtAddressFunded[funder] = 0;
        }

        s_Funders = new address[](0);

        (bool callSuccess, ) = payable(msg.sender).call{
            value: address(this).balance
        }("");
        require(callSuccess);
    }

    function getPriceFeed() public view returns (AggregatorV3Interface) {
        return s_priceFeed;
    }

    function getVersion() public view returns (uint256) {
        return s_priceFeed.version();
    }

    function getAmountAtAddressFunded(
        address Funder
    ) public view returns (uint256) {
        return s_AmountAtAddressFunded[Funder];
    }

    function getFunder(uint256 funderIndex) public view returns (address) {
        return s_Funders[funderIndex];
    }

    function getOwner() public view returns (address) {
        return i_owner;
    }
}
