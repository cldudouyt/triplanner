import { useNavigate } from 'react-router-dom'
import { LayoutDashboard } from 'lucide-react'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center bg-page p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-10 max-w-md w-full text-center animate-fade-in">
        {/* Illustration SVG triathlon */}
        <div className="flex justify-center mb-6">
          <svg
            width="96"
            height="96"
            viewBox="0 0 96 96"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            {/* Cercle de fond */}
            <circle cx="48" cy="48" r="48" fill="#FFF7ED" />
            {/* Chiffre 404 stylisé — simple trophée */}
            <path
              d="M32 30h32v16c0 8.837-7.163 16-16 16S32 54.837 32 46V30z"
              fill="#FB923C"
              fillOpacity="0.2"
            />
            <path
              d="M33 30h30v16c0 8.284-6.716 15-15 15S33 54.284 33 46V30z"
              stroke="#EA580C"
              strokeWidth="2"
              strokeLinejoin="round"
              fill="none"
            />
            {/* Poignées du trophée */}
            <path d="M33 36H26a4 4 0 0 0 0 8h7" stroke="#EA580C" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M63 36h7a4 4 0 0 1 0 8h-7" stroke="#EA580C" strokeWidth="2" fill="none" strokeLinecap="round" />
            {/* Pied */}
            <rect x="41" y="61" width="14" height="4" rx="2" fill="#EA580C" fillOpacity="0.4" />
            <rect x="36" y="65" width="24" height="3" rx="1.5" fill="#EA580C" />
            {/* Étoile */}
            <path
              d="M48 38l1.545 4.759H54.5l-4.023 2.922 1.546 4.758L48 47.519l-4.023 2.92 1.546-4.758L41.5 42.76h4.955z"
              fill="#FB923C"
            />
          </svg>
        </div>

        {/* Code erreur */}
        <p className="text-6xl font-extrabold text-orange-500 mb-2 tracking-tight">404</p>

        {/* Titre */}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
          Page introuvable
        </h1>

        {/* Description */}
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
          Cette page n'existe pas ou a été déplacée.
          <br />
          Retourne au tableau de bord pour continuer ton entraînement.
        </p>

        {/* CTA */}
        <button
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white text-sm font-semibold transition-all hover:shadow-lg hover:shadow-orange-500/30"
          style={{ background: 'linear-gradient(135deg, #FB923C, #EA580C)' }}
        >
          <LayoutDashboard className="w-4 h-4" />
          Retour au tableau de bord
        </button>
      </div>
    </div>
  )
}
