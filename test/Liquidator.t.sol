// SPDX-License-Identifier: UNLICENSED
pragma solidity =0.6.6;
// TODO: is there a way to run tests using a different version?

import "forge-std/Test.sol";
import "../src/Liquidator.sol";

contract ContractTest is Test {

    Liquidator private liquidator;

        address private UNIV2_FACTORY = 0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f;
        address private HOLDING_MANAGER = 0x0;
        // address _USDC
    function setUp() public {
        liquidator = new Liquidator();
    }

    function testExample() public {
        assertTrue(true);
    }
}
