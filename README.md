# Vesper Contracts

This repo contains Vesper core, pools and strategies contracts.

## Setup

1. Install

   ```sh
   git clone https://github.com/vesperfi/vesper-contracts.git
   cd vesper-contracts
   nvm use
   npm install
   ```
2. set NODE_URL in env
    ```sh
    export NODE_URL=<eth mainnet url>
    ```
3. Compile

   ```sh
   npm run compile
   ```
4. Test

Note: These tests will fork the mainnet as required in step 3. It is not recommended to run all tests at once, but rather to specify a single file.

  - Run single test file from vesper-strategies package
   ```sh
   npm test -- --scope vesper-strategies -- test/mainnet/compound-xy/vesper/vaeth.spec.js 
   ```

  - Or run all tests from vesper-strategies package
   ```sh
   npm test -- --scope vesper-strategies test
   ```
  - Change scope in above command to run pool tests

### Lerna tricks

#### Run NPM scripts

To run an NPM script, i.e. `npm run`, for a single package, use `--scope`:

```sh
npm run lerna run -- --scope vesper-pools test
```

#### Install internal packages

Running `npm i <package-name>` on projects where `package-name` is any package listed in `lerna.json` or placed under `packages/` directory.
Instead run:

```sh
npm run lerna add <package-name> [package-path]
```

This will update the package's `package.json` and `package-lock.json` files and create the required symlinks automatically.

If no `package-path` is provided, the package will be installed in all the other packages.
For more usage information run `npm run lerna add -- --help`.