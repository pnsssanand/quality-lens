import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';

import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { OverviewDashboard } from './pages/OverviewDashboard';
import { DataImports } from './pages/DataImports';
import { DefectAnalysis } from './pages/DefectAnalysis';
import { RootCauseInvestigations } from './pages/RootCauseInvestigations';
import { QualityMonitoring } from './pages/QualityMonitoring';
import { Reports } from './pages/Reports';
import { ImageEvidence } from './pages/ImageEvidence';
import { Settings } from './pages/Settings';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes wrapped in AppLayout */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<OverviewDashboard />} />
              <Route path="/imports" element={<DataImports />} />
              <Route path="/defect-analysis" element={<DefectAnalysis />} />
              <Route path="/investigations" element={<RootCauseInvestigations />} />
              <Route path="/monitoring" element={<QualityMonitoring />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/images" element={<ImageEvidence />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
