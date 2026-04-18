import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import { Product } from './pages/Product';
import { Cases } from './pages/Cases';
import { Workspace } from './pages/Workspace';
import { AnalysisResult } from './pages/AnalysisResult';
import { About } from './pages/About';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Pricing } from './pages/Pricing';
import { Checkout } from './pages/Checkout';
import { ContentEnginePage } from './pages/ContentEnginePage';
import ShortDramaLandingPage from './pages/short-drama';
import { ShortDramaCreateProjectPage } from './pages/short-drama/CreateProjectPage';
import { ShortDramaProductInputPage } from './pages/short-drama/ProductInputPage';
import { ShortDramaStoryBlueprintPage } from './pages/short-drama/StoryBlueprintPage';
import { ShortDramaAssetsPage } from './pages/short-drama/AssetsPage';
import { ShortDramaStepFourPage } from './pages/short-drama/StepFourPage';
import { ShortDramaOverviewPage } from './pages/short-drama/OverviewPage';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';

export function App() {
  console.log('[APP_RENDER_START]');

  return (
    <LanguageProvider>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/product" element={<Product />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/cases" element={<Cases />} />
          <Route path="/workspace" element={<Workspace />} />
          <Route path="/workspace/marketing-result/:analysisId" element={<Workspace />} />
          <Route path="/workspace/ecom-result/:analysisId" element={<Workspace />} />
          <Route path="/content-engine" element={<ContentEnginePage />} />
          <Route path="/short-drama" element={<ShortDramaLandingPage />} />
          <Route path="/short-drama/create" element={<ShortDramaCreateProjectPage />} />
          <Route path="/short-drama/product-input" element={<ShortDramaProductInputPage />} />
          <Route path="/short-drama/story-blueprint" element={<ShortDramaStoryBlueprintPage />} />
          <Route path="/short-drama/assets" element={<ShortDramaAssetsPage />} />
          <Route path="/short-drama/step4" element={<ShortDramaStepFourPage />} />
          <Route path="/short-drama/overview" element={<ShortDramaOverviewPage />} />
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
