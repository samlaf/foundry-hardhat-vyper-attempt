import { expect } from "chai";
import { ethers } from "hardhat";
import "../scripts/deploy_test_setup";

const UNIV2_FACTORY = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

describe("Liquidator", function () {
  it("just a test", async function () {
  }),
  it("Constructor should not return an error", async function () {
    console.log(3)
    const Liquidator = await ethers.getContractFactory("Liquidator");
    // const liquidator = await Liquidator.deploy(UNIV2_FACTORY, );
    // await liquidator.deployed();

    // expect(await liquidator.name()).to.equal("Token");
  });
});