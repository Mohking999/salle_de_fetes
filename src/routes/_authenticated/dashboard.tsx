import { createFileRoute } from "@tanstack/react-router";
import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import {
  CalendarDays,
  Download,
  FileText,
  Plus,
  Trash2,
  Utensils,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  Eye,
  Building2,
  Sparkles,
  Search,
  Filter,
  TrendingUp,
  Wallet,
  Clock,
  BadgeCheck,
  X,
  Percent,
  Tag,
} from "lucide-react";
import {
  addRemise,
  addVersement,
  createSalle,
  deleteReservation,
  deleteVersement,
  getManagerMonth,
  saveReservation,
  setReservationStatus,
  updateIdCardStatus,
} from "@/lib/booking.functions";
import {
  computeTotals,
  COOKING_LAB_LABEL,
  COOKING_LABS,
  EVENT_TYPE_LABEL,
  EVENT_TYPES,
  formatDateFr,
  formatMoney,
  ID_CARD_STATUS_LABEL,
  monthKey,
  PAYMENT_METHODS,
  SHIFT_LABEL,
  SLOTS,
  SLOT_LABEL,
  STATUS_LABEL,
  type CookingLabId,
  type EventType,
  type IdCardStatus,
  type Reservation,
  type ReservationStatus,
  type Slot,
} from "@/lib/booking-types";
import { exportMonthIcs, exportMonthXlsx } from "@/lib/exports";
import { generateReceipt } from "@/lib/receipt";
import {
  MonthGrid,
  StatusLegend,
  type CellInfo,
} from "@/components/booking/MonthGrid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      {
        title:
          "Dashboard Admin — Salles, Laboratoires de Cuisine & Cartes d'Identité",
      },
      {
        name: "description",
        content:
          "Espace d'administration complet : Gestion du calendrier, attribution des 3 laboratoires de cuisine et vérification des pièces d'identité.",
      },
    ],
  }),
  component: DashboardPage,
});

/* ─── KPI Card ──────────────────────────────────────────────── */
function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  colorCls,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  colorCls: string;
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5 flex items-start gap-4">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl shrink-0 ${colorCls}`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {label}
          </p>
          <p className="text-2xl font-bold text-foreground mt-0.5">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Main Page ─────────────────────────────────────────────── */
