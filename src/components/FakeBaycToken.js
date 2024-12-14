import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { BrowserProvider, Contract } from 'ethers';
import axios from 'axios';
import { FAKE_BAYC_ADDRESS } from '../contracts/addresses';
import { FAKE_BAYC_ABI } from '../contracts/abis';

function FakeBaycToken() {
  const { tokenId } = useParams();
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTokenMetadata = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          const provider = new BrowserProvider(window.ethereum);
          const contract = new Contract(FAKE_BAYC_ADDRESS, FAKE_BAYC_ABI, provider);
          
          // Obtenir l'URI du token
          const tokenURI = await contract.tokenURI(tokenId);
          console.log('Token URI:', tokenURI);
          
          // Modifier l'URI pour pointer vers IPFS via une gateway publique
          const ipfsGateway = 'https://ipfs.io/ipfs/';
          const modifiedURI = tokenURI.replace('ipfs://', ipfsGateway);
          
          // Récupérer les métadonnées
          const response = await axios.get(modifiedURI);
          console.log('Metadata:', response.data);
          
          // Modifier l'URL de l'image pour utiliser IPFS gateway
          const metadata = response.data;
          if (metadata.image && metadata.image.startsWith('ipfs://')) {
            metadata.image = metadata.image.replace('ipfs://', ipfsGateway);
          }
          
          setMetadata(metadata);
        } catch (error) {
          console.error('Error fetching token metadata:', error);
          setError('Error loading token metadata: ' + error.message);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchTokenMetadata();
  }, [tokenId]);

  if (loading) {
    return <div className="loading">Loading token metadata...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!metadata) {
    return <div className="error">No metadata found for this token</div>;
  }

  return (
    <div className="token-details">
      <h2>{metadata.name}</h2>
      <div className="token-image-container">
        <img 
          src={metadata.image} 
          alt={metadata.name}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/placeholder.png'; // Image de remplacement en cas d'erreur
          }}
        />
      </div>
      <div className="token-description">
        <p>{metadata.description}</p>
      </div>
      <div className="token-attributes">
        {metadata.attributes?.map((attr, index) => (
          <div key={index} className="attribute">
            <span className="attribute-type">{attr.trait_type}:</span>
            <span className="attribute-value">{attr.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default FakeBaycToken; 