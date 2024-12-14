import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Navbar() {
  const [searchId, setSearchId] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchId.trim()) {
      navigate(`/fakeBayc/${searchId}`);
      setSearchId('');
    }
  };

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <Link to="/">NFTVerse</Link>
      </div>
      <div className="nav-links">
        <Link to="/chain-info" className="nav-link">Chain Info</Link>
        <Link to="/fakeBayc" className="nav-link">FakeBAYC</Link>
        <Link to="/fakeNefturians" className="nav-link">FakeNefturians</Link>
        <Link to="/fakeMeebits" className="nav-link">FakeMeebits</Link>
      </div>
      <form className="search-form" onSubmit={handleSearch}>
        <input
          type="number"
          placeholder="Enter Token ID..."
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
          className="search-input"
        />
        <button type="submit" className="search-button">Search</button>
      </form>
    </nav>
  );
}

export default Navbar; 