
const stats = [
  {
    title: "Consommation totale",
    value: "12 450",
    unit: "kWh",
    change: "+8.2 %",
    detail: "vs mois dernier",
  },
  {
    title: "Bâtiments suivis",
    value: "05",
    unit: "",
    change: "Actifs",
    detail: "sur 5 bâtiments",
  },
  {
    title: "Compteurs connectés",
    value: "30",
    unit: "",
    change: "100 %",
    detail: "disponibilité",
  },
  {
    title: "Alertes détectées",
    value: "03",
    unit: "",
    change: "À vérifier",
    detail: "cette semaine",
  },
];

const consumption = [
  { day: "Lun", value: 45 },
  { day: "Mar", value: 65 },
  { day: "Mer", value: 52 },
  { day: "Jeu", value: 80 },
  { day: "Ven", value: 60 },
  { day: "Sam", value: 35 },
  { day: "Dim", value: 48 },
];

const alerts = [
  {
    building: "Bâtiment administratif",
    message: "Consommation anormalement élevée",
    time: "Il y a 15 min",
    level: "Élevée",
  },
  {
    building: "Bâtiment A",
    message: "Dépassement du seuil de consommation",
    time: "Il y a 1 heure",
    level: "Moyenne",
  },
  {
    building: "Bâtiment C",
    message: "Variation inhabituelle détectée",
    time: "Il y a 3 heures",
    level: "Faible",
  },
];

