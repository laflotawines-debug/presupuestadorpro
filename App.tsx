import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import AdminPanel from './components/AdminPanel';
import Catalog from './components/Catalog';
import { InventoryProvider } from './store/InventoryContext';

function App() {
  return (
    <InventoryProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
          <Navbar />
          <div className="flex-1">
            <Routes>
              {/* Public Client View */}
              <Route path="/" element={<Catalog isSpecialList={false} />} />
              
              {/* Admin Panel */}
              <Route path="/admin" element={<AdminPanel />} />
              
              {/* Special 'Chinese List' View */}
              <Route path="/lista-china" element={<Catalog isSpecialList={true} />} />
            </Routes>
          </div>
        </div>
      </Router>
    </InventoryProvider>
  );
}

export default App;