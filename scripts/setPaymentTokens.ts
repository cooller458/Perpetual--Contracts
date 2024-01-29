
import { ethers, deployments } from "hardhat";
import { PAYMENT_TOKENS } from "../constants";

const setPaymentTokens = async () => {


    const [deployer] = await ethers.getSigners();

    const balanceNetwork = new ethers.Contract((await deployments.get("BalanceNetwork")).address, (await deployments.get("BalanceNetwork")).abi, deployer)

    const lending = new ethers.Contract((await deployments.get("BalanceNetworkLending")).address, (await deployments.get("BalanceNetworkLending")).abi, deployer)

    const network = await ethers.provider.getNetwork()

    const chainId = network.chainId.toString()

    const paymentTokens = PAYMENT_TOKENS[chainId as keyof typeof PAYMENT_TOKENS]

    if (!paymentTokens) {
        throw new Error(`No payment tokens for chainId ${chainId}`)
    }

    console.log(`Setting payment tokens for chainId ${chainId} to ${paymentTokens}`)

    const owner = await balanceNetwork.owner()

    console.log(`Owner is ${owner}`)
    

}

setPaymentTokens()