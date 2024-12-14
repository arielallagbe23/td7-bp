import React, { useState, useEffect } from 'react';
import { BrowserProvider, Contract, keccak256, AbiCoder } from 'ethers';
import axios from 'axios';
import { 
  FAKE_MEEBITS_ADDRESS, 
  FAKE_MEEBITS_CLAIMER_ADDRESS 
} from '../contracts/addresses';
import { 
  FAKE_MEEBITS_ABI, 
  FAKE_MEEBITS_CLAIMER_ABI 
} from '../contracts/abis';

function FakeMeebits() {
  const [selectedTokenId, setSelectedTokenId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [availableTokens, setAvailableTokens] = useState([]);

  const getSignatureForToken = async (tokenId) => {
    try {
      const response = await axios.get('/output-sig.json');
      console.log('Signatures loaded:', response.data);
      
      const signatures = response.data;
      const signatureData = signatures.find(sig => sig.tokenId === parseInt(tokenId));
      
      if (!signatureData) {
        throw new Error('No signature found for this token ID');
      }
      
      let signature = signatureData.signature;
      if (!signature.startsWith('0x')) {
        signature = '0x' + signature;
      }
      
      if (signature.length !== 132) {
        throw new Error('Invalid signature length');
      }
      
      console.log('Found signature for token', tokenId, ':', signature);
      return signature;
    } catch (error) {
      console.error('Error getting signature:', error);
      throw error;
    }
  };

  useEffect(() => {
    const checkAvailableTokens = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          // Charger d'abord les signatures disponibles
          const response = await axios.get('/output-sig.json');
          console.log('Loading signatures from file:', response.data);
          
          const signatures = response.data;
          const availableTokenIds = signatures.map(sig => sig.tokenId);
          
          const provider = new BrowserProvider(window.ethereum);
          const contract = new Contract(FAKE_MEEBITS_ADDRESS, FAKE_MEEBITS_ABI, provider);
          
          // Vérifier uniquement les tokens qui ont une signature
          const available = [];
          for (const tokenId of availableTokenIds) {
            try {
              await contract.ownerOf(tokenId);
              console.log(`Token ${tokenId} is already owned`);
            } catch (error) {
              if (error.message.includes("nonexistent token")) {
                console.log(`Token ${tokenId} is available`);
                available.push(tokenId);
              }
            }
          }
          
          console.log('Available tokens:', available);
          setAvailableTokens(available);
        } catch (error) {
          console.error('Error checking available tokens:', error);
          if (error.response && error.response.status === 404) {
            setError('Signature file not found. Please make sure output-sig.json is in the public folder.');
          } else {
            setError('Error loading available tokens: ' + error.message);
          }
        }
      }
    };

    checkAvailableTokens();
  }, []);

  const mintToken = async () => {
    if (!selectedTokenId) {
      setError('Please select a token ID');
      return;
    }

    if (typeof window.ethereum !== 'undefined') {
      try {
        setLoading(true);
        setError(null);
        setSuccess(null);

        const provider = new BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        
        // Créer le hash comme dans le contrat
        const abiCoder = new AbiCoder();
        const encodedData = abiCoder.encode(
          ['address', 'uint256'],
          [FAKE_MEEBITS_ADDRESS, selectedTokenId]
        );
        const messageHash = keccak256(encodedData);
        console.log('Message hash:', messageHash);

        const signature = await getSignatureForToken(selectedTokenId);
        console.log('Using signature:', signature);
        
        const contract = new Contract(
          FAKE_MEEBITS_CLAIMER_ADDRESS,
          FAKE_MEEBITS_CLAIMER_ABI,
          signer
        );

        console.log('Minting token:', selectedTokenId);
        console.log('Contract address:', FAKE_MEEBITS_CLAIMER_ADDRESS);
        
        // Demander confirmation à l'utilisateur
        setSuccess('Please confirm the transaction in your wallet...');
        
        const tx = await contract.claimAToken(
          selectedTokenId,
          signature,
          { gasLimit: 300000 }
        );
        
        console.log('Transaction sent:', tx.hash);
        setSuccess('Transaction sent! Waiting for confirmation...');
        
        const receipt = await tx.wait();
        console.log('Transaction receipt:', receipt);
        
        if (receipt.status === 0) {
          throw new Error('Transaction failed');
        }
        
        setSuccess('Token minted successfully! Transaction hash: ' + tx.hash);
        setAvailableTokens(availableTokens.filter(id => id !== parseInt(selectedTokenId)));
        setSelectedTokenId('');
      } catch (error) {
        console.error('Error minting token:', error);
        
        // Meilleure gestion des erreurs
        if (error.code === 'ACTION_REJECTED' || error.message.includes('user rejected')) {
          setError('Transaction was rejected. Please try again and confirm the transaction in your wallet.');
        } else if (error.message.includes('insufficient funds')) {
          setError('Insufficient funds to pay for gas fees. Please make sure you have enough ETH.');
        } else if (error.message.includes('execution reverted')) {
          setError('Transaction failed. This token might have already been minted or there might be an issue with the signature.');
        } else {
          setError(`Error minting token: ${error.message}`);
        }
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="collection-container">
      <h1>Fake Meebits Minter</h1>
      
      <div className="minting-section">
        <h2>Available Tokens</h2>
        <select 
          value={selectedTokenId} 
          onChange={(e) => setSelectedTokenId(e.target.value)}
          disabled={loading}
          className="token-select"
        >
          <option value="">Select a token ID</option>
          {availableTokens.map(id => (
            <option key={id} value={id}>Token #{id}</option>
          ))}
        </select>
        
        <button 
          onClick={mintToken} 
          disabled={loading || !selectedTokenId}
          className="mint-button"
        >
          {loading ? 'Minting...' : 'Mint Token'}
        </button>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
      <div className="info-box">
        <h3>Information</h3>
        <p>Available tokens: {availableTokens.length}</p>
        <p>Selected token: {selectedTokenId || 'None'}</p>
        <p>Make sure:</p>
        <ul>
          <li>You are on Holesky network</li>
          <li>Your wallet is connected</li>
          <li>You have selected an available token</li>
        </ul>
      </div>
    </div>
  );
}

export default FakeMeebits; 