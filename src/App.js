import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ChainInfo from './components/ChainInfo';
import FakeBayc from './components/FakeBayc';
import FakeBaycToken from './components/FakeBaycToken';
import ErrorPage from './components/ErrorPage';
import FakeNefturians from './components/FakeNefturians';
import FakeNefturiansCollection from './components/FakeNefturiansCollection';
import FakeMeebits from './components/FakeMeebits';

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <div className="content">
          <Routes>
            <Route path="/" element={<Navigate to="/chain-info" />} />
            <Route path="/chain-info" element={<ChainInfo />} />
            <Route path="/fakeBayc" element={<FakeBayc />} />
            <Route path="/fakeBayc/:tokenId" element={<FakeBaycToken />} />
            <Route path="/error" element={<ErrorPage />} />
            <Route path="/fakeNefturians" element={<FakeNefturians />} />
            <Route path="/fakeNefturians/:userAddress" element={<FakeNefturiansCollection />} />
            <Route path="/fakeMeebits" element={<FakeMeebits />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;