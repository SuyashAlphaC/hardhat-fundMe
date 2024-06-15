require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require("dotenv").config();
require("hardhat-deploy");
require("hardhat-gas-reporter");
require("solidity-coverage");

const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL;
const COINMARKETKEY_API_KEY = process.env.COINMARKETKEY_API_KEY;
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
const PRIVATE_KEY = process.env.PRIVATE_KEY;

/** @type import('hardhat/config').HardhatUserConfig */

module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      chainId: 31337,
    },
    sepolia: {
      url: SEPOLIA_RPC_URL,
      chainId: 11155111,
      accounts: [PRIVATE_KEY],
      blockConfirmation: 6,
    },
  },
  solidity: {
    compilers: [{ version: "0.8.7" }, { version: "0.6.6" }],
  },
  gasReporter: {
    enabled: true,
    token: "MATIC",
    outputFile: "gas-report.txt",
    noColors: true,
    currency: "USD",
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
    customChains: [], // uncomment this line if you are getting a TypeError: customChains is not iterable
  },
  namedAccounts: {
    deployer: {
      default: 0,
      1: 0,
    },
  },
};
