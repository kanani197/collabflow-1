import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { DatasetProvider } from "./context/DatasetContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <DatasetProvider>
          <App />
        </DatasetProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
