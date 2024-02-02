// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.23;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

import "./interfaces/ILiquidityPool.sol";
import "./interfaces/ISimpleOrderBook.sol";

contract PerpSwap is Ownable {
    using SafeERC20 for IERC20;

    ILiquidityPool liquidityPool;
    ISimpleOrderBook orderBook;

    IERC20 tokenA;
    IERC20 tokenB;
    IERC20 rewardToken;

    uint256 private _cumulativeMarketVolume;
    uint256 private _periodStartTimestamp;
    uint256 private _rewardPerSecond;
    uint256 private constant PERIOD_LENGTH = 30 days;

    uint256 public longDebtA;
    uint256 public longBalanceB;

    uint256 public shortDebtA;
    uint256 public shortBalanceB;

    error MarginTrading__InsufficientAmountForClosePosition();

    mapping(address => uint256) private _cumulativeTradingVolume;

    event LongOpened();
    event LongClosed();
    event ShortOpened();
    event ShortClosed();
    event RewardPaid(address indexed trader, uint256 reward);
    event uptadeCumulativeMarketVolume(uint256 newVolume);
    event updateRewardPerSecond(uint256 rewardAmount);
    event updateTradingvolume(address trader, uint256 amount);


    constructor(
        address _liquidityPool,
        address _orderBook,
        address _tokenA,
        address _tokenB,
        address _rewardToken,
        uint256 _rewardPerSecond
    ) {
        liquidityPool = ILiquidityPool(_liquidityPool);
        orderBook = ISimpleOrderBook(_orderBook);
        tokenA = IERC20(_tokenA);
        tokenB = IERC20(_tokenB);
        rewardToken = IERC20(_rewardToken);
        _rewardPerSecond = _rewardPerSecond;
        _periodStartTimestamp = block.timestamp;
    }

    function openLong(uint256 amountBToBuy, uint256 leverage) external {
        require(amountBToBuy > 0, "Amount to buy must be greater than zero");
        require(leverage >= 1, "Leverage must be greater than or equal to 1");
        uint256 amountAToSell = orderBook.calcAmountToSell(
            address(tokenA),
            address(tokenB),
            amountBToBuy * leverage
        );

        liquidityPool.borrow(amountAToSell);

        longDebtA += amountAToSell;
        longBalanceB += amountBToBuy;

        _updateTradingVolume(msg.sender, amountBToBuy * leverage);

        tokenA.approve(address(orderBook), amountAToSell);
        orderBook.buy(address(tokenA), address(tokenB), amountBToBuy);

        emit LongOpened();
    }



    function closeLong() external {
        tokenB.approve(address(orderBook), longBalanceB);

        tokenA.approve(address(liquidityPool), longDebtA);
        liquidityPool.repay(longDebtA);

        longDebtA = 0;
        longBalanceB = 0;

        _updateTradingVolume(msg.sender, longBalanceB);

        uint256 freeTokenA = tokenA.balanceOf(address(this));
        tokenA.safeTransfer(owner(), freeTokenA);

        emit LongClosed();
    }

    function openShort(uint256 amountAToSell, uint leverage) external {
        require(amountAToSell > 0, "Amount to sell must be greater than zero");
        require(leverage >= 1, "Leverage must be greater than or equal to 1");
        liquidityPool.borrow(amountAToSell * leverage);

        shortDebtA += amountAToSell * leverage;

        tokenA.approve(address(orderBook), amountAToSell * leverage);
        shortBalanceB += orderBook.sell(
            address(tokenA),
            address(tokenB),
            amountAToSell * leverage
        );

        _updateTradingVolume(msg.sender, amountAToSell * leverage);

        emit ShortOpened();
    }

    function closeShort() external {
        tokenB.approve(address(orderBook), shortBalanceB);
        tokenA.approve(address(liquidityPool), shortDebtA);
        liquidityPool.repay(shortDebtA);

        shortDebtA = 0;
        shortBalanceB = 0;

        _updateTradingVolume(msg.sender, shortBalanceB);

        uint256 freeTokenB = tokenB.balanceOf(address(this));
        tokenB.safeTransfer(owner(), freeTokenB);

        emit ShortClosed();
    }

    function calculateReward(address trader) public view returns (uint256) {
        require(_cumulativeMarketVolume > 0, "Market volume is zero");
        uint256 timeElapsed = block.timestamp - _periodStartTimestamp;
        uint256 rewardForThePeriod = _rewardPerSecond * timeElapsed;
        uint256 traderVolume = _cumulativeTradingVolume[trader];

        uint256 traderShare = traderVolume / _cumulativeMarketVolume;
        return traderShare * rewardForThePeriod; 
    }

    // Ödül ödemesi için fonksiyon
    function payReward(address trader) external {
        require(
            block.timestamp >= _periodStartTimestamp + PERIOD_LENGTH,
            "Reward period has not ended yet"
        );

        uint256 reward = calculateReward(trader);
        require(reward > 0, "No reward for this period");
        uint256 volume = _cumulativeTradingVolume[trader];

        _cumulativeTradingVolume[trader] = 0;
        if (trader == owner()) {
            _cumulativeMarketVolume = 0;
        }

        rewardToken.safeTransfer(trader, reward);

        emit RewardPaid(trader, reward);
    }

    function _updateTradingVolume(address trader, uint256 amount) private {
        _cumulativeTradingVolume[trader] += amount;
        _cumulativeMarketVolume += amount;

        if (block.timestamp > _periodStartTimestamp + PERIOD_LENGTH) {
            _periodStartTimestamp = block.timestamp;
            _cumulativeTradingVolume[trader] = 0;
            _cumulativeMarketVolume = 0;
        } else {
            _cumulativeTradingVolume[trader] += amount;
            _cumulativeMarketVolume += amount;
        }
    }

    function updateTradingVolume(
        address trader,
        uint256 amount
    ) public onlyOwner {
        _updateTradingVolume(trader, amount);
        emit updateTradingvolume(trader, amount);
    }

    function setRewardPerSecond(
        uint256 rewardAmount
    ) public onlyOwner returns (uint256) {
        _rewardPerSecond = rewardAmount;
        emit updateRewardPerSecond(rewardAmount);
        return _rewardPerSecond;
    }

    function updateCumulativeMarketVolume(
        uint256 newVolume
    ) external onlyOwner returns(uint256) {
        _cumulativeMarketVolume = newVolume;
        emit uptadeCumulativeMarketVolume(newVolume);
        return newVolume;
    }
}
