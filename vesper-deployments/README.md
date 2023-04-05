# Vesper Deployments
This module helps in deploying Vesper pools, accountant, rewards and strategy contracts.

## Setup env
Below env vars are required for deployment. Add these in `.env` or export as env variables.
```env
NODE_URL
MNEMONIC
MAINNET_ETHERSCAN_API_KEY
```
## Deploy

Deployment will be done via custom `hardhat task deploy-core-contracts` which behind the scene uses deploy scripts created using `hardhat-deploy`
### Usage
* Help
   ```bash
   npx hardhat help deploy-core-contracts
   ```

* Deploy Vesper pool
  1. Add pool configuration in `vesper-commons/config/mainnet/poolConfig.js` file.
     - Some default config for setup and rewards are already defined at top of file, override them as needed.
     - Replace mainnet in `vesper-commons/config/mainnet/poolConfig.js` with arbitrum/avalanche/polygon as needed.

   Example configuration for `VDAI`
    ```js
     VDAI: {
      contractName: 'VPool',
      poolParams: ['vDAI Pool', 'vDAI', Address.DAI],
      setup: { ...setup },
      rewards: { ...rewards },
    },
    ```

  2. Run below command to deploy pool on localhost and mainnet as target chain
  ```bash
   npm run deploy -- --pool VDAI --network localhost --deploy-params '{"tags": "deploy-vPool"}'
  ```
  - To deploy pool on localhost and polygon as target chain, run below command 
  ```bash 
  npm run deploy -- --pool VDAI --network localhost --deploy-params '{"tags": "deploy-vPool"}' --target-chain polygon
  ```

* Deploy pool with release (preferred)
  - It will create `contracts.json` file at `/releases/5.0.0`
  ```bash
   npm run deploy -- --pool VDAI --network localhost --release 5.0.0 --deploy-params '{"tags": "deploy-vPool"}'
  ``` 

* Deploy strategy for already deployed pool
  1. Add strategy configuration in `vesper-commons/config/mainnet/strategyConfig.js` file.
   
   Example configuration for `Aave_V2_DAI`
   ```js
    Aave_V2_DAI: {
        contract: 'AaveV2',
        type: StrategyTypes.AAVE,
        constructorArgs: {
            swapper,
            receiptToken: Address.Aave.aDAI,
            strategyName: 'Aave_V2_DAI',
        },
        config: { ...config }, // Shallow copy
        setup: { ...setup },
    },
   ```
  2. Run below command to deploy `Aave_V2_DAI` for `VDAI` pool. `multisig-nonce` parameter is optional parameters to propose multisig transaction
  ```bash
  npm run deploy -- --pool VDAI --network localhost --release 5.0.0 --deploy-params '{"tags": "deploy-strategy"}' --strategy-name Aave_V2_DAI --multisig-nonce 0
  ```

* Migrate strategy
  ```bash
  npm run deploy -- --pool VDAI --network localhost --release 5.0.0 --deploy-params '{"tags": "migrate-strategy"}' --strategy-name Aave_V2_DAI
  ```
  Use `old-strategy-name` optional parameter if strategy name is changed.
  
* Pass any `hardhat-deploy` supported param within `deploy-params` object
  ```bash
   npm run deploy -- --pool VDAI --network localhost --release 5.0.0 --deploy-params '{"tags": "deploy-vPool", "gasprice": "25000000000"}'
  ```

* Deploy `upgrader` contracts 
  mandatory param `name`, supported values : `PoolAccountantUpgrader`, `PoolRewardsUpgrader`, `VPoolUpgrader`
  optional param `--target-chain`, values :  `polygon`, `mainnet`, `avalanche`, `arbitrium` 
  ```bash
  npm run deploy-upgrader -- --name PoolAccountantUpgrader --network localhost
  npm run deploy-upgrader -- --name PoolRewardsUpgrader --network localhost --target-chain polygon
  ```

## Verify

In order to verify deployed contract on etherscan we are using `hardhat verify` plugin.
> Env var `MAINNET_ETHERSCAN_API_KEY` is required.

**Usage**
```bash
npm run verify -- --network mainnet DEPLOYED_CONTRACT_ADDRESS ["CONSTRUCTOR_ARGS_IF_ANY"]
```