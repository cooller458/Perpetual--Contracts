import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, ethers } = hre;
    const { deploy } = deployments;

    const [deployer] = await ethers.getSigners();

    const mockTokenA = await deploy('MockTokenA', {
        contract: 'MockToken',
        from: deployer.address,
        args: ["MockTokenA", "MTKA", 18],
        log: true,
    });

    const mockTokenB = await deploy('MockTokenB', {
        contract: 'MockToken',
        from: deployer.address,
        args: ["MockTokenB", "MTKB", 18],
        log: true,
    });

    const rewardToken = await deploy('RewardToken', {
        contract: 'MockToken',
        from: deployer.address,
        args: ["RewardToken", "RTKN", 18],
        log: true,
    });

    const liquidityPool = await deploy('LiquidityPool', {
        contract: "LiquidityPool",
        from: deployer.address,
        args: [mockTokenA.address],
        log: true,
    });

    const simpleOrderBook = await deploy('SimpleOrderBook', {
        contract: "SimpleOrderBook",
        from: deployer.address,
        log: true,
    });
    

    // PerpSwap sözleşmesini dağıt
    await deploy('PerpSwap', {
        contract: 'PerpSwap', // Sözleşme adı
        from: deployer.address,
        args: [
            liquidityPool.address, // ILiquidityPool adresi
            simpleOrderBook.address,     // ISimpleOrderBook adresi
            mockTokenA.address,        // IERC20 Token A adresi
            mockTokenB.address,        // IERC20 Token B adresi
            rewardToken.address,   // Ödül token adresi
            ethers.utils.parseUnits('0.1', 'ether') // Saniye başına ödül miktarı
        ],
        log: true,
    });
};
export default func;
