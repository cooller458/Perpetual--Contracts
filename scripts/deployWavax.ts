
import { ethers } from "hardhat";

const deploy = async () => {

    const [deployer] = await ethers.getSigners();
    console.log('Deploying contracts with the account:', deployer.address);

    const Wavax = await ethers.getContractFactory('WAVAX');
    const wavax = await Wavax.deploy();
    await wavax.deployed();

    console.log('WAVAX address:', wavax.address);


}

deploy()