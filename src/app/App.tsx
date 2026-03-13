import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Toaster } from './components/ui/sonner';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Workspace } from './pages/Workspace';
import { Product } from './pages/Product';
import { Cases } from './pages/Cases';
import { AnalysisResult } from './pages/AnalysisResult';
import { About } from './pages/About';
import { SEOAnalysis } from './pages/SEOAnalysis';
import { RedditAnalysis } from './pages/RedditAnalysis';
import { TwitterAnalysis } from './pages/TwitterAnalysis';
import { ContentGeneration } from './pages/ContentGeneration';
import { DataSummary } from './pages/DataSummary';
import { History } from './pages/History';
import { ProtectedRoute } from './components/ProtectedRoute';

function AppContent() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/workspace" element={<Workspace />} />
          <Route path="/workspace/seo" element={<ProtectedRoute><SEOAnalysis /></ProtectedRoute>} />
          <Route path="/workspace/reddit" element={<ProtectedRoute><RedditAnalysis /></ProtectedRoute>} />
          <Route path="/workspace/twitter" element={<ProtectedRoute><TwitterAnalysis /></ProtectedRoute>} />
          <Route path="/workspace/content" element={<ProtectedRoute><ContentGeneration /></ProtectedRoute>} />
          <Route path="/workspace/summary" element={<ProtectedRoute><DataSummary /></ProtectedRoute>} />
          <Route path="/workspace/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
          <Route path="/product" element={<Product />} />
          <Route path="/cases" element={<Cases />} />
          <Route path="/result" element={<AnalysisResult />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
      <Toaster />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </AuthProvider>
  );
}
