import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";
import { IERC20 } from "../typechain";
const { deploy_basic_contracts } = require("../lib/pandora_protocol/test/utils/basic_contracts");
const impersonateAccount = require("../lib/pandora_protocol/test/utils/impersonate_account");
const { EMPTY_BYTES } = require("../lib/pandora_protocol/constants");
const { writeAddresses } = require("./utils");
// Also deploy a strategy??

const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const BINANCE_WALLET_ADDRESS = "0x28C6c06298d514Db089934071355E5743bf21d60";

// TODO: probably should add stablecoin address as param, to be able to deploy contracts
//       for dai, usdt, etc.
async function deployNeccessaryPandoraContracts(owner: SignerWithAddress) {
  const shareRegistryData = ethers.utils.defaultAbiCoder.encode(
    ["uint", "uint", "uint"],
    [
      "50000", //collateralization ratio 50%
      "110000", //liquidation multiplier; around 12% - 1198 at 10000; the smaller the value, the higher the fee taken
      "0", //"500", //borrow opening fee
    ]
  );
  // We deploy the test setup because it deploys a mock oracle (SampleOracle.sol)
  // which we can use to manipulate the price feed and cause liquidations during tests
  const [
    Manager,
    ManagerContainer,
    StrategyManagerContract,
    HoldingManagerContract,
    DexManagerContract,
    ProtocolTokenContract,
    SampleOracleContract,
    PandoraMoneyContract,
    StablesManagerContract,
    UsdcSharesRegistryContract,
  ] = await deploy_basic_contracts(
    owner,
    USDC_ADDRESS,
    shareRegistryData,
    EMPTY_BYTES
  );

  // Deploy the yearn strategy for USDC.
  // not sure why this isn't done as part of deploy_basic_contracts...
  //deploy yearn
  const UsdcYearnVault = await ethers.getContractAt(
    "IYearnVault",
    "0xa354f35829ae975e850e23e9615b11da1b3dc4de"
  );
  const tokenFactory = await ethers.getContractFactory("ReceiptToken");
  const YearnReceiptToken = await tokenFactory
    .connect(owner)
    .deploy("ReceiptTokenY", "RY");
  const YearnStrategyFactory = await ethers.getContractFactory(
    "YearnStablecoin"
  );
  const YearnUsdcStrategyContract = await YearnStrategyFactory.connect(owner).deploy(
    UsdcYearnVault.address,
    ManagerContainer.address,
    YearnReceiptToken.address
  );
  await YearnReceiptToken.set_minter(YearnUsdcStrategyContract.address);

  // Whitelist token and strategy
  await Manager.connect(owner).whitelistToken(USDC_ADDRESS);
  await StrategyManagerContract.connect(owner).addStrategy(
    YearnUsdcStrategyContract.address
  );

  return {
    SampleOracleContract,
    HoldingManagerContract,
    StrategyManagerContract,
    StablesManagerContract,
    UsdcSharesRegistryContract,
    PandoraMoneyContract,
    YearnUsdcStrategyContract,
  };
}

async function getFundedSigners(usdc: IERC20, usdcDepositAmount: number) {
  // Do we need to stop the impersonation?
  await impersonateAccount(BINANCE_WALLET_ADDRESS);
  const binanceWallet = await ethers.getSigner(BINANCE_WALLET_ADDRESS);
  const [owner, liquidatedUser, liquidator] = await ethers.getSigners();

  for (const signer of [owner, liquidatedUser, liquidator]) {
    await usdc
      .connect(binanceWallet)
      .transfer(signer.address, usdcDepositAmount);
  }
  return {
    owner,
    liquidatedUser,
    liquidator,
  };
}

async function deploy() {
  // get needed accounts and fund them
  const usdcDepositAmount = 10_000_000_000;
  // deposit a lot of usdc so that liquidator doesn't get liquidated
  const liquidatorUsdcDepositAmount = usdcDepositAmount * 1000;
  const usdc = await ethers.getContractAt("IERC20", USDC_ADDRESS);
  const { owner, liquidatedUser, liquidator } = await getFundedSigners(
    usdc,
    liquidatorUsdcDepositAmount // we fund more for the liquidator
  );

  // Maybe we want to write the contract addresses to some tmp file so that the liquidation bot
  // can use them
  const {
    HoldingManagerContract,
    StablesManagerContract,
    StrategyManagerContract,
    SampleOracleContract,
    UsdcSharesRegistryContract,
    PandoraMoneyContract,
    YearnUsdcStrategyContract,
  } = await deployNeccessaryPandoraContracts(owner);

  const addresses = {
    HoldingManager: HoldingManagerContract.address,
    StablesManager: StablesManagerContract.address,
    StrategyManager: StrategyManagerContract.address,
    SampleOracle: SampleOracleContract.address,
    UsdcSharesRegistry: UsdcSharesRegistryContract.address,
    PandoraMoney: PandoraMoneyContract.address,
    YearnUsdcStrategy: YearnUsdcStrategyContract.address,
  };
  console.log(addresses);
  writeAddresses(addresses);

  // Create a holding, deposit usdc collateral, and borrow pUSD against it
  await HoldingManagerContract.connect(liquidatedUser).createHoldingForMyself();
  await usdc
    .connect(liquidatedUser)
    .approve(HoldingManagerContract.address, usdcDepositAmount);
  await HoldingManagerContract.connect(liquidatedUser).deposit(
    USDC_ADDRESS,
    usdcDepositAmount
  );
  const usdcBorrowAmount = usdcDepositAmount / 2; // max is 50% (set in shareRegistryData above)
  await HoldingManagerContract.connect(liquidatedUser).borrow(
    USDC_ADDRESS,
    usdcBorrowAmount,
    true
  );
  // invest half of usdc in yearn strategy
  await StrategyManagerContract.connect(liquidatedUser).invest(
    USDC_ADDRESS,
    YearnUsdcStrategyContract.address,
    usdcDepositAmount / 2,
    EMPTY_BYTES
  );
  // liquidator needs pUSD to repay loans (eventually this should be done with flashloan though..)
  // only way I found to mint pUSD for the test liquidator is to borrow it
  await HoldingManagerContract.connect(liquidator).createHoldingForMyself();
  await usdc
    .connect(liquidator)
    .approve(HoldingManagerContract.address, liquidatorUsdcDepositAmount);
  await HoldingManagerContract.connect(liquidator).deposit(
    USDC_ADDRESS,
    liquidatorUsdcDepositAmount
  );
  await HoldingManagerContract.connect(liquidator).borrow(
    USDC_ADDRESS,
    usdcBorrowAmount * 10, // liquidator will be able to perform 10 liquidations
    true
  );
}

deploy()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
