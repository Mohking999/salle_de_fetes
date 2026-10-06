import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { getRouter } from "./router";
import { ActivationGate } from "./components/licensing/ActivationGate";
import "./styles.css";

const router = getRouter();
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ActivationGate>
      <RouterProvider router={router} />
    </ActivationGate>
  </StrictMode>,
);
