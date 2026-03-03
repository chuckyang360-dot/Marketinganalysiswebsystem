import { createBrowserRouter } from 'react-router';
import { Root } from './Root';
import { Home } from './pages/Home';
import { SEOAnalysis } from './pages/SEOAnalysis';
import { RedditAnalysis } from './pages/RedditAnalysis';
import { TwitterAnalysis } from './pages/TwitterAnalysis';
import { ContentGeneration } from './pages/ContentGeneration';
import { DataSummary } from './pages/DataSummary';
import { History } from './pages/History';
import { NotFound } from './pages/NotFound';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Root,
    children: [
      { index: true, Component: Home },
      { path: 'seo', Component: SEOAnalysis },
      { path: 'reddit', Component: RedditAnalysis },
      { path: 'twitter', Component: TwitterAnalysis },
      { path: 'content', Component: ContentGeneration },
      { path: 'summary', Component: DataSummary },
      { path: 'history', Component: History },
      { path: '*', Component: NotFound },
    ],
  },
]);