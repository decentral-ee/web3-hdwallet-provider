# web3-hdwallet-provider
HD Wallet-enabled Web3 provider. Use it to sign transactions for addresses derived from a 12-word mnemonic.

This is forked from truffle-hdwallet-provider, with the differences:

- web3 as external dependency, user injects its own provider
- main is `index.js` instead of `dist/index.js`
- `options` as a parameter
- additional option:
    - `noNonceTracking`, disable all sorts of nonce tracker all together
- hacks:
    - bypass `signTypedData` handling in `hookedSubprovider` in order to make signTypedData work

## Install

```
$ npm install web3-hdwallet-provider
```

## General Usage

You can use this provider wherever a Web3 provider is needed, not just in Truffle. For Truffle-specific usage, see next section.

```javascript
const Web3 = require("web3");
const Web3HDWalletProvider = require("web3-hdwallet-provider");
const mnemonic = "opinion destroy betray ..."; // 12 word mnemonic

var httpProvider = new Web3.providers.HttpProvider('"http://localhost:8545');

var provider = new Web3HDWalletProvider(mnemonic, httpProvider);
// Or, alternatively pass in a zero-based address index.
var provider = new Web3HDWalletProvider(mnemonic, httpProvider, 5);

```

By default, the `Web3HDWalletProvider` will use the address of the first address that's generated from the mnemonic. If you pass in a specific index, it'll use that address instead. Currently, the `HDWalletProvider` manages only one address at a time, but it can be easily upgraded to manage (i.e., "unlock") multiple addresses.

Parameters:

- `mnemonic`: `string`. 12 word mnemonic which addresses are created from.
- `provider_uri`: `string`. URI of Ethereum client to send all other non-transaction-related Web3 requests.
- `address_index`: `number`, optional. If specified, will tell the provider to manage the address at the index specified. Defaults to the first address (index `0`).

## Truffle Usage

You can easily use this within a Truffle configuration. For instance:

truffle.js
```javascript
const Web3 = require("web3");
const Web3HDWalletProvider = require("web3-hdwallet-provider");

var mnemonic = "opinion destroy betray ...";

module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*" // Match any network id
    },
    ropsten: {
      provider: () => new Web3HDWalletProvider(
        mnemonic,
        new Web3.providers.HttpProvider("https://ropsten.infura.io/")),
      network_id: 3
    }
  }
};
```
