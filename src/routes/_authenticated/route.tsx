import {
  createFileRoute,
  Outlet,
  redirect,
  Link,
} from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  LineChart,
  Moon,
  Sun,
  Crown,
  DatabaseBackup,
  FolderOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDarkMode } from "@/routes/__root";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const user = localStorage.getItem("auth_user") ?? JSON.stringify({ email: "demo@local", name: "Demo" });
    return { user: JSON.parse(user) };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const queryClient = useQueryClient();
  const { dark, toggle } = useDarkMode();

  async function backup() {
    try {
      const api = window.desktop?.database;
      if (!api) return;
      const result = await api.backup();
      if (!result?.canceled) alert(`Sauvegarde créée : ${result.filePath}`);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Échec de la sauvegarde.");
    }
  }

  async function restore() {
    if (!window.confirm("Restaurer une sauvegarde remplacera les données actuelles. Continuer ?")) return;
    try {
      const api = window.desktop?.database;
      if (!api) return;
      const result = await api.restore(true);
      if (!result?.canceled) {
        queryClient.invalidateQueries();
        alert("Sauvegarde restaurée avec succès.");
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : "Échec de la restauration.");
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Premium Navigation Header */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-card/80 backdrop-blur-md shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
          {/* Brand */}
          <Link
            to="/dashboard"
            className="flex items-center gap-2 group shrink-0"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm group-hover:shadow-primary/30 group-hover:scale-105 transition-all duration-200">
              <Crown className="h-4 w-4" />
            </div>
            <span className="text-display font-semibold text-foreground hidden sm:inline">
              Salle des Fêtes
            </span>
          </Link>

          <div className="h-5 w-px bg-border hidden sm:block" />

          {/* Nav Links */}
          <nav className="flex items-center gap-1">
            <Link
              to="/dashboard"
              activeProps={{
                className: "bg-primary/10 text-primary font-semibold",
              }}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-foreground/70 hover:bg-secondary hover:text-foreground transition-all duration-150"
            >
              <CalendarDays className="h-4 w-4" />
              <span>Calendrier</span>
            </Link>
            <Link
              to="/revenus"
              activeProps={{
                className: "bg-primary/10 text-primary font-semibold",
              }}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-foreground/70 hover:bg-secondary hover:text-foreground transition-all duration-150"
            >
              <LineChart className="h-4 w-4" />
              <span>Revenus</span>
            </Link>
          </nav>

          {/* Right actions */}
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-8" onClick={backup} title="Créer une sauvegarde locale">
              <DatabaseBackup className="h-3.5 w-3.5 sm:mr-1.5" />
              <span className="hidden sm:inline">Sauvegarde</span>
            </Button>
            <Button variant="ghost" size="sm" className="h-8" onClick={restore} title="Restaurer une sauvegarde">
              <FolderOpen className="h-3.5 w-3.5 sm:mr-1.5" />
              <span className="hidden sm:inline">Restaurer</span>
            </Button>
            {/* Dark mode toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg hover:bg-secondary"
              onClick={toggle}
              title={dark ? "Mode clair" : "Mode sombre"}
            >
              {dark ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-indigo-400" />
              )}
            </Button>

          </div>
        </div>
      </header>

      <Outlet />
    </div>
  );
}
