import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BrowserProvider, Contract } from 'ethers';
import axios from 'axios';
import { FAKE_NEFTURIANS_ADDRESS } from '../contracts/addresses';
import { FAKE_NEFTURIANS_ABI } from '../contracts/abis';

function FakeNefturiansCollection() {
  const { userAddress } = useParams();
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [name, setName] = useState('');

  useEffect(() => {
    const fetchTokens = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          const provider = new BrowserProvider(window.ethereum);
          const contract = new Contract(FAKE_NEFTURIANS_ADDRESS, FAKE_NEFTURIANS_ABI, provider);
          
          // Obtenir le nom de la collection
          const collectionName = await contract.name();
          setName(collectionName);
          
          // Obtenir le nombre total de tokens de l'utilisateur
          const balance = await contract.balanceOf(userAddress);
          const totalTokens = Number(balance);
          
          console.log('Fetching tokens for address:', userAddress);
          console.log('Total tokens found:', totalTokens);
          
          // Récupérer chaque token
          const tokenPromises = [];
          for (let i = 0; i < totalTokens; i++) {
            const promise = async () => {
              try {
                // Obtenir l'ID du token
                const tokenId = await contract.tokenOfOwnerByIndex(userAddress, i);
                console.log(`Token ${i} ID:`, tokenId.toString());
                
                // Obtenir l'URI du token
                const tokenURI = await contract.tokenURI(tokenId);
                console.log(`Token ${i} URI:`, tokenURI);
                
                // Récupérer les métadonnées
                const response = await axios.get(tokenURI);
                console.log(`Token ${i} metadata:`, response.data);
                
                return {
                  id: Number(tokenId),
                  ...response.data
                };
              } catch (error) {
                console.error(`Error fetching token ${i}:`, error);
                return null;
              }
            };
            tokenPromises.push(promise());
          }
          
          const tokenData = await Promise.all(tokenPromises);
          const validTokens = tokenData.filter(token => token !== null);
          console.log('Final tokens data:', validTokens);
          setTokens(validTokens);
        } catch (error) {
          console.error('Error loading collection:', error);
          setError('Error loading collection: ' + error.message);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchTokens();
  }, [userAddress]);

  if (loading) {
    return <div className="loading">Loading collection...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error">{error}</div>
        <Link to="/fakeNefturians" className="back-link">Back to Collection</Link>
      </div>
    );
  }

  return (
    <div className="collection-container">
      <h1>{name} Collection</h1>
      <p>Owner: {userAddress}</p>
      <p>Total tokens: {tokens.length}</p>
      
      {tokens.length === 0 ? (
        <div className="no-tokens">
          <p>No tokens found for this address</p>
        </div>
      ) : (
        <div className="token-grid">
          {tokens.map(token => (
            <div key={token.id} className="token-card">
              <img src={token.image} alt={token.name} />
              <h3>{token.name}</h3>
              <p>Token ID: {token.id}</p>
              <div className="attributes-grid">
                {token.attributes?.map((attr, index) => (
                  <div key={index} className="attribute-card">
                    <div className="trait-type">{attr.trait_type}</div>
                    <div className="trait-value">{attr.value}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      
      <Link to="/fakeNefturians" className="back-link">Back to Collection</Link>
    </div>
  );
}

export default FakeNefturiansCollection; 