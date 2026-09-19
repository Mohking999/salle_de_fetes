import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import {
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import appCss from "../styles.css?url";
import { Toaster } from "@/components/ui/sonner";

/* ─── Dark Mode Context ─────────────────────────────────────── */
type DarkModeContextType = { dark: boolean; toggle: () => void };
export const DarkModeContext = createContext<DarkModeContextType>({
  dark: false,
  toggle: () => {},
});
export const useDarkMode = () => useContext(DarkModeContext);

function DarkModeProvider({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("theme") === "dark";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [dark]);

  return (
    <DarkModeContext.Provider
      value={{ dark, toggle: () => setDark((d) => !d) }}
    >
      {children}
    </DarkModeContext.Provider>
  );
}

/* ─── 404 ───────────────────────────────────────────────────── */
function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center animate-slide-up">
        <p className="text-8xl font-bold text-primary/20 select-none">404</p>
        <h1 className="mt-2 text-2xl font-bold text-foreground">
          Page introuvable
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          La page que vous cherchez n'existe pas ou a été déplacée.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20"
          >
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ─── Error ─────────────────────────────────────────────────── */
function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center animate-slide-up">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Une erreur est survenue
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Quelque chose s'est mal passé. Vous pouvez réessayer ou retourner à
          l'accueil.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90"
          >
            Réessayer
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-lg border border-input bg-background px-5 py-2.5 text-sm font-medium text-foreground transition-all hover:bg-accent"
          >
            Accueil
          </a>
        </div>
      </div>
    </div>
  );
}

/* ─── Route ─────────────────────────────────────────────────── */
export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(
  {
    head: () => ({
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { title: "Réserver une salle des fêtes — Disponibilités en direct" },
        {
          name: "description",
          content:
            "Consultez les disponibilités Journée / Fatha et Soirée / Hena de nos salles des fêtes et envoyez votre demande de réservation en quelques secondes.",
        },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        {
          property: "og:title",
          content: "Réserver une salle des fêtes — Disponibilités en direct",
        },
        {
          name: "twitter:title",
          content: "Réserver une salle des fêtes — Disponibilités en direct",
        },
      ],
      links: [
        { rel: "stylesheet", href: appCss },
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        {
          rel: "preconnect",
          href: "https://fonts.gstatic.com",
          crossOrigin: "anonymous",
        },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Alex+Brush&family=Great+Vibes&display=swap",
        },
        { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      ],
    }),
    component: RootComponent,
    notFoundComponent: NotFoundComponent,
    errorComponent: ErrorComponent,
  },
);

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <DarkModeProvider>
        <Outlet />
        <Toaster position="top-right" richColors />
      </DarkModeProvider>
    </QueryClientProvider>
  );
}
