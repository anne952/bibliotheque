import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import "./index.css";
import App from "./App";
import { queryClient, queryPersister } from './query/client';

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: queryPersister,
        maxAge: 24 * 60 * 60 * 1000,
        buster: 'v2.2.3'
      }}
    >
      <HashRouter>
        <App />
      </HashRouter>
    </PersistQueryClientProvider>
  </StrictMode>
);
