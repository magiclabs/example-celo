import React, { useState, useEffect } from "react";
import "./styles.css";
import { Magic } from "magic-sdk";
import { newKitFromWeb3 } from '@celo/contractkit'
import Web3 from 'web3'

const magic = new Magic('pk_live_07BFC52E326230D5', {
  network: {
    rpcUrl: 'https://alfajores-forno.celo-testnet.org'
  }
});

export default function App() {
  const [email, setEmail] = useState("");
  const [publicAddress, setPublicAddress] = useState("");
  const [destinationAddress, setDestinationAddress] = useState("");
  const [sendAmount, setSendAmount] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userMetadata, setUserMetadata] = useState({});
  const [txHash, setTxHash] = useState("");
  const [contractSendHash, setContractSendHash] = useState("");
  const [contractSending, setContractSending] = useState(false);
  const [sendingTransaction, setSendingTransaction] = useState(false);

  useEffect(() => {
    magic.user.isLoggedIn().then(async magicIsLoggedIn => {
      setIsLoggedIn(magicIsLoggedIn);
      if (magicIsLoggedIn) {
        const { publicAddress } = await magic.user.getMetadata();
        setPublicAddress(publicAddress);
        setUserMetadata(await magic.user.getMetadata());
      }
    });
  }, [isLoggedIn]);

  const login = async () => {
    await magic.auth.loginWithMagicLink({ email });
    setIsLoggedIn(true);
  };

  const logout = async () => {
    await magic.user.logout();
    setIsLoggedIn(false);
  };

  const handlerSendTransaction = async () => {

    const web3 = new Web3(magic.rpcProvider);
    const kit = newKitFromWeb3(web3);

    const { publicAddress } = await magic.user.getMetadata();

    kit.defaultAccount = publicAddress;

    setSendingTransaction(true);

    const oneGold = kit.web3.utils.toWei(sendAmount, 'ether');

    const tx = await kit.sendTransaction({
      from: publicAddress,
      to: destinationAddress,
      value: oneGold,
      gasPrice: 1000000000
    });

    const hash = await tx.getHash();
    const receipt = await tx.waitReceipt();

    setSendingTransaction(false);

    setTxHash(hash);

    console.log('send transaction', hash, receipt);
  };

  const handleContractSend = async () => {
    const contractAddress = '0xcf71aB733148F70647129F3006E92439d11946A9';

    const abi = [
      {
        "constant": true,
        "inputs": [],
        "name": "getName",
        "outputs": [
          {
            "internalType": "string",
            "name": "",
            "type": "string"
          }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
      },
      {
        "constant": false,
        "inputs": [
          {
            "internalType": "string",
            "name": "newName",
            "type": "string"
          }
        ],
        "name": "setName",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
      }
    ];
    const { publicAddress } = await magic.user.getMetadata();

    const web3 = new Web3(magic.rpcProvider);
    const kit = newKitFromWeb3(web3);

    let instance = new web3.eth.Contract(abi, contractAddress);

    const txObject = await instance.methods.setName('new name');

    setContractSending(true);

    let tx = await kit.sendTransactionObject(txObject, { from: publicAddress, gasPrice: 1000000000 });

    const hash = await tx.getHash();

    let receipt = await tx.waitReceipt();
    setContractSendHash(hash);

    setContractSending(false);
    console.log(hash, receipt)
  };

  return (
    <div className="App">
      {!isLoggedIn ? (
        <div className="container">
          <h1>Please sign up or login</h1>
          <input
            type="email"
            name="email"
            required="required"
            placeholder="Enter your email"
            onChange={event => {
              setEmail(event.target.value);
            }}
          />
          <button onClick={login}>Send</button>
        </div>
      ) : (
        <div>
          <div className="container">
            <h1>Current user: {userMetadata.email}</h1>
            <button onClick={logout}>Logout</button>
          </div>
          <div className="container">
            <h1>Celo address</h1>
            <div className="info">
              <a
                href={`https://alfajores-blockscout.celo-testnet.org/address/${publicAddress}/transactions`}
                target="_blank"
              >
                {publicAddress}
              </a>
            </div>
          </div>
          <div className="container">
            <h1>Send Transaction</h1>
            {txHash ? (
              <div>
                <div>Send transaction success</div>
                <div className="info">
                  <a
                    href={`https://alfajores-blockscout.celo-testnet.org/tx/${txHash}/token_transfers`}
                    target="_blank"
                  >
                    {txHash}
                  </a>
                </div>
              </div>
            ) : sendingTransaction ? (<div className="sending-status">
              Sending transaction
            </div>) : (
              <div />
            )}
            <input
              type="text"
              name="destination"
              className="full-width"
              required="required"
              placeholder="Destination address"
              onChange={event => {
                setDestinationAddress(event.target.value);
              }}
            />
            <input
              type="text"
              name="amount"
              className="full-width"
              required="required"
              placeholder="Amount in Celo"
              onChange={event => {
                setSendAmount(event.target.value);
              }}
            />
            <button id="btn-send-txn" onClick={handlerSendTransaction}>
              Send Transaction
            </button>
          </div>
          <div className="container">
            <h1>Contract Send</h1>
            {
              contractSending ? <div className="sending-status">
                Calling contract send
              </div> : ''
            }
            <div className="info">
              <a
                  href={`https://alfajores-blockscout.celo-testnet.org/tx/${contractSendHash}/internal_transactions`}
                  target="_blank"
              >
                {contractSendHash}
              </a>
            </div>
            <button id="btn-deploy" onClick={handleContractSend}>
              Contract Send
            </button>
          </div>
        </div>

      )}
    </div>
  );
}
