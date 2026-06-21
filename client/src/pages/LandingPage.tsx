import { Link } from 'react-router-dom'
import { Sparkles, Activity, Trophy, Heart, BarChart3, Users, Zap } from 'lucide-react'

const colorMap: Record<string, { bg: string; text: string }> = {
  orange: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400' },
  cyan: { bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-600 dark:text-cyan-400' },
  rose: { bg: 'bg-rose-100 dark:bg-rose-900/30', text: 'text-rose-600 dark:text-rose-400' },
  green: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-600 dark:text-green-400' },
  purple: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400' },
}

const features = [
  { icon: Sparkles, color: 'orange', title: 'Coach IA', desc: 'Plans générés et affinés par Claude — avec contexte Strava et wellness.' },
  { icon: Activity, color: 'cyan', title: 'Synchronisation Strava', desc: 'Tes activités importées automatiquement, compétitions synchronisées.' },
  { icon: Trophy, color: 'orange', title: 'Gestion des compétitions', desc: 'Race day dashboard, countdown, checklist équipement, objectifs A/B/C.' },
  { icon: Heart, color: 'rose', title: 'Wellness & forme', desc: 'Suivi sommeil, fatigue, TSB — alertes intelligentes si tu surcharges.' },
  { icon: BarChart3, color: 'green', title: 'Statistiques avancées', desc: 'ATL, CTL, TSB calculés. Graphes par discipline. Corrélation wellness.' },
  { icon: Users, color: 'purple', title: 'Espace club', desc: "Ton coach crée et affine ton plan depuis l'espace coach IA." },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 animate-fade-in">
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-100 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
              style={{ background: 'linear-gradient(135deg,#FB923C,#EA580C)' }}
            >
              M
            </div>
            <span className="font-bold text-gray-900 dark:text-gray-100">Tri Planner</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 font-medium"
            >
              Se connecter
            </Link>
            <Link
              to="/register"
              className="text-sm text-white font-semibold px-4 py-2 rounded-xl"
              style={{ background: 'linear-gradient(135deg,#FB923C,#EA580C)' }}
            >
              Commencer gratuit
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section
        className="pt-32 pb-20 px-6"
        style={{ background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(251,146,60,.15), transparent)' }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-full px-4 py-1.5 mb-6">
            <Sparkles className="w-3.5 h-3.5 text-orange-600" />
            <span className="text-xs font-semibold text-orange-700 dark:text-orange-400">Propulsé par l'IA</span>
          </div>
          <h1 className="text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-gray-100 leading-tight tracking-tight">
            Planifiez.{' '}
            <span
              style={{
                background: 'linear-gradient(135deg,#FB923C,#EA580C)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Performez.
            </span>
            <br />
            Progressez.
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 mt-6 max-w-2xl mx-auto">
            L'application triathlon qui combine plans d'entraînement personnalisés, suivi Strava, coach IA et gestion des compétitions — tout en un.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-10">
            <Link
              to="/register"
              className="flex items-center gap-2 text-white font-semibold px-6 py-3 rounded-xl text-sm shadow-lg shadow-orange-500/30 hover:shadow-xl hover:shadow-orange-500/40 transition-all"
              style={{ background: 'linear-gradient(135deg,#FB923C,#EA580C)' }}
            >
              <Zap className="w-4 h-4" /> Commencer gratuitement
            </Link>
            <Link
              to="/login"
              className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-medium px-6 py-3 rounded-xl text-sm border border-gray-200 dark:border-slate-700 hover:border-orange-200 dark:hover:border-orange-700 transition-all"
            >
              Se connecter →
            </Link>
          </div>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section className="py-20 px-6 bg-gray-50 dark:bg-slate-800/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 text-center mb-4">
            Tout ce dont tu as besoin
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-center mb-12 max-w-xl mx-auto">
            De la première séance à la ligne d'arrivée, Tri Planner t'accompagne.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(f => {
              const c = colorMap[f.color] ?? colorMap.orange
              return (
                <div
                  key={f.title}
                  className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6 hover:shadow-md hover:-translate-y-0.5 transition-all"
                >
                  <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center mb-4`}>
                    <f.icon className={`w-5 h-5 ${c.text}`} />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{f.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{f.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-20 px-6">
        <div
          className="max-w-2xl mx-auto text-center rounded-2xl p-10"
          style={{ background: 'linear-gradient(135deg,#FB923C,#EA580C)' }}
        >
          <h2 className="text-3xl font-bold text-white mb-3">Prêt à passer au niveau supérieur ?</h2>
          <p className="text-white/80 mb-6">Rejoins des centaines d'athlètes qui planifient avec Tri Planner.</p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 bg-white text-orange-600 font-semibold px-6 py-3 rounded-xl text-sm hover:bg-orange-50 transition-colors"
          >
            Créer mon compte gratuit →
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-8 px-6 border-t border-gray-100 dark:border-slate-800">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-md flex items-center justify-center text-white text-xs font-bold"
              style={{ background: 'linear-gradient(135deg,#FB923C,#EA580C)' }}
            >
              M
            </div>
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Tri Planner</span>
          </div>
          <p className="text-xs text-gray-400">© 2026 Tri Planner — Tous droits réservés</p>
        </div>
      </footer>
    </div>
  )
}
