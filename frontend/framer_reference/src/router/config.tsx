import type { RouteObject } from "react-router-dom";
import NotFound from "../pages/NotFound";
import Home from "../pages/home/page";
import ProductPage from "../pages/product/page";
import PricingPage from "../pages/pricing/page";
import CasePage from "../pages/case/page";
import WorkspacePage from "../pages/workspace/page";
import AboutPage from "../pages/about/page";

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
    path: "/about",
    element: <AboutPage />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
];

export default routes;
