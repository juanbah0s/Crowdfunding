import { createBrowserRouter, Navigate } from "react-router";
import { Auth } from "./pages/Auth";
import { PanelLayout, RequireAdmin, RequireAuth } from "./pages/PanelLayout";
import { Dashboard } from "./pages/Dashboard";
import { Profile } from "./pages/Profile";
import { Wallet } from "./pages/Wallet";
import { Explore } from "./pages/Explore";
import { CampaignDetail } from "./pages/CampaignDetail";
import { CreateCampaign, EditCampaign } from "./pages/CampaignForm";
import { MyCampaigns } from "./pages/MyCampaigns";
import { Notifications } from "./pages/Notifications";
import { Users } from "./pages/Users";
import { Preferences } from "./pages/Preferences";
import { ContributionHistory } from "./pages/ContributionHistory";
import { CampaignEarnings } from "./pages/CampaignEarnings";
import { Reports } from "./pages/Reports";
import { AdminTransactions } from "./pages/AdminTransactions";

export const router = createBrowserRouter([
  {
    path: "/auth",
    Component: Auth,
  },
  {
    Component: PanelLayout,
    children: [
      // Public pages
      { path: "/", Component: Explore },
      { path: "/campanas/:id", Component: CampaignDetail },
      // Las preferencias de apariencia funcionan también sin sesión (HU-22, HU-23).
      { path: "/preferencias", Component: Preferences },
      // Legacy explore URL and unknown routes fall back to the main page
      { path: "/explorar", element: <Navigate to="/" replace /> },
      { path: "*", element: <Navigate to="/" replace /> },
      // Authenticated pages
      {
        Component: RequireAuth,
        children: [
          { path: "/dashboard", Component: Dashboard },
          { path: "/perfil", Component: Profile },
          { path: "/billetera", Component: Wallet },
          { path: "/mis-campanas", Component: MyCampaigns },
          { path: "/campanas/nueva", Component: CreateCampaign },
          { path: "/campanas/:id/editar", Component: EditCampaign },
          { path: "/notificaciones", Component: Notifications },
          { path: "/historial", Component: ContributionHistory },
          { path: "/campanas/:id/recaudo", Component: CampaignEarnings },
          { path: "/reportes", Component: Reports },
          // Admin-only pages
          {
            Component: RequireAdmin,
            children: [
              { path: "/usuarios", Component: Users },
              { path: "/transacciones", Component: AdminTransactions },
            ],
          },
        ],
      },
    ],
  },
]);
