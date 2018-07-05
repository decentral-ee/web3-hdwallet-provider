const debug = require("debug");
const logger = {
    info: debug("web3-hdwallet:info"),
    warn: debug("web3-hdwallet:warn"),
    error: debug("web3-hdwallet:error")
};
const bip39 = require("bip39");
const hdkey = require("ethereumjs-wallet/hdkey");
const ProviderEngine = require("web3-provider-engine");
const CacheSubprovider = require('web3-provider-engine/subproviders/cache.js');
const FiltersSubprovider = require("web3-provider-engine/subproviders/filters.js");
const NonceSubprovider = require('web3-provider-engine/subproviders/nonce-tracker.js');
const VmSubprovider = require('web3-provider-engine/subproviders/vm.js');
const HookedWalletSubprovider = require("web3-provider-engine/subproviders/hooked-wallet.js");
const ProviderSubprovider = require("web3-provider-engine/subproviders/provider.js");
const Transaction = require("ethereumjs-tx");
const ethUtil = require("ethereumjs-util");

function Web3HDWalletProvider(provider, mnemonic, address_index = 0, num_addresses = 1) {
    this.started = false;
    this.mnemonic = mnemonic;
    this.hdwallet = hdkey.fromMasterSeed(bip39.mnemonicToSeed(mnemonic));
    this.wallet_hdpath = "m/44'/60'/0'/0/";
    this.wallets = {};
    this.addresses = [];

    for (let i = address_index; i < address_index + num_addresses; i++) {
        var wallet = this.hdwallet.derivePath(this.wallet_hdpath + i).getWallet();
        var addr = "0x" + wallet.getAddress().toString("hex");
        this.addresses.push(addr);
        this.wallets[addr] = wallet;
    }

    const tmp_accounts = this.addresses;
    const tmp_wallets = this.wallets;

    this.engine = new ProviderEngine();
    //this.engine.addProvider(new CacheSubprovider());
    this.engine.addProvider(new FiltersSubprovider());
    //this.engine.addProvider(new NonceSubprovider());
    //this.engine.addProvider(new VmSubprovider());
    this.engine.addProvider(
        new HookedWalletSubprovider({
            getAccounts: function(cb) {
                cb(null, tmp_accounts);
            },
            getPrivateKey: function(address, cb) {
                if (!tmp_wallets[address]) {
                    return cb("Account not found");
                } else {
                    cb(null, tmp_wallets[address].getPrivateKey().toString("hex"));
                }
            },
            signTransaction: function(txParams, cb) {
                let pkey;
                if (tmp_wallets[txParams.from]) {
                    pkey = tmp_wallets[txParams.from].getPrivateKey();
                } else {
                    cb("Account not found");
                }
                var tx = new Transaction(txParams);
                tx.sign(pkey);
                var rawTx = "0x" + tx.serialize().toString("hex");
                cb(null, rawTx);
            },
            signMessage: function(message, cb) {
                const dataIfExists = message.data;
                if (!dataIfExists) {
                    cb("No data to sign");
                }
                if (!tmp_wallets[message.from]) {
                    cb("Account not found");
                }
                let pkey = tmp_wallets[message.from].getPrivateKey();
                var dataBuff = ethUtil.toBuffer(dataIfExists);
                var msgHashBuff = ethUtil.hashPersonalMessage(dataBuff);
                var sig = ethUtil.ecsign(msgHashBuff, pkey);
                var rpcSig = ethUtil.toRpcSig(sig.v, sig.r, sig.s);
                cb(null, rpcSig);
            }
        })
    );
    this.engine.addProvider(new ProviderSubprovider(provider));
    this.engine.on("error", function(err) {
        logger.error("web3 provider engine error", err, err.stack);
    });
}

Web3HDWalletProvider.prototype.start = function() {
    if (!this.started) {
        this.engine.start();
        this.started = true;
        logger.info("started");
    } else {
        logger.warn("already started");
    }
}

Web3HDWalletProvider.prototype.stop = function() {
    //console.log("!!! start", new Error().stack);
    if (this.started) {
        this.engine.stop();
        this.started = false;
        logger.info("stopped");
    } else {
        logger.warn("never started");
    }
}

Web3HDWalletProvider.prototype.sendAsync = function() {
    // FIXME: auto start
    // It is a mess now, truffle does not have appropriate hooks for
    // start/stop the provider, hence we will do auto start for now
    if (!this.started) this.start(); 
    //if (!this.started) throw new Error("provider.sendAsync called, but provider not started");
    this.engine.sendAsync.apply(this.engine, arguments);
};

Web3HDWalletProvider.prototype.send = function() {
    // FIXME: auto start
    // see sendAsync comments
    if (!this.started) this.start(); 
    //if (!this.started) throw new Error("provider.send not started, but provider not started");
    return this.engine.send.apply(this.engine, arguments);
};

// returns the address of the given address_index, first checking the cache
Web3HDWalletProvider.prototype.getAddress = function(idx) {
    if (!idx) {
        return this.addresses[0];
    } else {
        return this.addresses[idx];
    }
};

// returns the addresses cache
Web3HDWalletProvider.prototype.getAddresses = function() {
    return this.addresses;
};

module.exports = Web3HDWalletProvider;