const menuItems = [
  "Tableau de bord",
  "Bâtiments",
  "Compteurs",
  "Consommations",
  "Analyses",
  "Alertes",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-800 md:flex">

      {/* BARRE LATERALE */}
      <aside className="w-full bg-slate-900 p-6 text-white md:min-h-screen md:w-64 md:shrink-0">

        {/* Logo */}
        <div className="mb-10">
          <h1 className="text-2xl font-bold">
            Energy<span className="text-emerald-400">Watch</span>
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Energy Management Platform
          </p>
        </div>

        {/* Navigation */}
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Menu principal
        </p>

        <nav className="space-y-2">
          {menuItems.map((item, index) => (
            <div
              key={item}
              className={`cursor-pointer rounded-lg px-4 py-3 text-sm transition ${
                index === 0
                  ? "bg-emerald-500 font-semibold text-white"
                  : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              {item}
            </div>
          ))}
        </nav>

        {/* Bas de la barre latérale */}
        <div className="mt-12 border-t border-slate-700 pt-5">
          <p className="text-sm font-medium">EnergyWatch</p>
          <p className="mt-1 text-xs text-slate-400">
            Version 1.0
          </p>
        </div>
      </aside>

      {/* CONTENU PRINCIPAL */}
      <section className="min-w-0 flex-1 p-5 md:p-8">

        {/* BARRE SUPERIEURE */}
        <header className="mb-8">

          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">

            {/* Recherche */}
            <div className="relative w-full max-w-md">
              <input
                type="search"
                placeholder="Rechercher un bâtiment, un compteur..."
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />

              <svg
                className="absolute left-4 top-3.5 h-4 w-4 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <circle
                  cx="11"
                  cy="11"
                  r="7"
                  strokeWidth="2"
                />
                <path
                  d="m16 16 4 4"
                  strokeWidth="2"
                />
              </svg>
            </div>

            {/* Notifications et profil */}
            <div className="flex items-center gap-5">

              {/* Notifications */}
              <button
                type="button"
                aria-label="Notifications"
                className="relative rounded-xl p-2.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M10 21h4"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                </svg>

                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
              </button>

              {/* Profil utilisateur */}
              <div className="flex items-center gap-3 border-l border-slate-200 pl-5">

                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-700">
                  AD
                </div>

                <div className="hidden sm:block">
                  <p className="text-sm font-semibold text-slate-800">
                    Administrateur
                  </p>
                  <p className="text-xs text-slate-500">
                    Gestionnaire
                  </p>
                </div>

                <span className="text-slate-400">⌄</span>
              </div>
            </div>
          </div>

          {/* TITRE DE LA PAGE */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">

            <div>
              <p className="text-sm text-slate-500">
                Vue générale
              </p>

              <h2 className="mt-1 text-2xl font-bold text-slate-900">
                Tableau de bord
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Suivez et analysez vos consommations énergétiques.
              </p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm shadow-sm">
              Novembre 2026
            </div>
          </div>
        </header>

        {/* CARTES STATISTIQUES */}
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">

          {stats.map((stat) => (
            <div
              key={stat.title}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <p className="text-sm text-slate-500">
                {stat.title}
              </p>

              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-slate-900">
                  {stat.value}
                </span>

                <span className="text-sm text-slate-500">
                  {stat.unit}
                </span>
              </div>

              <div className="mt-3 flex gap-2 text-xs">
                <span className="font-semibold text-emerald-600">
                  {stat.change}
                </span>

                <span className="text-slate-400">
                  {stat.detail}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* GRAPHIQUE ET RESUME */}
        <div className="mt-7 grid gap-6 xl:grid-cols-3">

          {/* Graphique */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold text-slate-900">
                  Évolution de la consommation
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Consommation énergétique hebdomadaire
                </p>
              </div>

              <span className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
                Cette semaine
              </span>
            </div>

            {/* Barres du graphique */}
            <div className="mt-8 flex h-56 items-end justify-around gap-3 border-b border-slate-200 px-2">

              {consumption.map((item) => (
                <div
                  key={item.day}
                  className="flex h-full flex-1 flex-col items-center justify-end gap-2"
                >
                  <span className="text-xs text-slate-500">
                    {item.value}%
                  </span>

                  <div
                    className="w-full max-w-12 rounded-t-md bg-emerald-500 transition hover:bg-emerald-600"
                    style={{ height: `${item.value * 1.5}%` }}
                  />

                  <span className="text-xs text-slate-500">
                    {item.day}
                  </span>
                </div>
              ))}
            </div>

            <p className="mt-4 text-xs text-slate-400">
              Données de démonstration — valeurs fictives.
            </p>
          </div>

          {/* Résumé énergétique */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

            <h3 className="font-semibold text-slate-900">
              Résumé énergétique
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              État de la plateforme
            </p>

            <div className="mt-7 space-y-6">

              {/* Bâtiments */}
              <div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">
                    Bâtiments actifs
                  </span>
                  <strong>5 / 5</strong>
                </div>

                <div className="mt-2 h-2 rounded-full bg-slate-100">
                  <div className="h-2 w-full rounded-full bg-emerald-500" />
                </div>
              </div>

              {/* Compteurs */}
              <div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">
                    Compteurs actifs
                  </span>
                  <strong>30 / 30</strong>
                </div>

                <div className="mt-2 h-2 rounded-full bg-slate-100">
                  <div className="h-2 w-full rounded-full bg-blue-500" />
                </div>
              </div>

              {/* Statut */}
              <div className="rounded-lg bg-emerald-50 p-4">
                <p className="text-sm font-semibold text-emerald-800">
                  Système opérationnel
                </p>

                <p className="mt-1 text-xs text-emerald-700">
                  Les équipements de démonstration sont disponibles.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* DERNIERES ALERTES */}
        <div className="mt-7 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-slate-900">
                Dernières alertes
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Anomalies et événements récents
              </p>
            </div>

            <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">
              3 alertes
            </span>
          </div>

          <div className="space-y-4">

            {alerts.map((alert) => (
              <div
                key={alert.building}
                className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 last:border-0 last:pb-0"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {alert.building}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    {alert.message}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    {alert.time}
                  </p>
                </div>

                <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700">
                  {alert.level}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* PIED DE PAGE */}
        <footer className="mt-8 text-center text-xs text-slate-400">
          © 2026 EnergyWatch — Plateforme de suivi énergétique
        </footer>

      </section>
    </main>
  );
}
