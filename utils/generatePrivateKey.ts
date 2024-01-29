
import { ethers } from 'ethers'
import fs from 'fs/promises'
import * as bip39 from 'bip39'

const generatePrivateKey = async () => {

    const mnemonic = bip39.generateMnemonic(256)

    const wallet = ethers.Wallet.fromMnemonic(mnemonic)

    const data = {
        address: wallet.address,
        privateKey: wallet.privateKey,
        mnemonic: wallet.mnemonic
    }

    console.log(data)
    await fs.writeFile(`./generated/${data.address}.json`, JSON.stringify(data))
}

generatePrivateKey()