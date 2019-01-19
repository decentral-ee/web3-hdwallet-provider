const Ganache = require("ganache-core");
const assert = require("assert");
const WalletProvider = require("../index.js");
const EthUtil = require("ethereumjs-util");

describe("HD Wallet Provider", function() {
  const mnemonic = "ill song party come kid carry calm captain state purse weather ozone";
  const Web3 = require("web3");
  const web3 = new Web3();
  const port = 18545;
  let server;
  let provider;

  before(done => {
    server = Ganache.server({ mnemonic });
    server.listen(port, done);
  });

  after(done => {
    setTimeout(() => server.close(done), 100);
  });

  afterEach(() => {
    web3.setProvider(null);
    provider.engine.stop();
  });

  it("provides for a mnemonic", function(done) {
    const truffleDevAccounts = [
      "0x8517156cbdf189a1531b808d1069efc46af49e01",
      "0x4374f12c29383ef13443424ec9896278ba223f76",
      "0xb956c983a0b02f4f369aca692890e503f7a5a6e1",
      "0x1d6353fa8519271fc4ac6f058abe62c5769823c2",
      "0x129fa6eaf6309edf90c5a21d50d928dc8e832120",
      "0x4b8c50b81075b47d22b19d1b34fa8ef9f08b9fbc",
      "0x2ff6fa306c8c35dd5ee62c6b9e12f70ccb76e00a",
      "0x5d9588c28b8c540b81a4497ca484c8f07d7b8622",
      "0x6a0f980c564a7a9b95479229a0bd55a8151d5365",
      "0x005d725c9305a11cf5abeea195f3d21a749d6a25"
    ];

    provider = new WalletProvider(mnemonic, `http://localhost:${port}`, 0, 10);

    assert.deepEqual(provider.getAddresses(), truffleDevAccounts);
    web3.setProvider(provider);

    web3.eth.getBlockNumber((err, number) => {
      assert(number === 0);
      done();
    });
  });

  it("throws on invalid mnemonic", function(done) {
    try {
      provider = new WalletProvider(
        "takoyaki is delicious",
        "http://localhost:8545",
        0,
        1
      );
      assert.fail("Should throw on invalid mnemonic");
    } catch (e) {
      assert.equal(e.message, "Mnemonic invalid or undefined");
      done();
    }
  });

  it("provides for a private key", function(done) {
    const privateKey =
      "3f841bf589fdf83a521e55d51afddc34fa65351161eead24f064855fc29c9580"; //random valid private key generated with ethkey
    provider = new WalletProvider(privateKey, `http://localhost:${port}`);
    web3.setProvider(provider);

    const addresses = provider.getAddresses();
    assert.equal(addresses[0], "0xc515db5834d8f110eee96c3036854dbf1d87de2b");
    addresses.forEach(address => {
      assert(EthUtil.isValidAddress(address), "invalid address");
    });

    web3.eth.getBlockNumber((err, number) => {
      assert(number === 0);
      done();
    });
  });

  it("provides for an array of private keys", function(done) {
    const privateKeys = [
      "3f841bf589fdf83a521e55d51afddc34fa65351161eead24f064855fc29c9580",
      "9549f39decea7b7504e15572b2c6a72766df0281cea22bd1a3bc87166b1ca290"
    ];

    const privateKeysByAddress = {
      "0xc515db5834d8f110eee96c3036854dbf1d87de2b":
        "3f841bf589fdf83a521e55d51afddc34fa65351161eead24f064855fc29c9580",
      "0xbd3366a0e5d2fb52691e3e08fabe136b0d4e5929":
        "9549f39decea7b7504e15572b2c6a72766df0281cea22bd1a3bc87166b1ca290"
    };

    provider = new WalletProvider(
      privateKeys,
      `http://localhost:${port}`,
      0,
      privateKeys.length
    ); //pass in num_addresses to load full array
    web3.setProvider(provider);

    const addresses = provider.getAddresses();
    assert.equal(
      addresses.length,
      privateKeys.length,
      "incorrect number of wallets derived"
    );
    addresses.forEach(address => {
      assert(EthUtil.isValidAddress(address), "invalid address");
      const privateKey = Buffer.from(privateKeysByAddress[address], "hex");
      const expectedAddress = `0x${EthUtil.privateToAddress(
        privateKey
      ).toString("hex")}`;
      assert.equal(
        address,
        expectedAddress,
        "incorrect address for private key"
      );
    });

    web3.eth.getBlockNumber((err, number) => {
      assert(number === 0);
      done();
    });
  });

  it("should handle signTypedData", function(done) {
    provider = new WalletProvider(mnemonic, `http://localhost:${port}`, 0, 10);

    provider.sendAsync({
            jsonrpc: "2.0",
            method: "eth_signTypedData",
            params: ["0x4374F12c29383eF13443424EC9896278Ba223F76", {"types":{"EIP712Domain":[{"name":"name","type":"string"},{"name":"version","type":"string"},{"name":"chainId","type":"uint256"},{"name":"verifyingContract","type":"address"},{"name":"salt","type":"bytes32"}],"Grant":[{"name":"customer","type":"address"},{"name":"amount","type":"uint256"}]},"domain":{"name":"EtherPhoneBooth.GrantAllowance","version":"1","chainId":5777,"verifyingContract":"0xd5a8ea43e5BD67bF99dA56DcEe2A2325cDE7bB3c","salt":"0xb225c57bf2111d6955b97ef0f55525b5a400dc909a5506e34b102e193dd53406"},"primaryType":"Grant","message":{"customer":"0x4374F12c29383eF13443424EC9896278Ba223F76","amount":"100000000000000000"}}]
    }, (err, result) => {
      if (err) return done(err);
      assert.equal(result.result, "0x56b13c676dbabd14493e1a58cf9f38f1e914dc0abc555641ab7db4de03e587045a6641a2b137db4baf2a3a0e9f37a24fef9bf2dbe645b62601e9a6a7d77d404f1b");
      done();
    });
  });
});
