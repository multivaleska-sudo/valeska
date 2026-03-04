import { createBrowserRouter } from "react-router";
import { AppShell } from "./components/AppShell";
import { LoginPage } from "./pages/auth/LoginPage";
import { WelcomeSetupPage } from "./pages/auth/WelcomeSetupPage";
import { ActivateAdminPage } from "./pages/auth/ActivateAdminPage";
import { DashboardPage } from "./pages/DashboardPage";
import { TramitesListPage } from "./pages/tramites/TramitesListPage";
import { TramiteDetailPage } from "./pages/tramites/TramiteDetailPage";
import { NewTramitePage } from "./pages/tramites/NewTramitePage";
import { EditTramitePage } from "./pages/tramites/EditTramitePage";
import { ClientesListPage } from "./pages/clientes/ClientesListPage";
import { ClienteDetailPage } from "./pages/clientes/ClienteDetailPage";
import { SituacionesPage } from "./pages/SituacionesPage";
import { XMLImportPage } from "./pages/xml/XMLImportPage";
import { XMLReviewPage } from "./pages/xml/XMLReviewPage";
import { RecibosListPage } from "./pages/recibos/RecibosListPage";
import { ReciboDetailPage } from "./pages/recibos/ReciboDetailPage";
import { SyncPage } from "./pages/SyncPage";
import { UsuariosPage } from "./pages/UsuariosPage";
import { CentralPage } from "./pages/central/CentralPage";
import { DocumentCenterPage } from "./pages/documents/DocumentCenterPage";
import { TemplateManagerPage } from "./pages/central/TemplateManagerPage";
import { CalibrationPage } from "./pages/central/CalibrationPage";
import { ConflictListPage } from "./pages/central/ConflictListPage";
import { ResolveConflictPage } from "./pages/central/ResolveConflictPage";
import { ConfigPage } from "./pages/ConfigPage";
import { HelpPage } from "./pages/HelpPage";

export const router = createBrowserRouter([
  {
    path: "/auth/welcome",
    element: <WelcomeSetupPage />,
  },
  {
    path: "/auth/login",
    element: <LoginPage />,
  },
  {
    path: "/auth/activate-admin",
    element: <ActivateAdminPage />,
  },
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "tramites", element: <TramitesListPage /> },
      { path: "tramites/new", element: <NewTramitePage /> },
      { path: "tramites/:id", element: <TramiteDetailPage /> },
      { path: "tramites/:id/edit", element: <EditTramitePage /> },
      { path: "tramites/:id/documents", element: <DocumentCenterPage /> },
      { path: "clientes", element: <ClientesListPage /> },
      { path: "clientes/:id", element: <ClienteDetailPage /> },
      { path: "situaciones", element: <SituacionesPage /> },
      { path: "xml", element: <XMLImportPage /> },
      { path: "xml/:id", element: <XMLReviewPage /> },
      { path: "documentos", element: <DocumentCenterPage /> },
      { path: "recibos", element: <RecibosListPage /> },
      { path: "recibos/:id", element: <ReciboDetailPage /> },
      { path: "sync", element: <SyncPage /> },
      { path: "usuarios", element: <UsuariosPage /> },
      { path: "central", element: <CentralPage /> },
      { path: "central/conflictos", element: <ConflictListPage /> },
      { path: "central/conflictos/:id", element: <ResolveConflictPage /> },
      { path: "central/templates", element: <TemplateManagerPage /> },
      { path: "central/calibration", element: <CalibrationPage /> },
      { path: "ayuda", element: <HelpPage /> },
      { path: "config", element: <ConfigPage /> },
    ],
  },
]);
