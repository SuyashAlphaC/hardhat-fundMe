const { ethers } = require("hardhat");
const { getNamedAccounts, deployments } = require("hardhat");
const { assert, expect } = require("chai");
const { developmentChains } = require("../../helper-hardhat-config");

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("FundMe", function () {
      let fundMe, mockV3Aggregator, deployer;
      const sendValue = ethers.utils.parseEther("1");
      beforeEach(async function () {
        deployer = (await getNamedAccounts()).deployer;
        await deployments.fixture(["all"]);
        fundMe = await ethers.getContract("FundMe", deployer);
        mockV3Aggregator = await ethers.getContract(
          "MockV3Aggregator",
          deployer
        );
      });

      describe("Constructor", function () {
        it("Sets the Aggregator Value Correctly", async function () {
          const response = await fundMe.getPriceFeed();
          assert.equal(response, mockV3Aggregator.address);
        });
      });

      describe("Fund", function () {
        it("Fails if not spent enough ETH", async function () {
          expect(fundMe.fund()).to.be.revertedWith(
            "You need to spend more ETH!!"
          );
        });

        it("Should add the funder in the address data structure", async function () {
          await fundMe.fund({ value: sendValue });
          const response = await fundMe.getAmountAtAddressFunded(deployer);
          assert.equal(response.toString(), sendValue);
        });

        it("Should update the funder array", async function () {
          await fundMe.fund({ value: sendValue });
          const funder = await fundMe.getFunder(0);
          expect(funder).to.equal(deployer);
        });
      });

      describe("Withdraw", function () {
        beforeEach(async function () {
          await fundMe.fund({ value: sendValue });
        });

        it("Should be able to withdraw from a single funder", async function () {
          const startingFundMeBalance = await ethers.provider.getBalance(
            fundMe.address
          );
          const startingDeployerBalance = await ethers.provider.getBalance(
            deployer
          );

          const transactionResponse = await fundMe.withdraw();
          const transactionReceipt = await transactionResponse.wait(1);
          const { gasUsed, effectiveGasPrice } = transactionReceipt;
          const gasCost = gasUsed.mul(effectiveGasPrice);

          const endingFundMeBalance = await ethers.provider.getBalance(
            fundMe.address
          );
          const endingDeployerBalance = await ethers.provider.getBalance(
            deployer
          );

          assert.equal(endingFundMeBalance, 0);
          assert.equal(
            startingDeployerBalance.add(startingFundMeBalance).toString(),
            endingDeployerBalance.add(gasCost).toString()
          );
        });

        it("Should be able to withdraw from multiple funders", async function () {
          const accounts = await ethers.getSigners();

          for (let i = 1; i < 6; i++) {
            const fundMeConnectContract = await fundMe.connect(accounts[i]);
            await fundMeConnectContract.fund({ value: sendValue });
          }
          const startingFundMeBalance = await ethers.provider.getBalance(
            fundMe.address
          );
          const startingDeployerBalance = await ethers.provider.getBalance(
            deployer
          );

          const transactionResponse = await fundMe.withdraw();
          const transactionReceipt = await transactionResponse.wait(1);
          const { gasUsed, effectiveGasPrice } = transactionReceipt;
          const gasCost = gasUsed.mul(effectiveGasPrice);

          const endingFundMeBalance = await ethers.provider.getBalance(
            fundMe.address
          );
          const endingDeployerBalance = await ethers.provider.getBalance(
            deployer
          );

          assert.equal(endingFundMeBalance, 0);
          assert.equal(
            startingDeployerBalance.add(startingFundMeBalance).toString(),
            endingDeployerBalance.add(gasCost).toString()
          );

          await expect(fundMe.getFunder(0)).to.be.reverted;

          for (i = 1; i < 6; i++) {
            assert.equal(
              await fundMe.getAmountAtAddressFunded(accounts[i].address),
              0
            );
          }
        });

        it("Only Owner can withdraw", async function () {
          const accounts = await ethers.getSigners();
          const attacker = accounts[1];

          const attackerConnectContract = await fundMe.connect(attacker);
          await expect(attackerConnectContract.withdraw()).to.be.revertedWith(
            "FundMe__notOwner"
          );
        });
      });
    });
