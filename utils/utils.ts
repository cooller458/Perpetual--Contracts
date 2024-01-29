import { ParamType } from "ethers/lib/utils";
import { ethers } from "hardhat";

export const getCreationCode = async ({
    contractName,
    constructorArgs,
}: {
    contractName: string;
    constructorArgs: { types: string[] | ParamType[]; values: any[] };
}): Promise<string> => {

    const bytecode = (await ethers.getContractFactory(contractName)).bytecode

    return `${bytecode}${ethers.utils.defaultAbiCoder.encode(constructorArgs.types, constructorArgs.values).slice(2)}`;
}

