import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Search, SearchX, Users, CalendarClock, ArrowRight, Shield, Globe, Leaf } from "lucide-react";
import { useUser, CAMPAIGN_CATEGORIES } from "../context/UserContext";
import type { Campaign } from "../context/UserContext";
import { formatCurrency, getDaysLeft, getProgress, StatusBadge, CampaignCover } from "../lib/campaignUtils";
import "./Campaigns.css";

type SortOption = "popularity" | "deadline" | "raised";

const SORT_LABELS: Record<SortOption, string> = {
  popularity: "Popularidad",
  deadline: "Fecha límite",
  raised: "Mayor recaudo",
};

function sortCampaigns(list: Campaign[], sortBy: SortOption) {
  const sorted = [...list];
  if (sortBy === "popularity") sorted.sort((a, b) => b.contributionsCount - a.contributionsCount);
  if (sortBy === "deadline") sorted.sort((a, b) => a.deadline.localeCompare(b.deadline));
  if (sortBy === "raised") sorted.sort((a, b) => b.raised - a.raised);
  return sorted;
}

export function Explore() {
  const { user, campaigns } = useUser();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [sortBy, setSortBy] = useState<SortOption>("popularity");

  const results = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = campaigns.filter(
      (c) =>
        (category === "all" || c.category === category) &&
        (!normalizedQuery || c.title.toLowerCase().includes(normalizedQuery)),
    );
    return sortCampaigns(filtered, sortBy);
  }, [campaigns, query, category, sortBy]);

  return (
    <>
      {/* Hero: platform purpose */}
      <section className="px-6 md:px-12 pt-20 pb-16 md:pt-28 md:pb-20 flex flex-col items-center text-center border-b border-gray-200 bg-background">
        <h1 className="font-serif text-5xl md:text-7xl font-bold max-w-4xl leading-tight tracking-tight mb-8">
          Financia las ideas que moldean el mañana.
        </h1>
        <p className="font-serif text-xl md:text-2xl text-gray-600 max-w-2xl mb-10">
          Una plataforma curada para proyectos visionarios. Conectamos creadores con mecenas que creen en romper
          límites.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            to={user ? "/campanas/nueva" : "/auth"}
            className="bg-accent text-accent-foreground px-8 py-4 font-bold text-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
          >
            Iniciar un Proyecto <ArrowRight size={20} />
          </Link>
          <a
            href="#campanas"
            className="border border-primary text-primary px-8 py-4 font-bold text-lg hover:bg-gray-100 transition-colors flex items-center justify-center"
          >
            Explorar Campañas
          </a>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 md:px-12 py-20 bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
          {[
            {
              Icon: Shield,
              title: "Creadores Verificados",
              text: "Cada campaña pasa por una rigurosa revisión editorial para garantizar viabilidad, transparencia e impacto.",
            },
            {
              Icon: Globe,
              title: "Alcance Global",
              text: "Conéctate con una red mundial de mecenas. Tu ubicación geográfica no debería limitar tu ambición.",
            },
            {
              Icon: Leaf,
              title: "Crecimiento Sostenible",
              text: "Priorizamos proyectos con visión a largo plazo sobre tendencias pasajeras. Construye algo que perdure.",
            },
          ].map(({ Icon, title, text }) => (
            <div key={title} className="flex flex-col items-start">
              <div className="bg-gray-100 p-4 mb-6">
                <Icon size={32} className="text-primary" />
              </div>
              <h3 className="font-serif text-2xl font-bold mb-4">{title}</h3>
              <p className="text-gray-600 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </section>

    <main id="campanas" className="panel__main panel__main--wide" style={{ scrollMarginTop: "58px" }}>
      <div>
        <h2 className="panel__heading">Explorar campañas</h2>
        <p className="panel__subheading">Descubre proyectos y apoya los que te inspiran.</p>
      </div>

      <div className="explore-toolbar">
        <label className="explore-search">
          <Search size={16} />
          <input
            type="search"
            placeholder="Buscar por nombre…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <label className="explore-select">
          <span>Ordenar por</span>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)}>
            {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => (
              <option key={key} value={key}>
                {SORT_LABELS[key]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="chip-row">
        {["all", ...CAMPAIGN_CATEGORIES].map((cat) => (
          <button
            key={cat}
            className={`chip${category === cat ? " chip--active" : ""}`}
            onClick={() => setCategory(cat)}
          >
            {cat === "all" ? "Todas" : cat}
          </button>
        ))}
      </div>

      {results.length === 0 ? (
        <div className="panel__card empty-state">
          <SearchX size={28} />
          <p className="empty-state__title">No hay resultados</p>
          <p className="empty-state__text">
            Ninguna campaña coincide con los filtros aplicados. Prueba con otro nombre o categoría.
          </p>
        </div>
      ) : (
        <div className="campaign-grid">
          {results.map((c) => {
            const pct = getProgress(c);
            return (
              <Link key={c.id} to={`/campanas/${c.id}`} className="campaign-card">
                <div className="campaign-card__media">
                  <CampaignCover campaign={c} className="campaign-card__img" />
                  <div className="campaign-card__status">
                    <StatusBadge status={c.status} />
                  </div>
                </div>
                <div className="campaign-card__body">
                  <p className="campaign-card__category">{c.category}</p>
                  <h3 className="campaign-card__title">{c.title}</h3>
                  <p className="campaign-card__desc">{c.description}</p>
                  <div className="progress">
                    <div className="progress__fill" style={{ width: `${Math.min(100, pct)}%` }} />
                  </div>
                  <div className="campaign-card__stats">
                    <div>
                      <strong>{formatCurrency(c.raised)}</strong>
                      <span>{pct}% de {formatCurrency(c.goal)}</span>
                    </div>
                  </div>
                  <div className="campaign-card__meta">
                    <span>
                      <Users size={13} /> {c.contributionsCount} aportes
                    </span>
                    <span>
                      <CalendarClock size={13} /> {getDaysLeft(c.deadline)} días
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
    </>
  );
}
