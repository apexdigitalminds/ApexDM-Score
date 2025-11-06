import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import MemberDashboard from './components/MemberDashboard';
import AdminDashboard from './components/AdminDashboard';

const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        {/* Member view - accessible within Whop experience iframe */}
        <Route path="/experiences/:experienceId" element={<MemberDashboard />} />

        {/* Admin view - accessible from Whop company dashboard */}
        <Route path="/dashboard/:companyId" element={<AdminDashboard />} />

        {/* Default redirect to a placeholder */}
        <Route path="*" element={
          <div className="min-h-screen flex items-center justify-center bg-slate-900">
            <div className="text-center text-white">
              <h1 className="text-2xl font-bold mb-4">ApexDM Score</h1>
              <p className="text-slate-400">This app must be accessed through Whop.</p>
              <p className="text-sm text-slate-500 mt-2">
                Navigate to /experiences/:experienceId or /dashboard/:companyId
              </p>
            </div>
          </div>
        } />
      </Routes>
    </HashRouter>
  );
};

export default App;
