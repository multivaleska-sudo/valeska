import { createBrowserRouter } from "react-router";
import { AppShell } from "./components/AppShell";
import { LoginPage } from "./pages/auth/LoginPage";
import { WelcomeSetupPage } from "./pages/auth/WelcomeSetupPage";
import { ForgotPasswordPage } from "./pages/auth/ForgotPasswordPage";
import { DashboardPage } from "./pages/DashboardPage";
import { TramitesListPage } from "./pages/tramites/TramitesListPage";
import { TramiteDetailPage } from "./pages/tramites/TramiteDetailPage";
import { NewTramitePage } from "./pages/tramites/NewTramitePage";
import { EditTramitePage } from "./pages/tramites/EditTramitePage";
import { EmpresaListPage } from "./pages/empresas/EmpresaListPage";
import { EmpresaForm } from "./pages/empresas/EmpresaForm";
import { SituacionesPage } from "./pages/SituacionesPage";
import { XmlEditorPage } from "./pages/xml/XMLEditorPage";
import { RecibosListPage } from "./pages/recibos/RecibosListPage";
import { ReciboDetailPage } from "./pages/recibos/ReciboDetailPage";
import { SyncPage } from "./pages/SyncPage";
import { UsuariosPage } from "./pages/usuarios/UsuariosPage";
import { CentralPage } from "./pages/central/CentralPage";
import { DocumentCenterPage } from "./pages/documents/DocumentCenterPage";
import { ConflictListPage } from "./pages/central/ConflictListPage";
import { ResolveConflictPage } from "./pages/central/ResolveConflictPage";
import { ConfigPage } from "./pages/ConfigPage";
import CatalogosPage from "./pages/catalogos/CatalogosPage";
import { HelpPage } from "./pages/HelpPage";
import { TemplateEditorPage } from "./pages/documents/TemplateEditorPage";
import { PrintDocumentPage } from "./pages/documents/PrintDocumentPage";
import { DevicesPage } from "./pages/central/DevicesPage";

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
    path: "/auth/forgot-password",
    element: <ForgotPasswordPage />,
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
      { path: "empresas", element: <EmpresaListPage /> },
      { path: "empresas/form", element: <EmpresaForm /> },
      { path: "empresas/form/:id", element: <EmpresaForm /> },
      { path: "situaciones", element: <SituacionesPage /> },
      { path: "xml", element: <XmlEditorPage /> },
      { path: "documentos", element: <DocumentCenterPage /> },
      { path: "recibos", element: <RecibosListPage /> },
      { path: "recibos/:id", element: <ReciboDetailPage /> },
      { path: "sync", element: <SyncPage /> },
      { path: "usuarios", element: <UsuariosPage /> },
      { path: "central", element: <CentralPage /> },
      { path: "central/conflictos", element: <ConflictListPage /> },
      { path: "central/conflictos/:id", element: <ResolveConflictPage /> },
      { path: "central/devices", element: <DevicesPage /> },
      { path: "ayuda", element: <HelpPage /> },
      { path: "config", element: <ConfigPage /> },
      { path: "catalogos", element: <CatalogosPage /> },
      { path: "plantillas/:id/edit", element: <TemplateEditorPage /> },
      { path: "plantillas/new", element: <TemplateEditorPage /> },
      {
        path: "tramites/:tramiteId/print/:templateId",
        element: <PrintDocumentPage />,
      },
    ],
  },
]);
