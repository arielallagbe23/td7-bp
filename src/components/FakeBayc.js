import React, { useState, useEffect } from 'react';
import { BrowserProvider, Contract } from 'ethers';
import { Link } from 'react-router-dom'; // Import Link
import axios from 'axios';
import { FAKE_BAYC_ADDRESS } from '../contracts/addresses';
import { FAKE_BAYC_ABI } from '../contracts/abis';

function FakeBayc() {
  const [name, setName] = useState('');
  const [totalTokens, setTotalTokens] = useState(0);
  const [loading, setLoading] = useState(true); // Par défaut, chargement actif
  const [error, setError] = useState(null);
  const [tokenImages, setTokenImages] = useState([]);

  useEffect(() => {
    const init = async () => {
      if (typeof window.ethereum !== 'undefined') {
        const provider = new BrowserProvider(window.ethereum);
        const contract = new Contract(FAKE_BAYC_ADDRESS, FAKE_BAYC_ABI, provider);

        try {
          const tokenName = await contract.name();
          const tokenCount = await contract.tokenCounter();

          setName(tokenName);
          setTotalTokens(Number(tokenCount));

          // Récupérer les images et noms de chaque token
          const images = [];
          const ipfsGateway = 'https://ipfs.io/ipfs/';
          for (let i = 0; i < tokenCount; i++) {
            try {
              const tokenURI = await contract.tokenURI(i);
              const modifiedURI = tokenURI.replace('ipfs://', ipfsGateway);
              const response = await axios.get(modifiedURI);
              const metadata = response.data;

              if (metadata.image && metadata.image.startsWith('ipfs://')) {
                metadata.image = metadata.image.replace('ipfs://', ipfsGateway);
              }

              images.push({ id: i, name: metadata.name, image: metadata.image });
            } catch (innerError) {
              console.error(`Error fetching metadata for token ${i}:`, innerError);
            }
          }

          setTokenImages(images);
        } catch (error) {
          setError('Error loading collection data');
          console.error('Error:', error);
        } finally {
          setLoading(false); // Désactiver le chargement une fois terminé
        }
      }
    };

    init();
  }, []);

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="collection-container">
      <div className="collection-header">
        <div>
          <h1>{name}</h1>
          <p>Total Tokens: {totalTokens}</p>
        </div>
      </div>

      {/* Afficher une jauge de chargement pendant le chargement */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading tokens...</p>
        </div>
      ) : (
        <div className="token-grid">
          {tokenImages.map((token) => (
            <Link 
              key={token.id} 
              to={`/fakeBayc/${token.id}`} // Ajout du lien vers la page de détails
              className="token-card"
            >
              <img 
                src={token.image} 
                alt={token.name} 
                className="token-image"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/placeholder.png'; // Image de remplacement en cas d'erreur
                }}
              />
              <h3>{token.name}</h3>
              <p>Token #{token.id}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default FakeBayc;
