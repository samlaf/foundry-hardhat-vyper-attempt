pragma solidity =0.6.6;

import "uniswap/v2-core/contracts/interfaces/IUniswapV2Callee.sol";

import "uniswap/v2-periphery/contracts/libraries/UniswapV2Library.sol";
import "uniswap/v2-periphery/contracts/interfaces/V1/IUniswapV1Factory.sol";
import "uniswap/v2-periphery/contracts/interfaces/V1/IUniswapV1Exchange.sol";
import "uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router01.sol";
import "uniswap/v2-periphery/contracts/interfaces/IERC20.sol";
import "uniswap/v2-periphery/contracts/interfaces/IWETH.sol";

// TODO (we assume for now that collateral is USDC. We can generalize later)
// 1. flashswap some USDC (potentially from WETH/USDC pool)
// 2. deposit the USDC into a holding
// 3. mint some pUSD against the deposited USDC
// 4. liquidate liquidatable holding using minted pUSD (this recovers some USDC)
// 5. repay the USDC to the univ2 pool

contract Liquidator is IUniswapV2Callee {
    address immutable univ2_factory;
    address immutable holding_manager;
    IERC20 immutable USDC;

    constructor(
        address _univ2_factory,
        address _holding_manager,
        address _USDC
    ) public {
        univ2_factory = _univ2_factory;
        holding_manager = _holding_manager;
        USDC = _USDC;
    }

    // gets tokens/WETH via a V2 flash swap, swaps for the ETH/tokens on V1, repays V2, and keeps the rest!
    function uniswapV2Call(
        address sender,
        uint256 amount0,
        uint256 amount1,
        bytes calldata data
    ) external override {
        address[] memory path = new address[](2);
        uint256 amountToken;
        uint256 amountETH;
        {
            // scope for token{0,1}, avoids stack too deep errors
            address token0 = IUniswapV2Pair(msg.sender).token0();
            address token1 = IUniswapV2Pair(msg.sender).token1();
            assert(
                msg.sender ==
                    UniswapV2Library.pairFor(univ2_factory, token0, token1)
            ); // ensure that msg.sender is actually a V2 pair
            assert(amount0 == 0 || amount1 == 0); // this strategy is unidirectional
            path[0] = amount0 == 0 ? token0 : token1;
            path[1] = amount0 == 0 ? token1 : token0;
            amountToken = token0 == address(WETH) ? amount1 : amount0;
            amountETH = token0 == address(WETH) ? amount0 : amount1;
        }
    }
}
