import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { getRevenue } from "@/lib/booking.functions";
import { computeTotals, formatMoney } from "@/lib/booking-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TrendingUp, Wallet, Clock, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/revenus")({
  head: () => ({
    meta: [
      { title: "Revenus & encaissements — Espace gérant" },
      {
        name: "description",
        content:
          "Suivi mensuel et annuel des encaissements, remises accordées et montants restant dus par salle et par gérant.",
      },
    ],
  }),
  component: RevenuePage,
});

const MONTHS = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

const MONTH_COLORS = [
  "oklch(0.56 0.14 265)", // violet
  "oklch(0.56 0.14 265)",
  "oklch(0.56 0.14 295)", // indigo
  "oklch(0.56 0.14 295)",
  "oklch(0.56 0.14 145)", // emerald
  "oklch(0.56 0.14 145)",
  "oklch(0.65 0.14 80)", // amber
  "oklch(0.65 0.14 80)",
  "oklch(0.56 0.14 40)", // orange
  "oklch(0.56 0.14 40)",
  "oklch(0.56 0.14 25)", // red
  "oklch(0.56 0.14 25)",
];

/* ─── SVG Bar Chart ─────────────────────────────────────────── */
function RevenueBarChart({
  monthly,
}: {
  monthly: { label: string; brut: number; verse: number; reste: number }[];
}) {
  const maxVal = Math.max(...monthly.map((m) => m.brut), 1);
  const chartH = 160;
  const barW = 20;
  const gapW = 8;
  const totalW = monthly.length * (barW * 2 + gapW + 12);

  return (
    <div className="overflow-x-auto pb-2">
      <svg
        width={totalW}
        height={chartH + 48}
        className="min-w-full"
        role="img"
        aria-label="Graphique des revenus mensuels"
      >
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
          const y = chartH - pct * chartH;
          return (
            <g key={pct}>
              <line
                x1={0}
                y1={y}
                x2={totalW}
                y2={y}
                stroke="oklch(0.88 0.02 260)"
                strokeWidth={1}
                strokeDasharray="4 4"
              />
              {pct > 0 && (
                <text
                  x={2}
                  y={y - 3}
                  fontSize={9}
                  fill="oklch(0.52 0.025 260)"
                  className="font-mono"
                >
                  {Math.round((maxVal * pct) / 1000)}k
                </text>
              )}
            </g>
          );
        })}

        {/* Bars */}
        {monthly.map((m, i) => {
          const x = i * (barW * 2 + gapW + 12) + 30;
          const brutH = Math.max(
            (m.brut / maxVal) * chartH,
            m.brut > 0 ? 3 : 0,
          );
          const verseH = Math.max(
            (m.verse / maxVal) * chartH,
            m.verse > 0 ? 3 : 0,
          );
          const color = MONTH_COLORS[i];
          const shortLabel = m.label.slice(0, 3);

          return (
            <g key={m.label}>
              {/* Brut bar (full) */}
              <rect
                x={x}
                y={chartH - brutH}
                width={barW}
                height={brutH}
                rx={3}
                fill={color}
                opacity={0.3}
              />
              {/* Versé bar (collected) */}
              <rect
                x={x}
                y={chartH - verseH}
                width={barW}
                height={verseH}
                rx={3}
                fill={color}
                opacity={0.9}
              />
              {/* Reste bar */}
              <rect
                x={x + barW + 4}
                y={
                  chartH -
                  Math.max((m.reste / maxVal) * chartH, m.reste > 0 ? 2 : 0)
                }
                width={barW - 4}
                height={Math.max(
                  (m.reste / maxVal) * chartH,
                  m.reste > 0 ? 2 : 0,
                )}
                rx={3}
                fill="oklch(0.55 0.18 25)"
                opacity={0.7}
              />
              {/* Month label */}
              <text
                x={x + barW - 2}
                y={chartH + 14}
                textAnchor="middle"
                fontSize={10}
                fontWeight="600"
                fill="oklch(0.52 0.025 260)"
              >
                {shortLabel}
              </text>
            </g>
          );
        })}
      </svg>
      {/* Legend */}
      <div className="flex items-center gap-6 mt-3 text-xs text-muted-foreground pl-8">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-primary/30 inline-block" />
          Montant brut
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-primary/90 inline-block" />
          Encaissé
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm bg-red-400 inline-block" />
          Reste à recouvrer
        </span>
      </div>
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────── */
function RevenuePage() {
  const fetchRevenue = getRevenue;
  const [year, setYear] = useState(new Date().getFullYear());
  const [gerantId, setGerantId] = useState<string | null>(null);

  const { data } = useQuery(
    queryOptions({
      queryKey: ["revenue", year, gerantId],
      queryFn: () => fetchRevenue({ data: { year, gerant_id: gerantId } }),
    }),
  );

  const monthly = useMemo(() => {
    const base = MONTHS.map((label) => ({
      label,
      reservations: 0,
      brut: 0,
      remise: 0,
      verse: 0,
      reste: 0,
    }));
    for (const r of data?.rows ?? []) {
      if (r.status === "cancelled" || r.status === "blocked") continue;
      const idx = Number(r.date.slice(5, 7)) - 1;
      const t = computeTotals({
        total_amount: r.total_amount,
        versements: r.versements.map((v: any) => ({
          ...v,
          id: "",
          reservation_id: "",
          payment_method: "",
          note: null,
        })),
        remises: r.remises.map((x: any) => ({
          ...x,
          id: "",
          reservation_id: "",
          comment: null,
          created_at: "",
        })),
      });
      base[idx].reservations += 1;
      base[idx].brut += t.total;
      base[idx].remise += t.remise;
      base[idx].verse += t.verse;
      base[idx].reste += t.reste;
    }
    return base;
  }, [data]);

  const totals = monthly.reduce(
    (a, m) => ({
      reservations: a.reservations + m.reservations,
      brut: a.brut + m.brut,
      remise: a.remise + m.remise,
      verse: a.verse + m.verse,
      reste: a.reste + m.reste,
    }),
    { reservations: 0, brut: 0, remise: 0, verse: 0, reste: 0 },
  );

  const years = Array.from(
    { length: 5 },
    (_, i) => new Date().getFullYear() - 2 + i,
  );
  const collectionRate =
    totals.brut > 0 ? Math.round((totals.verse / totals.brut) * 100) : 0;

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 space-y-6 animate-fade-in">
      {/* ── Header ───────────────────────────────────── */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2.5">
            Revenus & Encaissements
            <Badge variant="outline" className="text-sm font-bold">
              {year}
            </Badge>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Suivi mensuel des encaissements, remises et montants restant dus.
          </p>
        </div>
        <div className="flex gap-2">
          <Select
            value={String(year)}
            onValueChange={(v) => setYear(Number(v))}
          >
            <SelectTrigger id="year-select" className="w-32 font-semibold h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {data?.isAdmin && (
            <Select
              value={gerantId ?? "all"}
              onValueChange={(v) => setGerantId(v === "all" ? null : v)}
            >
              <SelectTrigger className="w-52 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les gérants</SelectItem>
                {data.gerants.map((g: any) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* ── KPI Cards ────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-slide-up">
        {[
          {
            icon: BarChart3,
            label: "Réservations",
            value: String(totals.reservations),
            colorCls: "bg-primary/10 text-primary",
          },
          {
            icon: TrendingUp,
            label: "Chiffre d'affaires brut",
            value: formatMoney(totals.brut),
            colorCls: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
          },
          {
            icon: Wallet,
            label: "Total encaissé",
            value: formatMoney(totals.verse),
            sub: `Taux ${collectionRate}%`,
            colorCls:
              "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
          },
          {
            icon: Clock,
            label: "Reste à recouvrer",
            value: formatMoney(totals.reste),
            colorCls: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
          },
        ].map((k) => (
          <Card key={k.label} className="overflow-hidden">
            <CardContent className="p-5 flex items-start gap-4">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl shrink-0 ${k.colorCls}`}
              >
                <k.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {k.label}
                </p>
                <p className="text-xl font-bold text-foreground mt-0.5 truncate">
                  {k.value}
                </p>
                {k.sub && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {k.sub}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Bar Chart ────────────────────────────────── */}
      <Card
        className="shadow-sm animate-slide-up"
        style={{ animationDelay: "0.1s" }}
      >
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Visualisation mensuelle {year}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RevenueBarChart monthly={monthly} />
        </CardContent>
      </Card>

      {/* ── Monthly Table ─────────────────────────────── */}
      <Card
        className="shadow-sm animate-slide-up"
        style={{ animationDelay: "0.15s" }}
      >
        <CardHeader>
          <CardTitle className="text-lg">Détail mensuel {year}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="font-bold text-xs uppercase tracking-wide">
                  Mois
                </TableHead>
                <TableHead className="text-right font-bold text-xs uppercase tracking-wide">
                  Réservations
                </TableHead>
                <TableHead className="text-right font-bold text-xs uppercase tracking-wide">
                  Brut
                </TableHead>
                <TableHead className="text-right font-bold text-xs uppercase tracking-wide">
                  Remises
                </TableHead>
                <TableHead className="text-right font-bold text-xs uppercase tracking-wide">
                  Encaissé
                </TableHead>
                <TableHead className="text-right font-bold text-xs uppercase tracking-wide">
                  Reste
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {monthly.map((m, i) => (
                <TableRow
                  key={m.label}
                  className={`transition-colors hover:bg-muted/20 ${m.reservations === 0 ? "opacity-50" : ""}`}
                >
                  <TableCell className="font-semibold flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: MONTH_COLORS[i] }}
                    />
                    {m.label}
                    {m.reservations > 0 && (
                      <Badge
                        variant="secondary"
                        className="text-[10px] px-1.5 py-0"
                      >
                        {m.reservations}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {m.reservations > 0 ? m.reservations : "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-medium">
                    {m.brut > 0 ? formatMoney(m.brut) : "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                    {m.remise > 0 ? `− ${formatMoney(m.remise)}` : "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums font-semibold text-primary">
                    {m.verse > 0 ? formatMoney(m.verse) : "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-amber-600 dark:text-amber-400">
                    {m.reste > 0 ? formatMoney(m.reste) : "—"}
                  </TableCell>
                </TableRow>
              ))}
              {/* Totals row */}
              <TableRow className="bg-muted/30 font-bold border-t-2 border-border hover:bg-muted/30">
                <TableCell className="font-extrabold">Total {year}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {totals.reservations}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatMoney(totals.brut)}
                </TableCell>
                <TableCell className="text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                  − {formatMoney(totals.remise)}
                </TableCell>
                <TableCell className="text-right tabular-nums text-primary">
                  {formatMoney(totals.verse)}
                </TableCell>
                <TableCell className="text-right tabular-nums text-amber-600 dark:text-amber-400">
                  {formatMoney(totals.reste)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