function DashboardPage() {
  const qc = useQueryClient();
  const fetchMonth = getManagerMonth;
  const [month, setMonth] = useState(() => monthKey(new Date()));
  const [gerantId, setGerantId] = useState<string | null>(null);
  const [selected, setSelected] = useState<{
    date: string;
    slot: Slot;
    salleId: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<"calendar" | "labs" | "idcards">(
    "calendar",
  );
  const [isNewReservationOpen, setIsNewReservationOpen] = useState(false);
  const [newSalleId, setNewSalleId] = useState<string | null>(null);
  const [newDate, setNewDate] = useState(`${month}-01`);
  const [newSlot, setNewSlot] = useState<Slot>("journee");
  const [newEventType, setNewEventType] = useState<EventType>("event");
  const [newEventTime, setNewEventTime] = useState<string>("");
  const [newEventEndTime, setNewEventEndTime] = useState<string>("");
  const [newCookingLabId, setNewCookingLabId] = useState<CookingLabId>("none");
  const [newClientName, setNewClientName] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [newIdCardNumber, setNewIdCardNumber] = useState("");
  const [newIdCardStatus, setNewIdCardStatus] =
    useState<IdCardStatus>("not_provided");
  const [newStatus, setNewStatus] = useState<ReservationStatus>("pending");
  const [newTotal, setNewTotal] = useState("0");
  const [newNote, setNewNote] = useState("");

  // Search / filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | "all">(
    "all",
  );
  const [eventFilter, setEventFilter] = useState<EventType | "all">("all");

  // ID Card Viewer Modal
  const [viewingIdCard, setViewingIdCard] = useState<Reservation | null>(null);

  const { data, isLoading } = useQuery(
    queryOptions({
      queryKey: ["manager-month", month, gerantId],
      queryFn: () => fetchMonth({ data: { month, gerant_id: gerantId } }),
    }),
  );

  const salles = data?.salles ?? [];
  const reservations = useMemo(
    () => (data?.reservations ?? []) as Reservation[],
    [data?.reservations],
  );

  // Filtered reservation list for Labs / ID tabs
  const filteredReservations = useMemo(() => {
    return reservations.filter((r) => {
      const matchSearch =
        !searchQuery ||
        r.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.client_phone ?? "").includes(searchQuery);
      const matchStatus = statusFilter === "all" || r.status === statusFilter;
      const matchEvent = eventFilter === "all" || r.event_type === eventFilter;
      return matchSearch && matchStatus && matchEvent;
    });
  }, [reservations, searchQuery, statusFilter, eventFilter]);

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["manager-month"] });

  const mutate = <T,>(
    fn: (args: { data: T }) => Promise<unknown>,
    success: string,
  ) => ({
    mutationFn: (payload: T) => fn({ data: payload }),
    onSuccess: () => {
      toast.success(success);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const saveMut = useMutation(
    mutate(saveReservation as never, "Réservation enregistrée"),
  );
  const statusMut = useMutation(
    mutate(setReservationStatus as never, "Statut mis à jour"),
  );
  const deleteMut = useMutation(
    mutate(deleteReservation as never, "Réservation supprimée"),
  );
  const versementMut = useMutation(
    mutate(addVersement as never, "Versement enregistré"),
  );
  const versementDelMut = useMutation(
    mutate(deleteVersement as never, "Versement supprimé"),
  );
  const remiseMut = useMutation(
    mutate(addRemise as never, "Remise appliquée"),
  );
  const salleMut = useMutation(
    mutate(createSalle as never, "Salle créée"),
  );
  const idCardStatusMut = useMutation(
    mutate(
      updateIdCardStatus as never,
      "Statut carte d'identité mis à jour",
    ),
  );

  const current =
    selected &&
    reservations.find(
      (r) =>
        r.date === selected.date &&
        r.slot === selected.slot &&
        r.salle_id === selected.salleId &&
        r.status !== "cancelled",
    );

  function getCell(date: string, slot: Slot): CellInfo {
    const cellSalles = salles.map((salle: any) => {
      const r = reservations.find(
        (x) =>
          x.salle_id === salle.id &&
          x.date === date &&
          x.slot === slot &&
          x.status !== "cancelled",
      );
      if (!r) return { id: salle.id, status: "available" as const };
      return {
        id: salle.id,
        status: r.status,
        label:
          r.status === "blocked"
            ? "Bloquée"
            : r.client_name || STATUS_LABEL[r.status],
        eventType: r.event_type,
        cookingLabId: r.cooking_lab_id,
      };
    });
    return { salles: cellSalles };
  }

  // KPI calculations
  const confirmedRevenue = reservations
    .filter((r) => r.status === "confirmed")
    .reduce((sum, r) => sum + computeTotals(r).verse, 0);
  const pendingCount = reservations.filter(
    (r) => r.status === "pending",
  ).length;
  const pendingRevenue = reservations
    .filter((r) => r.status === "pending")
    .reduce((s, r) => s + r.total_amount, 0);
  const pendingIdCount = reservations.filter(
    (r) => r.id_card_status === "pending",
  ).length;
  const verifiedIdCount = reservations.filter(
    (r) => r.id_card_status === "verified",
  ).length;
  const missingIdCount = reservations.filter(
    (r) => r.id_card_status === "not_provided",
  ).length;

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 space-y-6 animate-fade-in">
      {/* ── Page Header ────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2.5">
            Espace Gérant Admin
            <Badge className="bg-primary/15 text-primary border-primary/25 hover:bg-primary/15">
              Dashboard
            </Badge>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestion des réservations · 3 Laboratoires de Cuisine · Cartes
            d'Identité
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setIsNewReservationOpen(true);
              setNewSalleId(selected?.salleId ?? salles[0]?.id ?? null);
              setNewDate(selected?.date ?? `${month}-01`);
              setNewSlot(selected?.slot ?? "journee");
              setNewEventType("event");
              setNewEventTime("");
              setNewCookingLabId("none");
              setNewClientName("");
              setNewClientPhone("");
              setNewIdCardNumber("");
              setNewIdCardStatus("not_provided");
              setNewStatus("pending");
              setNewTotal("0");
              setNewNote("");
              setActiveTab("calendar");
            }}
          >
            <Plus className="mr-1.5 h-4 w-4" /> Nouvelle réservation
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              exportMonthXlsx(
                month,
                reservations,
                salles,
              )
            }
          >
            <Download className="mr-1.5 h-4 w-4" /> .xlsx
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportMonthIcs(month, reservations, salles)}
          >
            <CalendarDays className="mr-1.5 h-4 w-4" /> .ics
          </Button>
        </div>
      </div>

      {/* ── KPI Stats ──────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 animate-slide-up">
        <KpiCard
          icon={CalendarDays}
          label="Réservations ce mois"
          value={String(reservations.length)}
          sub={`${pendingCount} en attente`}
          colorCls="bg-primary/10 text-primary"
        />
        <KpiCard
          icon={Wallet}
          label="Encaissé (confirmées)"
          value={formatMoney(confirmedRevenue)}
          sub="Total versements"
          colorCls="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        />
        <KpiCard
          icon={Clock}
          label="En attente"
          value={String(pendingCount)}
          sub={formatMoney(pendingRevenue) + " potentiels"}
          colorCls="bg-amber-500/10 text-amber-600 dark:text-amber-400"
        />
        <KpiCard
          icon={BadgeCheck}
          label="Pièces d'identité"
          value={`${verifiedIdCount} / ${reservations.length}`}
          sub={`${pendingIdCount} à vérifier · ${missingIdCount} manquantes`}
          colorCls="bg-violet-500/10 text-violet-600 dark:text-violet-400"
        />
      </div>

      {/* ── Main Tabs ──────────────────────────────────── */}
      <Tabs
        value={activeTab}
        onValueChange={(v) =>
          setActiveTab(v as "calendar" | "labs" | "idcards")
        }
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-3 max-w-xl h-10">
          <TabsTrigger
            value="calendar"
            className="font-semibold text-xs sm:text-sm flex items-center gap-1.5"
          >
            <CalendarDays className="h-4 w-4" />
            <span className="hidden sm:inline">Calendrier &</span> Créneaux
          </TabsTrigger>
          <TabsTrigger
            value="labs"
            className="font-semibold text-xs sm:text-sm flex items-center gap-1.5"
          >
            <Utensils className="h-4 w-4 text-amber-500" />
            <span className="hidden sm:inline">3</span> Labs
            <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">
              3
            </Badge>
          </TabsTrigger>
          <TabsTrigger
            value="idcards"
            className="font-semibold text-xs sm:text-sm flex items-center gap-1.5"
          >
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span className="hidden sm:inline">Cartes ID</span>
            {pendingIdCount > 0 && (
              <Badge className="ml-1 bg-amber-500 text-white text-[10px] px-1.5 py-0">
                {pendingIdCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── TAB 1: CALENDAR ─────────────────────────── */}
        <TabsContent value="calendar" className="space-y-6">
          {salles.length === 0 && !isLoading && (
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Créez votre première salle
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  className="flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const input = new FormData(e.currentTarget).get(
                      "name",
                    ) as string;
                    if (input?.trim())
                      salleMut.mutate({ name: input.trim() } as never);
                    e.currentTarget.reset();
                  }}
                >
                  <Input
                    name="name"
                    placeholder="Salle 01"
                    className="max-w-xs"
                    required
                  />
                  <Button type="submit">
                    <Plus className="mr-1.5 h-4 w-4" /> Ajouter
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
            <Card className="shadow-sm">
              <CardContent className="pt-6">
                <MonthGrid
                  month={month}
                  onMonthChange={setMonth}
                  getCell={getCell}
                  onSelect={(date, slot, salleId) =>
                    setSelected({ date, slot, salleId })
                  }
                  selected={selected}
                  salles={salles}
                />
                <Separator className="my-4" />
                <StatusLegend />
              </CardContent>
            </Card>

            <div className="lg:sticky lg:top-20 lg:self-start">
              {!selected ? (
                <Card className="border-dashed">
                  <CardContent className="py-16 text-center text-sm text-muted-foreground">
                    <CalendarDays className="mx-auto h-10 w-10 opacity-25 mb-3" />
                    <p className="font-medium">Sélectionnez un créneau</p>
                    <p className="text-xs mt-1 text-muted-foreground/70">
                      Cliquez sur un créneau Jour ou Nuit dans le calendrier
                      pour gérer la réservation.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <SlotPanel
                  key={`${selected.date}-${selected.slot}-${selected.salleId}-${current?.id ?? "new"}`}
                  date={selected.date}
                  slot={selected.slot}
                  salleId={selected.salleId}
                  salleName={
                    salles.find((s: any) => s.id === selected.salleId)?.name ?? "Salle"
                  }
                  reservation={current ?? null}
                  isAdmin={!!data?.isAdmin}
                  onSave={(p) => saveMut.mutate(p as never)}
                  onStatus={(p) => statusMut.mutate(p as never)}
                  onDelete={(p) => deleteMut.mutate(p as never)}
                  onVersement={(p) => versementMut.mutate(p as never)}
                  onVersementDelete={(p) => versementDelMut.mutate(p as never)}
                  onRemise={(p) => remiseMut.mutate(p as never)}
                  onViewIdCard={(res) => setViewingIdCard(res)}
                />
              )}
            </div>
          </div>
        </TabsContent>

        {/* ── TAB 2: COOKING LABS ─────────────────────── */}
        <TabsContent value="labs" className="space-y-6">
          {/* Lab cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            {COOKING_LABS.filter((l) => l.id !== "none").map((lab) => {
              const assignedCount = reservations.filter(
                (r) => r.cooking_lab_id === lab.id,
              ).length;
              return (
                <Card
                  key={lab.id}
                  className="border-amber-500/15 bg-gradient-to-br from-amber-500/5 to-transparent overflow-hidden"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className="bg-amber-600 text-white font-bold">
                        {lab.tag}
                      </Badge>
                      <span className="text-xs font-semibold text-muted-foreground bg-muted/60 rounded-full px-2 py-0.5">
                        {assignedCount} rés.
                      </span>
                    </div>
                    <CardTitle className="text-base font-bold">
                      {lab.name}
                    </CardTitle>
                    <CardDescription className="text-xs leading-relaxed">
                      {lab.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Separator className="mb-3" />
                    <p className="text-[11px] font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                      Équipements
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {lab.equipment.map((eq) => (
                        <Badge
                          key={eq}
                          variant="outline"
                          className="text-[10px] bg-card font-medium"
                        >
                          {eq}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Search + Filter bar */}
          <SearchFilterBar
            searchQuery={searchQuery}
            onSearch={setSearchQuery}
            statusFilter={statusFilter}
            onStatusFilter={(v) =>
              setStatusFilter(v as ReservationStatus | "all")
            }
            eventFilter={eventFilter}
            onEventFilter={(v) => setEventFilter(v as EventType | "all")}
          />

          {/* Labs planning table */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Planning des 3 Laboratoires de Cuisine</span>
                <Badge variant="outline">
                  {filteredReservations.length} résultat(s)
                </Badge>
              </CardTitle>
              <CardDescription>
                Attribuez et suivez le laboratoire de cuisine réservé pour
                chaque événement.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted/40 text-xs font-bold text-muted-foreground uppercase tracking-wide border-b border-border">
                    <tr>
                      <th className="p-3">Date & Créneau</th>
                      <th className="p-3">Client</th>
                      <th className="p-3">Événement</th>
                      <th className="p-3">Laboratoire</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredReservations.map((r) => (
                      <tr
                        key={r.id}
                        className="hover:bg-muted/20 transition-colors"
                      >
                        <td className="p-3">
                          <div className="font-semibold">
                            {formatDateFr(r.date)}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            {r.slot === "journee" ? "☀️" : "🌙"}{" "}
                            {SLOT_LABEL[r.slot]}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="font-medium">
                            {r.client_name || "Client anonyme"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {r.client_phone || "—"}
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge
                            className={
                              EVENT_TYPES.find((e) => e.value === r.event_type)
                                ?.badgeCls + " text-[11px]"
                            }
                          >
                            {EVENT_TYPE_LABEL[r.event_type ?? "event"]}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <Select
                            value={r.cooking_lab_id ?? "none"}
                            onValueChange={(v) =>
                              saveMut.mutate({
                                ...r,
                                cooking_lab_id: v as CookingLabId,
                              } as never)
                            }
                          >
                            <SelectTrigger className="w-48 h-8 text-xs font-semibold">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {COOKING_LABS.map((lab) => (
                                <SelectItem
                                  key={lab.id}
                                  value={lab.id}
                                  className="text-xs"
                                >
                                  {lab.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="p-3 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => {
                              setSelected({ date: r.date, slot: r.slot, salleId: r.salle_id });
                              setActiveTab("calendar");
                            }}
                          >
                            Détails
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {filteredReservations.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="p-8 text-center text-sm text-muted-foreground"
                        >
                          Aucune réservation ne correspond aux filtres.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TAB 3: ID CARDS ─────────────────────────── */}
        <TabsContent value="idcards" className="space-y-6">
          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="border-emerald-500/20 bg-emerald-500/5">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0">
                  <BadgeCheck className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
                    Vérifiées
                  </p>
                  <p className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">
                    {verifiedIdCount}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-amber-500/20 bg-amber-500/5">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 shrink-0">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide">
                    En attente
                  </p>
                  <p className="text-3xl font-bold text-amber-900 dark:text-amber-100">
                    {pendingIdCount}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-red-500/20 bg-red-500/5">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-500/15 text-red-600 dark:text-red-400 shrink-0">
                  <ShieldAlert className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-red-700 dark:text-red-400 uppercase tracking-wide">
                    Non fournies
                  </p>
                  <p className="text-3xl font-bold text-red-900 dark:text-red-100">
                    {missingIdCount}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <SearchFilterBar
            searchQuery={searchQuery}
            onSearch={setSearchQuery}
            statusFilter={statusFilter}
            onStatusFilter={(v) =>
              setStatusFilter(v as ReservationStatus | "all")
            }
            eventFilter={eventFilter}
            onEventFilter={(v) => setEventFilter(v as EventType | "all")}
          />

          {/* ID Cards table */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  Registre CNI / NIN Clients
                </span>
                <Badge variant="outline">Conformité Légale</Badge>
              </CardTitle>
              <CardDescription>
                Numéros de pièce d'identité (NIN), lieux de délivrance et
                vérification des scanners Recto/Verso.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted/40 text-xs font-bold text-muted-foreground uppercase tracking-wide border-b border-border">
                    <tr>
                      <th className="p-3">Client</th>
                      <th className="p-3">Date Événement</th>
                      <th className="p-3">Numéro CNI / NIN</th>
                      <th className="p-3">Statut</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredReservations.map((r) => {
                      const idStatus = r.id_card_status ?? "not_provided";
                      const statusMeta = ID_CARD_STATUS_LABEL[idStatus];
                      return (
                        <tr
                          key={r.id}
                          className="hover:bg-muted/20 transition-colors"
                        >
                          <td className="p-3">
                            <div className="font-semibold">
                              {r.client_name || "Client anonyme"}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {r.client_phone || "—"}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="font-medium">
                              {formatDateFr(r.date)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {SLOT_LABEL[r.slot]}
                            </div>
                          </td>
                          <td className="p-3 font-mono text-xs">
                            {r.id_card_number ? (
                              <span className="font-bold text-foreground">
                                {r.id_card_number}
                              </span>
                            ) : (
                              <span className="text-muted-foreground italic">
                                Non renseigné
                              </span>
                            )}
                          </td>
                          <td className="p-3">
                            <Badge className={statusMeta.badgeCls + " text-xs"}>
                              {statusMeta.label}
                            </Badge>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs"
                                onClick={() => setViewingIdCard(r)}
                              >
                                <Eye className="mr-1 h-3 w-3" /> Voir
                              </Button>
                              {idStatus !== "verified" ? (
                                <Button
                                  size="sm"
                                  className="h-7 text-xs bg-emerald-600 text-white hover:bg-emerald-700"
                                  onClick={() =>
                                    idCardStatusMut.mutate({
                                      id: r.id,
                                      status: "verified",
                                    })
                                  }
                                >
                                  <CheckCircle2 className="mr-1 h-3 w-3" />{" "}
                                  Valider
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 text-xs text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                                  onClick={() =>
                                    idCardStatusMut.mutate({
                                      id: r.id,
                                      status: "pending",
                                    })
                                  }
                                >
                                  Dé-valider
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredReservations.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="p-8 text-center text-sm text-muted-foreground"
                        >
                          Aucune réservation ne correspond aux filtres.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── ID Card Viewer Modal ─────────────────────────── */}
      <Dialog
        open={!!viewingIdCard}
        onOpenChange={(open) => !open && setViewingIdCard(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Pièce d'Identité — {viewingIdCard?.client_name}
            </DialogTitle>
            <DialogDescription>
              Vérification des informations de l'identité client pour le contrat
              de réservation.
            </DialogDescription>
          </DialogHeader>

          {viewingIdCard && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-3 rounded-xl bg-muted/60 p-4 text-sm border border-border/40">
                {[
                  { label: "Nom complet", value: viewingIdCard.client_name },
                  {
                    label: "Téléphone",
                    value: viewingIdCard.client_phone || "Non fourni",
                  },
                  {
                    label: "Numéro CNI / NIN",
                    value: viewingIdCard.id_card_number || "Non saisi",
                    mono: true,
                  },
                  {
                    label: "Statut",
                    value:
                      ID_CARD_STATUS_LABEL[
                        viewingIdCard.id_card_status ?? "not_provided"
                      ].label,
                    badge:
                      ID_CARD_STATUS_LABEL[
                        viewingIdCard.id_card_status ?? "not_provided"
                      ].badgeCls,
                  },
                ].map((row) => (
                  <div key={row.label}>
                    <span className="text-xs text-muted-foreground block mb-0.5">
                      {row.label} :
                    </span>
                    {row.badge ? (
                      <Badge className={row.badge + " text-xs"}>
                        {row.value}
                      </Badge>
                    ) : (
                      <span
                        className={`font-bold ${row.mono ? "font-mono text-primary" : ""}`}
                      >
                        {row.value}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Scan previews */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  {
                    label: "Scan Recto (Face Avant)",
                    url: viewingIdCard.id_card_front_url,
                    alt: "Scan Recto",
                  },
                  {
                    label: "Scan Verso (Face Arrière)",
                    url: viewingIdCard.id_card_back_url,
                    alt: "Scan Verso",
                  },
                ].map((scan) => (
                  <div key={scan.label} className="space-y-1.5">
                    <span className="text-xs font-semibold text-muted-foreground block">
                      {scan.label} :
                    </span>
                    <div className="relative aspect-4/3 overflow-hidden rounded-xl border border-border bg-muted/40 flex items-center justify-center">
                      {scan.url ? (
                        <img
                          src={scan.url}
                          alt={scan.alt}
                          className="h-full w-full object-cover rounded-lg"
                        />
                      ) : (
                        <div className="text-center p-4">
                          <ShieldAlert className="mx-auto h-8 w-8 text-amber-500 mb-2" />
                          <span className="text-xs text-muted-foreground block">
                            Aperçu numérisé
                          </span>
                          <span className="text-[10px] text-muted-foreground/60">
                            N° {viewingIdCard.id_card_number ?? "CNI"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button
                  variant="outline"
                  onClick={() => setViewingIdCard(null)}
                >
                  Fermer
                </Button>
                {viewingIdCard.id_card_status !== "verified" && (
                  <Button
                    className="bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
                    onClick={() => {
                      idCardStatusMut.mutate({
                        id: viewingIdCard.id,
                        status: "verified",
                      });
                      setViewingIdCard(null);
                    }}
                  >
                    <CheckCircle2 className="mr-1.5 h-4 w-4" /> Marquer comme
                    Vérifiée
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={isNewReservationOpen}
        onOpenChange={(open) => setIsNewReservationOpen(open)}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Nouvelle réservation Admin
            </DialogTitle>
            <DialogDescription>
              Créez une réservation depuis le tableau de bord en tant
              qu'administrateur.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Salle</Label>
                <Select
                  value={newSalleId ?? undefined}
                  onValueChange={(v) => setNewSalleId(v)}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {salles.map((s: any) => (
                      <SelectItem key={s.id} value={s.id} className="text-xs">
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Date</Label>
                <Input
                  type="date"
                  className="h-9 text-xs"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Créneau</Label>
                <Select
                  value={newSlot}
                  onValueChange={(v) => setNewSlot(v as Slot)}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SLOTS.map((slotItem) => (
                      <SelectItem
                        key={slotItem.value}
                        value={slotItem.value}
                        className="text-xs"
                      >
                        {slotItem.shiftLabel}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Statut</Label>
                <Select
                  value={newStatus}
                  onValueChange={(v) => setNewStatus(v as ReservationStatus)}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      [
                        "pending",
                        "confirmed",
                        "cancelled",
                        "blocked",
                      ] as ReservationStatus[]
                    ).map((status) => (
                      <SelectItem
                        key={status}
                        value={status}
                        className="text-xs"
                      >
                        {STATUS_LABEL[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Type d'événement</Label>
                <Select
                  value={newEventType}
                  onValueChange={(v) => setNewEventType(v as EventType)}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map((et) => (
                      <SelectItem
                        key={et.value}
                        value={et.value}
                        className="text-xs"
                      >
                        {et.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Laboratoire</Label>
                <Select
                  value={newCookingLabId}
                  onValueChange={(v) => setNewCookingLabId(v as CookingLabId)}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COOKING_LABS.map((lab) => (
                      <SelectItem
                        key={lab.id}
                        value={lab.id}
                        className="text-xs"
                      >
                        {lab.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Heure de l'événement</Label>
                <Input
                  type="time"
                  className="h-9 text-xs"
                  value={newEventTime}
                  onChange={(e) => setNewEventTime(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Heure de fin</Label>
                <Input
                  type="time"
                  className="h-9 text-xs"
                  value={newEventEndTime}
                  onChange={(e) => setNewEventEndTime(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Montant total (DA)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  className="h-9 text-xs"
                  value={newTotal}
                  onChange={(e) => setNewTotal(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Nom client</Label>
                <Input
                  className="h-9 text-xs"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Téléphone client</Label>
                <Input
                  className="h-9 text-xs"
                  value={newClientPhone}
                  onChange={(e) => setNewClientPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Numéro CNI / NIN</Label>
                <Input
                  className="h-9 text-xs font-mono"
                  value={newIdCardNumber}
                  onChange={(e) => setNewIdCardNumber(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Statut carte d'identité</Label>
                <Select
                  value={newIdCardStatus}
                  onValueChange={(v) => setNewIdCardStatus(v as IdCardStatus)}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_provided" className="text-xs">
                      Non fournie
                    </SelectItem>
                    <SelectItem value="pending" className="text-xs">
                      En attente
                    </SelectItem>
                    <SelectItem value="verified" className="text-xs">
                      Vérifiée
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Notes</Label>
              <Textarea
                className="text-xs resize-none"
                rows={3}
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2">
              <Button
                className="font-bold shadow-sm"
                onClick={() => {
                  if (!newSalleId) {
                    return toast.error("Veuillez sélectionner une salle.");
                  }
                  if (!newClientName.trim()) {
                    return toast.error("Le nom du client est requis.");
                  }
                  saveMut.mutate(
                    {
                      id: null,
                      salle_id: newSalleId,
                      date: newDate,
                      slot: newSlot,
                      event_type: newEventType,
                      event_time: newEventTime || null,
                      event_end_time: newEventEndTime || null,
                      cooking_lab_id: newCookingLabId,
                      client_name: newClientName.trim(),
                      client_phone: newClientPhone.trim() || null,
                      id_card_number: newIdCardNumber.trim() || null,
                      id_card_status: newIdCardStatus,
                      status: newStatus,
                      total_amount: Number(newTotal) || 0,
                      note: newNote.trim() || null,
                    } as never,
                    {
                      onSuccess: () => setIsNewReservationOpen(false),
                    },
                  );
                }}
              >
                Créer la réservation
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsNewReservationOpen(false)}
              >
                Annuler
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}

/* ─── Search + Filter Bar ───────────────────────────────────── */
function SearchFilterBar({
  searchQuery,
  onSearch,
  statusFilter,
  onStatusFilter,
  eventFilter,
  onEventFilter,
}: {
  searchQuery: string;
  onSearch: (v: string) => void;
  statusFilter: string;
  onStatusFilter: (v: string) => void;
  eventFilter: string;
  onEventFilter: (v: string) => void;
}) {
  const hasFilters =
    searchQuery || statusFilter !== "all" || eventFilter !== "all";
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative flex-1 min-w-48">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          id="client-search"
          placeholder="Rechercher un client..."
          value={searchQuery}
          onChange={(e) => onSearch(e.target.value)}
          className="pl-9 h-9"
        />
      </div>
      <Select value={statusFilter} onValueChange={onStatusFilter}>
        <SelectTrigger className="w-40 h-9 text-xs font-semibold">
          <Filter className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all" className="text-xs">
            Tous statuts
          </SelectItem>
          {(
            [
              "pending",
              "confirmed",
              "cancelled",
              "blocked",
            ] as ReservationStatus[]
          ).map((s) => (
            <SelectItem key={s} value={s} className="text-xs">
              {STATUS_LABEL[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={eventFilter} onValueChange={onEventFilter}>
        <SelectTrigger className="w-44 h-9 text-xs font-semibold">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all" className="text-xs">
            Tous événements
          </SelectItem>
          {EVENT_TYPES.map((et) => (
            <SelectItem key={et.value} value={et.value} className="text-xs">
              {et.shortLabel}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="h-9 text-xs text-muted-foreground hover:text-destructive"
          onClick={() => {
            onSearch("");
            onStatusFilter("all");
            onEventFilter("all");
          }}
        >
          <X className="mr-1 h-3.5 w-3.5" /> Réinitialiser
        </Button>
      )}
    </div>
  );
}

/* ─── Slot Panel ────────────────────────────────────────────── */
function SlotPanel({
  date,
  slot,
  salleId,
  salleName,
  reservation,
  isAdmin,
  onSave,
  onStatus,
  onDelete,
  onVersement,
  onVersementDelete,
  onRemise,
  onViewIdCard,
}: {
  date: string;
  slot: Slot;
  salleId: string | null;
  salleName: string;
  reservation: Reservation | null;
  isAdmin: boolean;
  onSave: (p: Record<string, unknown>) => void;
  onStatus: (p: { id: string; status: ReservationStatus }) => void;
  onDelete: (p: { id: string }) => void;
  onVersement: (p: Record<string, unknown>) => void;
  onVersementDelete: (p: { id: string }) => void;
  onRemise: (p: Record<string, unknown>) => void;
  onViewIdCard?: (r: Reservation) => void;
}) {
  const [clientName, setClientName] = useState(reservation?.client_name ?? "");
  const [phone, setPhone] = useState(reservation?.client_phone ?? "");
  const [eventType, setEventType] = useState<EventType>(
    reservation?.event_type ?? "event",
  );
  const [eventTime, setEventTime] = useState(reservation?.event_time ?? "");
  const [eventEndTime, setEventEndTime] = useState(
    reservation?.event_end_time ?? "",
  );
  const [cookingLabId, setCookingLabId] = useState<CookingLabId>(
    reservation?.cooking_lab_id ?? "none",
  );
  const [idCardNumber, setIdCardNumber] = useState(
    reservation?.id_card_number ?? "",
  );
  const [idCardStatus, setIdCardStatus] = useState<IdCardStatus>(
    reservation?.id_card_status ?? "not_provided",
  );
  const [total, setTotal] = useState(String(reservation?.total_amount ?? 0));
  const [note, setNote] = useState(reservation?.note ?? "");

  // Versement form
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<string>("especes");
  const [payDate, setPayDate] = useState(new Date().toISOString().slice(0, 10));

  // Remise form
  const [remiseType, setRemiseType] = useState<"percentage" | "fixed">(
    "percentage",
  );
  const [remiseValue, setRemiseValue] = useState("");
  const [remiseComment, setRemiseComment] = useState("");

  const totals = reservation
    ? computeTotals(reservation)
    : { total: 0, remise: 0, net: 0, verse: 0, reste: 0 };

  const paymentPct =
    totals.net > 0 ? Math.min(100, (totals.verse / totals.net) * 100) : 0;

  return (
    <Card className="border-primary/15 shadow-md animate-scale-in">
      <CardHeader className="pb-3 bg-gradient-to-br from-primary/5 to-accent/5 rounded-t-xl">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-lg font-bold">
              {formatDateFr(date, {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </CardTitle>
            <p className="text-sm font-semibold text-primary mt-0.5">
              {SHIFT_LABEL[slot]} ({SLOT_LABEL[slot]})
              {eventTime ? ` à ${eventTime}` : ""}
              {eventEndTime ? ` - ${eventEndTime}` : ""} ·{" "}
              {EVENT_TYPE_LABEL[eventType]} · {salleName}
            </p>
          </div>
          <Badge
            className={
              reservation?.status === "confirmed"
                ? "bg-emerald-600 text-white"
                : reservation?.status === "pending"
                  ? "bg-amber-500 text-white"
                  : reservation?.status === "blocked"
                    ? "bg-slate-500 text-white"
                    : "bg-muted text-muted-foreground"
            }
          >
            {reservation ? STATUS_LABEL[reservation.status] : "Disponible"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        <div className="rounded-xl border border-border/60 bg-muted/20 p-3 text-xs flex items-center justify-between">
          <span className="font-semibold text-foreground">Salle :</span>
          <span className="font-bold text-primary">{salleName}</span>
        </div>

        {/* Event Type & Lab */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="font-semibold text-xs">Type d'Événement</Label>
            <Select
              value={eventType}
              onValueChange={(v) => setEventType(v as EventType)}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EVENT_TYPES.map((et) => (
                  <SelectItem
                    key={et.value}
                    value={et.value}
                    className="text-xs"
                  >
                    {et.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="font-semibold text-xs flex items-center gap-1">
              <Utensils className="h-3 w-3 text-amber-500" /> Labo Cuisine
            </Label>
            <Select
              value={cookingLabId}
              onValueChange={(v) => setCookingLabId(v as CookingLabId)}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COOKING_LABS.map((lab) => (
                  <SelectItem key={lab.id} value={lab.id} className="text-xs">
                    {lab.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="font-semibold text-xs">
              Heure de l'événement
            </Label>
            <Input
              type="time"
              className="h-9 text-xs"
              value={eventTime}
              onChange={(e) => setEventTime(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="font-semibold text-xs">
              Heure de fin
            </Label>
            <Input
              type="time"
              className="h-9 text-xs"
              value={eventEndTime}
              onChange={(e) => setEventEndTime(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Statut Réservation</Label>
            <Select
              value={reservation?.status ?? "pending"}
              onValueChange={(v) =>
                reservation
                  ? onStatus({
                      id: reservation.id,
                      status: v as ReservationStatus,
                    })
                  : undefined
              }
              disabled={!reservation}
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(
                  [
                    "pending",
                    "confirmed",
                    "cancelled",
                    "blocked",
                  ] as ReservationStatus[]
                ).map((s) => (
                  <SelectItem key={s} value={s} className="text-xs">
                    {STATUS_LABEL[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Client Info */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Nom Client</Label>
            <Input
              className="h-9 text-xs"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              maxLength={120}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Téléphone</Label>
            <Input
              className="h-9 text-xs"
              value={phone ?? ""}
              onChange={(e) => setPhone(e.target.value)}
              maxLength={30}
            />
          </div>
          <div className="space-y-1.5 col-span-2">
            <Label className="text-xs">Montant total (DA)</Label>
            <Input
              className="h-9 text-xs font-bold"
              type="number"
              min="0"
              step="0.01"
              value={total}
              onChange={(e) => setTotal(e.target.value)}
            />
          </div>
        </div>

        {/* ID Card */}
        <div className="rounded-xl border border-border/60 p-3 space-y-2 bg-muted/20">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-bold flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Carte
              d'Identité (CNI / NIN)
            </Label>
            {reservation && onViewIdCard && (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 text-[11px] px-2"
                onClick={() => onViewIdCard(reservation)}
              >
                <Eye className="mr-1 h-3 w-3" /> Scanner
              </Button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input
              className="h-8 text-xs font-mono"
              placeholder="Numéro NIN / CNI"
              value={idCardNumber}
              onChange={(e) => setIdCardNumber(e.target.value)}
            />
            <Select
              value={idCardStatus}
              onValueChange={(v) => setIdCardStatus(v as IdCardStatus)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="not_provided" className="text-xs">
                  Non fournie
                </SelectItem>
                <SelectItem value="pending" className="text-xs">
                  En attente
                </SelectItem>
                <SelectItem value="verified" className="text-xs">
                  Vérifiée ✓
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-1.5">
          <Label className="text-xs">Notes / Précisions</Label>
          <Textarea
            className="text-xs resize-none"
            rows={2}
            value={note ?? ""}
            onChange={(e) => setNote(e.target.value)}
            maxLength={500}
          />
        </div>

        {/* Save / Actions */}
        <div className="flex flex-wrap gap-2 pt-1">
          <Button
            className="flex-1 font-bold shadow-sm hover:shadow-primary/20"
            onClick={() => {
              if (!salleId) return toast.error("Créez d'abord une salle.");
              onSave({
                id: reservation?.id ?? null,
                salle_id: salleId,
                date,
                slot,
                event_type: eventType,
                event_time: eventTime || null,
                event_end_time: eventEndTime || null,
                cooking_lab_id: cookingLabId,
                client_name: clientName,
                client_phone: phone || null,
                id_card_number: idCardNumber.trim() || null,
                id_card_status: idCardStatus,
                status: reservation?.status ?? "pending",
                total_amount: Number(total) || 0,
                note: note || null,
              });
            }}
          >
            {reservation
              ? "Enregistrer les modifications"
              : "Créer la réservation"}
          </Button>
          {reservation && (
            <>
              <Button
                variant="outline"
                className="border-emerald-500/40 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 hover:border-emerald-500"
                onClick={() =>
                  onStatus({ id: reservation.id, status: "confirmed" })
                }
              >
                <CheckCircle2 className="mr-1.5 h-4 w-4" /> Confirmer
              </Button>
              <Button
                variant="ghost"
                onClick={() => onDelete({ id: reservation.id })}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </>
          )}
        </div>

        {/* Financial Summary + Versements + Remises */}
        {reservation && (
          <>
            <Separator />

            {/* Summary */}
            <div className="rounded-xl bg-muted/40 border border-border/40 p-3 space-y-2">
              <dl className="grid grid-cols-2 gap-y-1.5 text-xs">
                <dt className="text-muted-foreground">Montant total :</dt>
                <dd className="text-right font-semibold">
                  {formatMoney(totals.total)}
                </dd>
                <dt className="text-muted-foreground">Remise appliquée :</dt>
                <dd className="text-right font-semibold text-emerald-600">
                  − {formatMoney(totals.remise)}
                </dd>
                <dt className="text-muted-foreground">Total versé :</dt>
                <dd className="text-right font-semibold">
                  {formatMoney(totals.verse)}
                </dd>
                <dt className="font-bold text-sm">Reste à payer :</dt>
                <dd className="text-right font-bold text-sm text-primary">
                  {formatMoney(totals.reste)}
                </dd>
              </dl>
              {/* Payment progress bar */}
              {totals.net > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>Progression du paiement</span>
                    <span className="font-semibold">
                      {Math.round(paymentPct)}%
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                      style={{ width: `${paymentPct}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Versements */}
            <Separator />
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Wallet className="h-3.5 w-3.5" /> Versements (Acomptes)
              </h3>
              {reservation.versements.length === 0 && (
                <p className="text-xs text-muted-foreground italic">
                  Aucun versement enregistré.
                </p>
              )}
              {reservation.versements.map((v) => (
                <div
                  key={v.id}
                  className="flex items-center gap-2 rounded-lg border border-border/60 px-3 py-2 text-xs bg-card hover:bg-muted/20 transition-colors"
                >
                  <span className="font-bold text-primary">
                    {formatMoney(Number(v.amount))}
                  </span>
                  <span className="text-muted-foreground">
                    {formatDateFr(v.payment_date)} · {v.payment_method}
                  </span>
                  <div className="ml-auto flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      title="Imprimer Reçu PDF"
                      onClick={() => generateReceipt(reservation, v, salleName)}
                    >
                      <FileText className="h-3.5 w-3.5 text-primary" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => onVersementDelete({ id: v.id })}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
              {/* New versement form */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                <Input
                  placeholder="Montant DA"
                  className="h-8 text-xs font-semibold"
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                <Input
                  type="date"
                  className="h-8 text-xs"
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                />
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((m) => (
                      <SelectItem key={m} value={m} className="text-xs">
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                size="sm"
                variant="secondary"
                className="w-full text-xs font-semibold"
                onClick={() => {
                  const val = Number(amount);
                  if (!val || val <= 0) return toast.error("Montant invalide.");
                  onVersement({
                    reservation_id: reservation.id,
                    amount: val,
                    payment_date: payDate,
                    payment_method: method,
                  });
                  setAmount("");
                }}
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Enregistrer Versement
              </Button>
            </div>

            {/* Remises (Discounts) — NEW */}
            <Separator />
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5" /> Remises (Réductions)
              </h3>
              {(!reservation.remises || reservation.remises.length === 0) && (
                <p className="text-xs text-muted-foreground italic">
                  Aucune remise appliquée.
                </p>
              )}
              {(reservation.remises ?? []).map((rem) => (
                <div
                  key={rem.id}
                  className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-xs"
                >
                  <Percent className="h-3 w-3 text-emerald-600 shrink-0" />
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">
                    {rem.type === "percentage"
                      ? `${rem.value}%`
                      : formatMoney(Number(rem.value))}
                  </span>
                  {rem.comment && (
                    <span className="text-muted-foreground truncate">
                      {rem.comment}
                    </span>
                  )}
                </div>
              ))}
              {/* New remise form */}
              <div className="rounded-xl border border-border/40 bg-muted/20 p-3 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Select
                    value={remiseType}
                    onValueChange={(v) =>
                      setRemiseType(v as "percentage" | "fixed")
                    }
                  >
                    <SelectTrigger className="h-8 text-xs font-semibold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage" className="text-xs">
                        Pourcentage (%)
                      </SelectItem>
                      <SelectItem value="fixed" className="text-xs">
                        Montant fixe (DA)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder={
                      remiseType === "percentage"
                        ? "Ex: 10 (%)"
                        : "Ex: 5000 (DA)"
                    }
                    className="h-8 text-xs font-semibold"
                    type="number"
                    min="0"
                    max={remiseType === "percentage" ? "100" : undefined}
                    step="0.01"
                    value={remiseValue}
                    onChange={(e) => setRemiseValue(e.target.value)}
                  />
                </div>
                <Input
                  placeholder="Commentaire (ex: Réduction fidélité)"
                  className="h-8 text-xs"
                  value={remiseComment}
                  onChange={(e) => setRemiseComment(e.target.value)}
                  maxLength={200}
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-xs font-semibold border-emerald-500/30 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/20"
                  onClick={() => {
                    const val = Number(remiseValue);
                    if (!val || val <= 0)
                      return toast.error("Valeur de remise invalide.");
                    onRemise({
                      reservation_id: reservation.id,
                      type: remiseType,
                      value: val,
                      comment: remiseComment.trim() || null,
                    });
                    setRemiseValue("");
                    setRemiseComment("");
                  }}
                >
                  <Tag className="mr-1.5 h-3.5 w-3.5" /> Appliquer la Remise
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
