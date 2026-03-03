import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Dashboard from "../src/pages/principales/dashbord";
import Bibliotheque from "../src/pages/principales/bibliotheque";
import Finance from "../src/pages/principales/comptabilite";
import Materiel from "../src/pages/principales/materiel";
import Parametre from "../src/pages/principales/parametre";
import Login from "../src/pages/principales/login";
import Rapport from "../src/pages/principales/rapport";
import Inscription from "../src/pages/intermediare/register";

import MainLayout from "../src/component/layout";
import { ProtectedRoute } from "../src/component/ProtectedRoute";
import { AuthProvider } from "../src/context/AuthContext";
import { offlineSyncService } from "../src/service/offlineSyncService";

function App() {
  useEffect(() => {
    void offlineSyncService.init();
  }, []);

  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Page SANS layout */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Inscription />} />

        {/* Pages AVEC layout - PROTÉGÉES */}
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/bibliotheque" element={<Bibliotheque />} />
          <Route path="/finance" element={<Finance />} />
          <Route path="/materiel" element={<Materiel />} />
          <Route path="/parametre" element={<Parametre />} />
          <Route path="/rapport" element={<Rapport />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
