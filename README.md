# BalanceNetwork Multichain Contracts

## BalanceNetwork.sol
Marketplace contract for NFTs.

## BalanceNetworkLending.sol
Lending contract for NFTs.

## BalanceNetworkTreasury.sol
Treasury contract for BalanceNetwork. It is used to store the fees collected.

## Create3Factory.sol
Factory contract for Create3. It is used to deploy contracts by calculating the addresses first.

## TransparentProxy.sol
Transparent proxy contract. It is used to make the contracts upgradeable.



## Instructions

### Install dependencies
```
npx yarn install
```

### Compile contracts
```
npx hardhat compile
```

### Run tests
```
npx hardhat test --parallel
```

### Run coverage
```
npx hardhat coverage
```

### Deploy contracts
```
npx hardhat deploy --network <network>

```
### Deployed contracts
```
BalanceNetworkTreasury deployed to: 0x5d9bDaf916eb393D6D1F95Dc02D0d19a360298d8
Balance Network deployed to: 0x8CBF49A70272923f42195525A8d6386fB35FB340
BalanceNetwork set to: 0x8CBF49A70272923f42195525A8d6386fB35FB340 in treasury: 0x5d9bDaf916eb393D6D1F95Dc02D0d19a360298d8
BalanceNetworkLending deployed to: 0x76c9a319A8f12Ac3C10dAE02E60AC37684098e4C

```

### Deployed Mainnet Contracts

```

BalanceNetworkTreasury deployed to: 0x49B18eca7be319B7Db02Ef921a8f6d6DF0E7ad51
Balance Network deployed to: 0x5e0Bd88f340b9fd08f46ED96f35Fe959744D75B3
BalanceNetwork set to: 0x5e0Bd88f340b9fd08f46ED96f35Fe959744D75B3 in treasury: 0x49B18eca7be319B7Db02Ef921a8f6d6DF0E7ad51 

```