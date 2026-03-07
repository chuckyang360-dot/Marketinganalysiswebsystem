import { createBrowserRouter } from 'react-router';
import { Root } from './Root';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { SEOAnalysis } from './pages/SEOAnalysis';
import { RedditAnalysis } from './pages/RedditAnalysis';
import { TwitterAnalysis } from './pages/TwitterAnalysis';
import { ContentGeneration } from './pages/ContentGeneration';
import { DataSummary } from './pages/DataSummary';
import { History } from './pages/History';
import { About } from './pages/About';
import { NotFound } from './pages/NotFound';
import { ProtectedRoute } from './components/ProtectedRoute';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Root,
    children: [
      { index: true, Component: Home },
      { path: 'login', Component: Login },
      { path: 'register', Component: Register },
      { path: 'seo', Component: () => <ProtectedRoute><SEOAnalysis /></ProtectedRoute> },
      { path: 'reddit', Component: () => <ProtectedRoute><RedditAnalysis /></ProtectedRoute> },
      { path: 'twitter', Component: () => <ProtectedRoute><TwitterAnalysis /></ProtectedRoute> },
      { path: 'content', Component: () => <ProtectedRoute><ContentGeneration /></ProtectedRoute> },
      { path: 'summary', Component: () => <ProtectedRoute><DataSummary /></ProtectedRoute> },
      { path: 'history', Component: () => <ProtectedRoute><History /></ProtectedRoute> },
      { path: 'about', Component: About },
      { path: '*', Component: NotFound },
    ],
  },
]);