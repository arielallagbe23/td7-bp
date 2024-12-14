/* global BigInt */
import React, { useState, useEffect } from 'react';
import { BrowserProvider, Contract, formatEther } from 'ethers';
import { Link } from 'react-router-dom';
import { FAKE_NEFTURIANS_ADDRESS } from '../contracts/addresses';
import { FAKE_NEFTURIANS_ABI } from '../contracts/abis';

function FakeNefturians() {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userAddress, setUserAddress] = useState(null);
  const [success, setSuccess] = useState(null);
  const [balance, setBalance] = useState(null);

  useEffect(() => {
    const init = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          const provider = new BrowserProvider(window.ethereum);
          const contract = new Contract(FAKE_NEFTURIANS_ADDRESS, FAKE_NEFTURIANS_ABI, provider);
          
          const tokenName = await contract.name();
          const tokenPrice = await contract.tokenPrice();
          const signer = await provider.getSigner();
          const address = await signer.getAddress();
          const userBalance = await provider.getBalance(address);
          
          console.log('Contract Address:', FAKE_NEFTURIANS_ADDRESS);
          console.log('Token Name:', tokenName);
          console.log('Token Price (wei):', tokenPrice.toString());
          console.log('Token Price (ETH):', formatEther(tokenPrice));
          console.log('User Address:', address);
          console.log('User Balance (ETH):', formatEther(userBalance));
          
          setName(tokenName);
          setPrice(formatEther(tokenPrice));
          setUserAddress(address);
          setBalance(formatEther(userBalance));
        } catch (error) {
          console.error('Init Error:', error);
          setError('Error loading collection data: ' + error.message);
        }
      }
    };

    init();
  }, []);

  const buyToken = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        setLoading(true);
        setError(null);
        setSuccess(null);
        
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const provider = new BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const contract = new Contract(FAKE_NEFTURIANS_ADDRESS, FAKE_NEFTURIANS_ABI, signer);
        
        const tokenPrice = await contract.tokenPrice();
        console.log('Contract price:', formatEther(tokenPrice), 'ETH');
        
        const priceToSend = tokenPrice * BigInt(101) / BigInt(100);
        console.log('Sending price with surplus:', formatEther(priceToSend), 'ETH');
        
        const tx = await contract.buyAToken({
          value: priceToSend,
          gasLimit: 200000
        });
        
        console.log('Transaction sent:', tx.hash);
        setSuccess('Transaction sent! Waiting for confirmation...');
        
        const receipt = await tx.wait();
        console.log('Transaction receipt:', receipt);
        
        if (receipt.status === 0) {
          throw new Error('Transaction failed');
        }
        
        setSuccess('Token purchased successfully! Transaction hash: ' + tx.hash);
      } catch (error) {
        console.error('Detailed error:', error);
        
        if (error.message.includes('insufficient funds')) {
          setError(`Insufficient funds. You have ${balance} ETH but need slightly more than ${price} ETH plus gas.`);
        } else if (error.message.includes('user rejected')) {
          setError('Transaction was rejected by user.');
        } else if (error.data) {
          setError(`Contract error: ${error.data.message || error.message}`);
        } else {
          setError(`Transaction failed: ${error.message}`);
        }
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="collection-container">
      <div className="collection-header">
        <div>
          <h1>{name}</h1>
          <p>Minimum token price: {price} ETH</p>
          <p>Your balance: {balance} ETH</p>
          {userAddress && (
            <>
              <p>Your address: {userAddress}</p>
              <Link to={`/fakeNefturians/${userAddress}`} className="view-collection">
                View My Collection
              </Link>
            </>
          )}
        </div>
        <button 
          onClick={buyToken} 
          disabled={loading || !userAddress}
          className="buy-button"
        >
          {loading ? 'Processing...' : `Buy Token (${price}+ ETH)`}
        </button>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
      <div className="info-box">
        <h3>Debug Information</h3>
        <p>Contract Address: {FAKE_NEFTURIANS_ADDRESS}</p>
        <p>Your Balance: {balance} ETH</p>
        <p>Minimum Token Price: {price} ETH</p>
        <p>Note: You need to send slightly more than the minimum price</p>
        <p>Make sure:</p>
        <ul>
          <li>You are on Holesky network</li>
          <li>You have enough ETH (>{price} ETH + gas)</li>
          <li>Your wallet is connected ({userAddress})</li>
        </ul>
      </div>
    </div>
  );
}

export default FakeNefturians; 