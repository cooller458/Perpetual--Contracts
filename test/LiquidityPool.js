const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LiquidityPool Contract", function () {
    let LiquidityPool;
    let liquidityPool;
    let token;
    let owner;
    let user1;
    let user2;

    beforeEach(async function () {
        [owner, user1, user2] = await ethers.getSigners();

        const Token = await ethers.getContractFactory("MockToken");
        token = await Token.deploy("Test Token", "TST", 18);
        await token.deployed();
        await token.connect(owner).mint(owner.address, ethers.utils.parseUnits("20000000", 18));
        const ownerBalance = await token.balanceOf(owner.address);
        expect(ownerBalance).to.be.at.least(ethers.utils.parseUnits("20000000", 18));
        const userBalance = ethers.utils.parseUnits("1000", 18);
        await token.connect(owner).approve(user1.address, userBalance);
        await token.connect(owner).approve(user2.address, userBalance);
        await token.connect(owner).transfer(user1.address, userBalance);
        await token.connect(owner).transfer(user2.address, userBalance);
        LiquidityPool = await ethers.getContractFactory("LiquidityPool");
        liquidityPool = await LiquidityPool.deploy(token.address);
        await liquidityPool.deployed();
    });

    describe("deposit", function () {
        it("should allow a user to deposit tokens", async function () {
            const depositAmount = ethers.utils.parseUnits("1000", 18);
            await token.connect(user1).approve(liquidityPool.address, depositAmount);
            await liquidityPool.connect(user1).deposit(depositAmount);

            const balance = await liquidityPool.getLiquidityProviderBalance(user1.address);
            expect(balance).to.equal(depositAmount);
        });
    });


    describe("withdraw", function () {
        it("should allow a liquidity provider to withdraw tokens", async function () {
            const depositAmount = ethers.utils.parseUnits("1000", 18);
            await token.connect(user2).approve(liquidityPool.address, depositAmount);
            await liquidityPool.connect(user2).deposit(depositAmount);

            const withdrawAmount = ethers.utils.parseUnits("500", 18);
            await liquidityPool.connect(user2).withdraw(withdrawAmount);

            const balance = await liquidityPool.connect(user2).getLiquidityProviderBalance(user2.address);
            expect(balance).to.equal(depositAmount.sub(withdrawAmount));
        });

        it("should revert for non-liquidity providers", async function () {
            await expect(liquidityPool.connect(user1).withdraw(1)).to.be.revertedWithCustomError(liquidityPool, "LiquidityPool_CallerIsNotLiquidityProvider");
        });
        it("should amount bigger than liquidity amount", async function () {
            const depositAmount = ethers.utils.parseUnits("1000", 18);
            await token.connect(user2).approve(liquidityPool.address, depositAmount);
            await liquidityPool.connect(user2).deposit(depositAmount);

            const withdrawAmount = ethers.utils.parseUnits("1100", 18);
            await liquidityPool.connect(user2).withdraw(withdrawAmount);

        });
    });

    describe("borrow", function () {
        it("should allow a user to borrow tokens", async function () {
            const depositAmount = ethers.utils.parseEther("1000");
            await token.approve(liquidityPool.address, depositAmount);
            await liquidityPool.deposit(depositAmount);

            const borrowAmount = ethers.utils.parseEther("500");
            await liquidityPool.connect(user1).borrow(borrowAmount);

            const borrowerDebt = await liquidityPool.getBorrowerBalance(user1.address);
            expect(borrowerDebt).to.equal(borrowAmount);
        });

        it("should revert if borrowing more than available liquidity", async function () {
            const borrowAmount = ethers.utils.parseEther("500");
            await expect(liquidityPool.borrow(borrowAmount)).to.be.revertedWithCustomError(liquidityPool, "LiquidityPool_InsufficientLiquidity");
        });
    });

    describe("repay", function () {
        it("should allow a borrower to repay their debt", async function () {
            const depositAmount = ethers.utils.parseUnits("1000", 18);
            await token.connect(user2).approve(liquidityPool.address, depositAmount);
            await liquidityPool.connect(user2).deposit(depositAmount);

            const borrowAmount = ethers.utils.parseUnits("500", 18);
            await liquidityPool.connect(user1).borrow(borrowAmount);

            await token.connect(user1).approve(liquidityPool.address, borrowAmount);
            await liquidityPool.connect(user1).repay(borrowAmount);

            const borrowerDebt = await liquidityPool.getBorrowerBalance(user1.address);
            expect(borrowerDebt).to.equal(0);
        });

        it("should revert for non-borrowers", async function () {
            await expect(liquidityPool.connect(user2).repay(1)).to.be.revertedWithCustomError(liquidityPool, "LiquidityPool_CallerIsNotBorrower");
        });
    });

    describe("getDebt", function () {
        it("should return the correct debt of a borrower", async function () {
            const depositAmount = ethers.utils.parseUnits("1000", 18);
            await token.connect(user2).approve(liquidityPool.address, depositAmount);
            await liquidityPool.connect(user2).deposit(depositAmount);

            const borrowAmount = ethers.utils.parseUnits("500",18);
            await token.connect(user1).approve(liquidityPool.address, borrowAmount);
            await liquidityPool.connect(user1).borrow(borrowAmount);

            const debt = await liquidityPool.connect(user1).getDebt(user1.address);
            expect(debt).to.equal(borrowAmount);
        });
    });
});
