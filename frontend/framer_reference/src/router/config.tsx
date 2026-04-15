import type { RouteObject } from "react-router-dom";
import NotFound from "../pages/NotFound";
import Home from "../pages/home/page";
import ProductPage from "../pages/product/page";
import PricingPage from "../pages/pricing/page";
import CasePage from "../pages/case/page";
import WorkspacePage from "../pages/workspace/page";
import AboutPage from "../pages/about/page";
import EcomResultPage from "../pages/workspace/ecom-result/page";
import MarketingResultPage from "../pages/workspace/marketing-result/page";
import ContentEnginePage from "../pages/workspace/content-engine/page";

const routes: RouteObject[] = [
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/product",
    element: <ProductPage />,
  },
  {
    path: "/pricing",
    element: <PricingPage />,
  },
  {
    path: "/case",
    element: <CasePage />,
  },
  {
    path: "/workspace",
    element: <WorkspacePage />,
  },
  {
    path: "/workspace/ecom-result/:analysisId",
    element: <EcomResultPage />,
  },
  {
    path: "/workspace/marketing-result",
    element: <MarketingResultPage />,
  },
  {
    path: "/workspace/content-engine",
    element: <ContentEnginePage />,
  },
  {
    path: "/about",
    element: <AboutPage />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
];

export default routes;
