import React from "react";
import ReactDOM from "react-dom/client";

import "@mantine/core/styles.css";
// Date pickers (DateInput in History, Record Leave, Create Task) need their own styles.
import "@mantine/dates/styles.css";
import { App } from "./App";
import { AppProviders } from "./app/AppProviders";
import "./styles.css";
import "./theme/index.css";
const rootElement = document.getElementById("root");

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <AppProviders>
        <App />
      </AppProviders>
    </React.StrictMode>,
  );
}
