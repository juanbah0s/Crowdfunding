import { RouterProvider } from "react-router";
import { router } from "./routes";
import { UserProvider } from "./context/UserContext";
import { PreferencesProvider } from "./context/PreferencesContext";

export default function App() {
  return (
    <UserProvider>
      <PreferencesProvider>
        <RouterProvider router={router} />
      </PreferencesProvider>
    </UserProvider>
  );
}
