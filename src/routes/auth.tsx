import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Crown, Eye, EyeOff } from "lucide-react";
import { useDarkMode } from "@/routes/__root";
import { Moon, Sun } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Espace gérant — Connexion | Salle des Fêtes" },
      {
        name: "description",
        content:
          "Connectez-vous à votre espace gérant pour gérer le calendrier, les réservations et les versements de votre salle des fêtes.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { dark, toggle } = useDarkMode();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem("auth_user");
    if (user) navigate({ to: "/dashboard", replace: true });
    else {
      localStorage.setItem(
        "auth_user",
        JSON.stringify({ email: "demo@local", name: "Demo" }),
      );
      navigate({ to: "/dashboard", replace: true });
    }
  }, [navigate]);

  async function signIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    localStorage.setItem(
      "auth_user",
      JSON.stringify({ email: email || "demo@local", name: "Demo" }),
    );
    setLoading(false);
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center px-4 py-12">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_oklch(0.46_0.19_265_/_12%)_0%,_transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_oklch(0.75_0.13_80_/_10%)_0%,_transparent_55%)]" />

      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-4">
        <div className="text-sm text-muted-foreground">Admin Login</div>
        <button
          onClick={toggle}
          className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors"
          title={dark ? "Mode clair" : "Mode sombre"}
        >
          {dark ? (
            <Sun className="h-4 w-4 text-amber-400" />
          ) : (
            <Moon className="h-4 w-4 text-indigo-400" />
          )}
        </button>
      </div>

      <div className="relative w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25 mb-4">
            <Crown className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold">Salle des Fêtes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Espace Gérant - Mode Démo
          </p>
        </div>

        <Card className="shadow-xl shadow-black/5 border-border/60">
          <CardHeader className="pb-4 text-center">
            <CardTitle className="text-xl">Bienvenue</CardTitle>
            <CardDescription>
              Gérez votre calendrier, réservations et encaissements.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={signIn} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="signin-email" className="font-semibold text-sm">
                  Adresse e-mail
                </Label>
                <Input
                  id="signin-email"
                  type="email"
                  required
                  placeholder="vous@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10 transition-shadow focus:shadow-sm focus:shadow-primary/10"
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="signin-password"
                  className="font-semibold text-sm"
                >
                  Mot de passe
                </Label>
                <div className="relative">
                  <Input
                    id="signin-password"
                    type={showPwd ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-10 pr-10 transition-shadow focus:shadow-sm focus:shadow-primary/10"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowPwd((v) => !v)}
                  >
                    {showPwd ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                id="signin-submit"
                type="submit"
                className="w-full h-10 font-semibold shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                    Ouverture...
                  </span>
                ) : (
                  "Ouvrir l'espace gérant"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Mode hors-ligne — les données sont stockées localement dans votre
          navigateur.
        </p>
      </div>
    </div>
  );
}
