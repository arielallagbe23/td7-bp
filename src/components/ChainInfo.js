import React, { useState, useEffect } from 'react';
import { BrowserProvider } from 'ethers';
import { useNavigate, Link } from 'react-router-dom';

function ChainInfo() {
  const [chainId, setChainId] = useState(null);
  const [blockNumber, setBlockNumber] = useState(null);
  const [userAddress, setUserAddress] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          await window.ethereum.request({ method: 'eth_requestAccounts' });
          const provider = new BrowserProvider(window.ethereum);
          
          // Get chain ID
          const network = await provider.getNetwork();
          setChainId(network.chainId);
          
          // Redirect if not on Holesky (chainId 17000)
          if (network.chainId !== 17000n) {
            navigate('/error');
            return;
          }

          // Get latest block number
          const block = await provider.getBlockNumber();
          setBlockNumber(block);

          // Get user address
          const signer = await provider.getSigner();
          const address = await signer.getAddress();
          setUserAddress(address);
        } catch (error) {
          console.error('Error:', error);
        }
      }
    };

    init();
  }, [navigate]);

  return (
    <div>
      <h1>Chain Information</h1>
      <p>Chain ID: {chainId?.toString()}</p>
      <p>Latest Block: {blockNumber?.toString()}</p>
      <p>Your Address: {userAddress}</p>
      <nav>
        <ul>
          <li><Link to="/fakeBayc">View FakeBAYC</Link></li>
        </ul>
      </nav>
    </div>
  );
}

export default ChainInfo; 