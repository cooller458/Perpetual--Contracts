const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SimpleOrderBook Contract", function () {
  let owner, user1, user2;
  let simpleOrderBook;
  let sellToken, buyToken;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("MockToken");
    sellToken = await Token.deploy("SellToken", "ST", 18);
    buyToken = await Token.deploy("BuyToken", "BT", 18);
    reserve = await Token.deploy("Reserve", "RSV", 18);
    await sellToken.deployed();
    await buyToken.deployed();
    await reserve.deployed();
    await sellToken.connect(owner).mint(owner.address, ethers.utils.parseUnits("2000000000", 18));
    await buyToken.connect(owner).mint(owner.address, ethers.utils.parseUnits("2000000000", 18));
    const ownerBalanceBuy = await buyToken.balanceOf(owner.address);
    const ownerBalanceSell = await sellToken.balanceOf(owner.address);
    expect(ownerBalanceBuy).to.be.at.least(ethers.utils.parseUnits("20000000", 18));
    expect(ownerBalanceSell).to.be.at.least(ethers.utils.parseUnits("20000000", 18));
    const SimpleOrderBook = await ethers.getContractFactory("SimpleOrderBook");
    simpleOrderBook = await SimpleOrderBook.deploy();
    await simpleOrderBook.deployed();
    await sellToken.connect(owner).approve(simpleOrderBook.address,ethers.utils.parseUnits("500000", 18));
    await buyToken.connect(owner).approve(simpleOrderBook.address,ethers.utils.parseUnits("500000", 18));
    await sellToken.connect(owner).approve(user1.address,ethers.utils.parseUnits("50000", 18));
    await buyToken.connect(owner).approve(user1.address,ethers.utils.parseUnits("50000", 18));
    await sellToken.connect(owner).approve(user2.address,ethers.utils.parseUnits("50000", 18));
    await buyToken.connect(owner).approve(user2.address,ethers.utils.parseUnits("50000", 18));
    await sellToken.connect(owner).transfer(simpleOrderBook.address, ethers.utils.parseUnits("500000", 18));
    await buyToken.connect(owner).transfer(simpleOrderBook.address, ethers.utils.parseUnits("500000", 18));
    await sellToken.connect(owner).transfer(user1.address, ethers.utils.parseUnits("50000", 18));
    await buyToken.connect(owner).transfer(user1.address, ethers.utils.parseUnits("50000", 18));
    await sellToken.connect(owner).transfer(user2.address, ethers.utils.parseUnits("50000", 18));
    await buyToken.connect(owner).transfer(user2.address, ethers.utils.parseUnits("50000", 18));

    

    
  });

  describe("calcAmountToSell", function () {
    it("should calculate the correct amount to sell", async function () {
      const buyAmount = ethers.utils.parseUnits("1000", 18);
      const sellAmount = await simpleOrderBook.calcAmountToSell(sellToken.address, buyToken.address, buyAmount);

      const reserveA = await sellToken.balanceOf(simpleOrderBook.address);
      const reserveB = await buyToken.balanceOf(simpleOrderBook.address);

      const expectedSellAmount = reserveA.mul(buyAmount).div(reserveB.sub(buyAmount)); 
      expect(sellAmount).to.equal(expectedSellAmount);
    });
    it("should Insufficient reserve for buy amount", async function () {
      const buyAmount = ethers.utils.parseUnits("100000000000", 18);
      await expect(simpleOrderBook.calcAmountToSell(sellToken.address, buyToken.address, buyAmount)).to.be.revertedWith("Insufficient reserve for buy amount");
      
      });
  });

  describe("calcAmountToBuy", function () {
    it("should calculate the correct amount to buy", async function () {
        const sellAmount = ethers.utils.parseUnits("1000", 18);

        const reserveA = await sellToken.balanceOf(simpleOrderBook.address);
        const reserveB = await buyToken.balanceOf(simpleOrderBook.address);

        const expectedBuyAmount = reserveB.mul(sellAmount).div(reserveA.add(sellAmount));

        const buyAmount = await simpleOrderBook.calcAmountToBuy(sellToken.address, buyToken.address, sellAmount);

        expect(buyAmount).to.equal(expectedBuyAmount);
    });
    describe("calcAmountToBuy", function () {
      it("should revert with 'Invalid sell amount or reserve' if there is no sell token reserve", async function () {
        const sellAmount = ethers.utils.parseUnits("0", 18);
    
        await expect(simpleOrderBook.calcAmountToBuy(reserve.address, buyToken.address, sellAmount))
          .to.be.revertedWith("Invalid sell amount or reserve");
      });
    });
  });


  describe("buy", function () {
    it("should allow a user to buy tokens", async function () {
        const buyAmount = ethers.utils.parseUnits("1000", 18);
        const initialUserBuyTokenBalance = await buyToken.balanceOf(user1.address);
        const initialContractSellTokenBalance = await sellToken.balanceOf(simpleOrderBook.address);

        const soldAmount = await simpleOrderBook.calcAmountToSell(sellToken.address, buyToken.address, buyAmount);
        await sellToken.connect(user1).approve(simpleOrderBook.address, soldAmount);
        await simpleOrderBook.connect(user1).buy(sellToken.address, buyToken.address, buyAmount);
    
        const finalUserBuyTokenBalance = await buyToken.balanceOf(user1.address);

        expect(finalUserBuyTokenBalance).to.be.closeTo(initialUserBuyTokenBalance.add(buyAmount),ethers.utils.parseUnits("1", 18));
    
        const finalContractSellTokenBalance = await sellToken.balanceOf(simpleOrderBook.address);
        expect(finalContractSellTokenBalance).to.be.closeTo(initialContractSellTokenBalance.sub(soldAmount),ethers.utils.parseUnits("10000", 18) );
    });
  });

  describe("sell", function () {
    it("should allow a user to sell tokens", async function () {
        const sellAmount = ethers.utils.parseUnits("1000", 18);
        const initialUserSellTokenBalance = await sellToken.balanceOf(user1.address);
        const initialContractBuyTokenBalance = await buyToken.balanceOf(simpleOrderBook.address);
    
        await sellToken.connect(user1).approve(simpleOrderBook.address, sellAmount);
        await simpleOrderBook.connect(user1).sell(sellToken.address, buyToken.address, sellAmount);

        const finalUserSellTokenBalance = await sellToken.balanceOf(user1.address);
        expect(finalUserSellTokenBalance).to.equal(initialUserSellTokenBalance.sub(sellAmount));

        const finalContractBuyTokenBalance = await buyToken.balanceOf(simpleOrderBook.address);
        const boughtAmount = await simpleOrderBook.calcAmountToBuy(sellToken.address, buyToken.address, sellAmount);
        expect(finalContractBuyTokenBalance).to.be.closeTo(initialContractBuyTokenBalance.add(boughtAmount),ethers.utils.parseUnits("10000", 18));
    });
  });
});
