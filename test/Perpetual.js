const { ethers } = require("hardhat");
const { expect, use } = require("chai");

describe("PerpSwap Contract", function () {
    let PerpSwap, perpSwap;
    let owner, user1, user2;
    let liquidityPoolMock, orderBookMock, tokenAMock, tokenBMock, rewardTokenMock;
    const PERIOD_LENGTH = 30 * 24 * 60 * 60;


    beforeEach(async function () {
        [owner, user1, user2] = await ethers.getSigners();

        // Mock tokenlar oluşturma
        const TokenMock = await ethers.getContractFactory("MockToken");
        tokenAMock = await TokenMock.deploy("Token A", "TKNA", 18);
        tokenBMock = await TokenMock.deploy("Token B", "TKNB", 18);
        rewardTokenMock = await TokenMock.deploy("Reward Token", "RWD", 18);

        // Mock LiquidityPool ve OrderBook sözleşmeleri oluşturma
        const LiquidityPoolMock = await ethers.getContractFactory("LiquidityPool");
        liquidityPoolMock = await LiquidityPoolMock.deploy(tokenAMock.address);
        const OrderBookMock = await ethers.getContractFactory("SimpleOrderBook");
        orderBookMock = await OrderBookMock.deploy();

        // PerpSwap sözleşmesini dağıtma
        PerpSwap = await ethers.getContractFactory("PerpSwap");
        perpSwap = await PerpSwap.deploy(
            liquidityPoolMock.address,
            orderBookMock.address,
            tokenAMock.address,
            tokenBMock.address,
            rewardTokenMock.address,
            ethers.utils.parseUnits("1", 18) // Örnek rewardPerSecond değeri
        );
        await tokenAMock.connect(owner).mint(owner.address, ethers.utils.parseUnits("2000000000", 18));
        await tokenBMock.connect(owner).mint(owner.address, ethers.utils.parseUnits("2000000000", 18));
        await rewardTokenMock.connect(owner).mint(owner.address, ethers.utils.parseUnits("2000000000", 18));
        const ownerBalanceBuy = await tokenBMock.balanceOf(owner.address);
        const ownerBalanceSell = await tokenAMock.balanceOf(owner.address);
        expect(ownerBalanceBuy).to.be.at.least(ethers.utils.parseUnits("20000000", 18));
        expect(ownerBalanceSell).to.be.at.least(ethers.utils.parseUnits("20000000", 18));
        await tokenAMock.connect(owner).approve(perpSwap.address, ethers.utils.parseUnits("5000000", 18));
        await tokenBMock.connect(owner).approve(perpSwap.address, ethers.utils.parseUnits("5000000", 18));
        await tokenBMock.connect(owner).approve(liquidityPoolMock.address, ethers.utils.parseUnits("5000000", 18));
        await tokenAMock.connect(owner).approve(liquidityPoolMock.address, ethers.utils.parseUnits("5000000", 18));
        await tokenAMock.connect(owner).approve(user1.address, ethers.utils.parseUnits("5000000", 18));
        await tokenBMock.connect(owner).approve(user1.address, ethers.utils.parseUnits("5000000", 18));
        await tokenAMock.connect(owner).approve(user2.address, ethers.utils.parseUnits("5000000", 18));
        await tokenBMock.connect(owner).approve(user2.address, ethers.utils.parseUnits("5000000", 18));
        await tokenAMock.connect(owner).transfer(perpSwap.address, ethers.utils.parseUnits("500000", 18));
        await tokenBMock.connect(owner).transfer(perpSwap.address, ethers.utils.parseUnits("500000", 18));
        await tokenAMock.connect(owner).transfer(user1.address, ethers.utils.parseUnits("50000", 18));
        await tokenBMock.connect(owner).transfer(user1.address, ethers.utils.parseUnits("50000", 18));
        await tokenAMock.connect(owner).transfer(user2.address, ethers.utils.parseUnits("50000", 18));
        await tokenBMock.connect(owner).transfer(user2.address, ethers.utils.parseUnits("50000", 18));
        await tokenBMock.connect(owner).transfer(liquidityPoolMock.address, ethers.utils.parseUnits("5000000", 18));
        await tokenAMock.connect(owner).transfer(liquidityPoolMock.address, ethers.utils.parseUnits("5000000", 18));
        await tokenAMock.connect(owner).approve(orderBookMock.address, ethers.utils.parseUnits("5000000", 18));
        await tokenBMock.connect(owner).approve(orderBookMock.address, ethers.utils.parseUnits("5000000", 18));
        await tokenAMock.connect(owner).transfer(orderBookMock.address, ethers.utils.parseUnits("500000", 18));
        await tokenBMock.connect(owner).transfer(orderBookMock.address, ethers.utils.parseUnits("500000", 18));
        await rewardTokenMock.connect(owner).approve(perpSwap.address, ethers.utils.parseUnits("50000000", 18));
        await rewardTokenMock.connect(owner).transfer(perpSwap.address, ethers.utils.parseUnits("50000000", 18));
        await rewardTokenMock.connect(owner).approve(user1.address, ethers.utils.parseUnits("5000000", 18));
        await rewardTokenMock.connect(owner).transfer(user1.address, ethers.utils.parseUnits("500000", 18));
    
    });

    describe("openLong", function () {
        it("should allow user to open a long position", async function () {
            const amountBToBuy = ethers.utils.parseUnits("1000", 18);
            const leverage = 2;
            const amountAToSell = amountBToBuy.mul(leverage);

            await tokenAMock.connect(user1).approve(perpSwap.address, amountAToSell);
            await tokenBMock.connect(user1).approve(perpSwap.address, amountBToBuy);

            await expect(perpSwap.connect(user1).openLong(amountBToBuy, leverage))
                .to.emit(perpSwap, "LongOpened");
            expect(await perpSwap.longBalanceB()).to.equal(amountBToBuy);
        });
    });
    describe("closeLong", function () {
        it("should allow user to close a long position", async function () {
            const amountBToBuy = ethers.utils.parseUnits("1000", 18);
            const leverage = 2;
            const amountAToSell = amountBToBuy.mul(leverage);
            await tokenAMock.connect(user1).approve(perpSwap.address, amountAToSell);
            await tokenBMock.connect(user1).approve(perpSwap.address, amountBToBuy);
            await perpSwap.connect(user1).openLong(amountBToBuy, leverage);

            await perpSwap.connect(user1).closeLong();
            expect(await perpSwap.longDebtA()).to.equal(ethers.utils.parseUnits("0", 18));
            expect(await perpSwap.longBalanceB()).to.equal(ethers.utils.parseUnits("0", 18));

        });
    });
    describe("openShort", function () {
        it("should allow user to open a short position", async function () {
            const amountBToSell = ethers.utils.parseUnits("1000", 18);
            const leverage = 2;
            const amountAToBuy = amountBToSell.mul(leverage);

            await tokenAMock.connect(user1).approve(perpSwap.address, amountAToBuy);
            await tokenBMock.connect(user1).approve(perpSwap.address, amountBToSell);

            await expect(perpSwap.connect(user1).openShort(amountBToSell, leverage))
                .to.emit(perpSwap, "ShortOpened");

            const shortBalance = await perpSwap.shortDebtA();
            expect(shortBalance).to.equal(amountAToBuy);
        });
    });
    describe("closeShort", function () {
        it("should allow user to close a short position", async function () {
            const amountBToSell = ethers.utils.parseUnits("1000", 18);
            const leverage = 2;
            const amountAToBuy = amountBToSell.mul(leverage);
            await tokenAMock.connect(user1).approve(perpSwap.address, amountAToBuy);
            await tokenBMock.connect(user1).approve(perpSwap.address, amountBToSell);
            await perpSwap.connect(user1).openShort(amountBToSell, leverage);

            await expect(perpSwap.connect(user1).closeShort())
                .to.emit(perpSwap, "ShortClosed");
            expect(await perpSwap.shortDebtA()).to.equal(ethers.utils.parseUnits("0", 18));
            expect(await perpSwap.shortBalanceB()).to.equal(ethers.utils.parseUnits("0", 18));
        });

    });
    describe("payReward", function () {
        it("should pay the calculated reward to the trader", async function () {
            // Test parametrelerini ayarlayın
            const rewardPerSecond = ethers.utils.parseUnits("1", 18);
            const trader = user1.address;
            const tradingVolume = ethers.utils.parseUnits("1000", 18);

            // Sözleşme ayarlarını başlatın
            await perpSwap.setRewardPerSecond(rewardPerSecond);
            await perpSwap.updateTradingVolume(trader, tradingVolume);

            // Ödül dönemi sona erene kadar zamanı ileri alın
            await network.provider.send("evm_increaseTime", [30 * 24 * 60 * 60]); // 30 gün
            await network.provider.send("evm_mine");

            // RewardToken bakiyesini başlatın
            const initialRewardBalance = await rewardTokenMock.balanceOf(trader);
            const initialContractBalance = await rewardTokenMock.balanceOf(perpSwap.address);
            const rewardAmount = await perpSwap.calculateReward(trader);


            await perpSwap.payReward(trader)

            // Ödülün doğru bir şekilde ödendiğini doğrulayın
            const finalRewardBalance = await rewardTokenMock.balanceOf(trader);
            console.log(ethers.utils.formatUnits(finalRewardBalance, 18));
            expect(finalRewardBalance).to.be.closeTo(initialRewardBalance.add(rewardAmount), ethers.utils.parseUnits("1", 18));

            // Sözleşme bakiyesinin azaldığını doğrulayın
            const finalContractBalance = await rewardTokenMock.balanceOf(perpSwap.address);
            console.log(ethers.utils.formatUnits(finalContractBalance, 18));
            expect(finalContractBalance).to.be.closeTo(initialContractBalance.sub(rewardAmount), ethers.utils.parseUnits("1", 18));
        });
        it("should trader is a owner", async function () {
            // Test parametrelerini ayarlayın
            const rewardPerSecond = ethers.utils.parseUnits("1", 18);
            const trader = owner.address;
            const tradingVolume = ethers.utils.parseUnits("1000", 18);

            // Sözleşme ayarlarını başlatın
            await perpSwap.setRewardPerSecond(rewardPerSecond);
            await perpSwap.updateTradingVolume(trader, tradingVolume);

            // Ödül dönemi sona erene kadar zamanı ileri alın
            await network.provider.send("evm_increaseTime", [30 * 24 * 60 * 60]); // 30 gün
            await network.provider.send("evm_mine");

            // RewardToken bakiyesini başlatın
            const initialRewardBalance = await rewardTokenMock.balanceOf(trader);
            const initialContractBalance = await rewardTokenMock.balanceOf(perpSwap.address);
            const rewardAmount = await perpSwap.calculateReward(trader);


            await perpSwap.payReward(trader)

            // Ödülün doğru bir şekilde ödendiğini doğrulayın
            const finalRewardBalance = await rewardTokenMock.balanceOf(trader);
            console.log(ethers.utils.formatUnits(finalRewardBalance, 18));
            expect(finalRewardBalance).to.be.closeTo(initialRewardBalance.add(rewardAmount), ethers.utils.parseUnits("1", 18));

            // Sözleşme bakiyesinin azaldığını doğrulayın
            const finalContractBalance = await rewardTokenMock.balanceOf(perpSwap.address);
            console.log(ethers.utils.formatUnits(finalContractBalance, 18));
            expect(finalContractBalance).to.be.closeTo(initialContractBalance.sub(rewardAmount), ethers.utils.parseUnits("1", 18));
        });
    });
    describe("calculateReward", function () {
        it("should correctly calculate the reward for a trader", async function () {
            const initialMarketVolume = ethers.utils.parseUnits("10000", 18);
            const traderVolume = ethers.utils.parseUnits("100", 18);
            const rewardPerSecond = ethers.utils.parseUnits("1", 18);
            await perpSwap.updateCumulativeMarketVolume(ethers.utils.parseUnits("10000", 18));
            await perpSwap.updateTradingVolume(user1.address, traderVolume);
            const expectedReward = traderVolume.mul(rewardPerSecond.mul(PERIOD_LENGTH)).div(initialMarketVolume);

            const actualReward = await perpSwap.calculateReward(user1.address);
        });
    });

    describe("updateTradingVolume", function() {
        it("should reset trading volumes and update timestamp when period limit is reached", async function(){
            const amount = ethers.utils.parseUnits("100", 18);

            await network.provider.send("evm_increaseTime", [PERIOD_LENGTH + 1]);
            await network.provider.send("evm_mine");
    
            await perpSwap.connect(owner).updateTradingVolume(user1.address, amount);

        });
        it("should increase trading volumes when period limit is not reached", async function () {
            const amount = ethers.utils.parseUnits("100", 18);
    
            await perpSwap.connect(owner).updateTradingVolume(user1.address, amount);

        });
    });


});