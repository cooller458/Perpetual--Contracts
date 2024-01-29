import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, ethers } = hre;
    const { deploy } = deployments;

    const [deployer] = await ethers.getSigners();


    await deploy('MockToken', {
        contract: 'MockToken',
        from: deployer.address,
        args: ["MockToken", "MTKN", 18],
        log: true,
    });

    const mockToken = await deployments.get("MockToken")

    await deploy('LiquidityPool', {
        contract: "LiquidityPool",
        from: deployer.address,
        args: [mockToken.address],
        log: true,
    });
};
export default func;
