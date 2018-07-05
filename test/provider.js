const Ganache = require('ganache-core');
const assert = require('assert');
const WalletProvider = require('../index.js');
const mnemonic = 'candy maple cake sugar pudding cream honey rich smooth crumble sweet treat';

describe("Web3 HD Wallet Provider", function(done) {
  const Web3 = require('web3');
  var web3 = new Web3();
  var port = 8545;
  var server;
  var provider;

  before(done => {
    server = Ganache.server();
    server.listen(port, done);
    let httpProvider = new Web3.providers.HttpProvider(`http://localhost:${port}`);
    provider = new WalletProvider(httpProvider, mnemonic);
    web3.setProvider(provider);
  });

  after(done => {
    provider.stop();
    setTimeout(() => server.close(done), 2000); // :/
  })

  it('provides', function(done){
    web3.eth.getBlockNumber((err, number) => {
      assert(number === 0);
      done();
    });
  })
});

