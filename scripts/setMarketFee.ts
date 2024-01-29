
import { ethers, deployments } from "hardhat";
import { PAYMENT_TOKENS } from "../constants";

const setPaymentTokens = async () => {


    const [deployer] = await ethers.getSigners();

    const balanceNetwork = new ethers.Contract((await deployments.get("BalanceNetwork")).address, (await deployments.get("BalanceNetwork")).abi, deployer)

    const lending = new ethers.Contract((await deployments.get("BalanceNetworkLending")).address, (await deployments.get("BalanceNetworkLending")).abi, deployer)
  
    const tx = await balanceNetwork.changeFee(0)
    await tx.wait()

    console.log("BalanceNetwork fee changed to 0")


}

setPaymentTokens()