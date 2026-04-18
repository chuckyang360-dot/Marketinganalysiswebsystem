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
import ShortDramaLanding from "../pages/short-drama/landing/page";
import CreateProjectPage from "../pages/short-drama/create/page";
import Step1Page from "../pages/short-drama/step1/page";
import Step2Page from "../pages/short-drama/step2/page";
import Step3Page from "../pages/short-drama/step3/page";
import Step4Page from "../pages/short-drama/step4/page";
import OverviewPage from "../pages/short-drama/overview/page";

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
    path: "/short-drama",
    element: <ShortDramaLanding />,
  },
  {
    path: "/short-drama/create",
    element: <CreateProjectPage />,
  },
  {
    path: "/short-drama/step1",
    element: <Step1Page />,
  },
  {
    path: "/short-drama/step2",
    element: <Step2Page />,
  },
  {
    path: "/short-drama/step3",
    element: <Step3Page />,
  },
  {
    path: "/short-drama/step4",
    element: <Step4Page />,
  },
  {
    path: "/short-drama/overview",
    element: <OverviewPage />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
];

export default routes;
