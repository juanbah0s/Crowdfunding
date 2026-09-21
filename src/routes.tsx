import { createBrowserRouter } from "react-router";
import { Home } from "./pages/Home";
import { Auth } from "./pages/Auth";
import { PanelLayout } from "./pages/PanelLayout";
import { Dashboard } from "./pages/Dashboard";
import { Profile } from "./pages/Profile";
import { Wallet } from "./pages/Wallet";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Home,
  },
  {
    path: "/auth",
    Component: Auth,
  },
  {
    Component: PanelLayout,
    children: [
      { path: "/dashboard", Component: Dashboard },
      { path: "/perfil", Component: Profile },
      { path: "/billetera", Component: Wallet },
    ],
  },
]);
