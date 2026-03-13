import { Routes, Route, Navigate } from 'react-router-dom';
import { Home } from './pages/Home';
import { Product } from './pages/Product';
import { Cases } from './pages/Cases';
import { Workspace } from './pages/Workspace';
import { AnalysisResult } from './pages/AnalysisResult';
import { About } from './pages/About';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';

export function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/product" element={<Product />} />
          <Route path="/cases" element={<Cases />} />
          <Route path="/workspace" element={<Workspace />} />
          <Route path="/result" element={<AnalysisResult />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </LanguageProvider>
  );
}
