import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, ClipboardList, Trophy, BarChart3, ChevronRight } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import type { LoginData } from '@/api/auth.api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [demoLoading, setDemoLoading] = useState<'athlete' | 'coach' | 'admin' | null>(null)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginData>()

  const onSubmit = async (data: LoginData) => {
    try {
      setError('')
      await login(data)
      navigate('/dashboard')
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setError(e.response?.data?.error || 'Erreur de connexion')
    }
  }

  const handleDemo = async (role: 'athlete' | 'coach' | 'admin') => {
    setDemoLoading(role)
    setError('')
    try {
      if (role === 'athlete') {
        await login({ email: 'demo@triathlon-planner.fr', password: 'demo1234' })
        navigate('/dashboard')
      } else if (role === 'coach') {
        await login({ email: 'thomas.mercier@triathlon-nantes.fr', password: 'coach1234' })
        navigate('/club/coach')
      } else {
        await login({ email: 'marie.lemoine@triathlon-nantes.fr', password: 'admin1234' })
        navigate('/admin')
      }
    } catch {
      setError('Erreur connexion démo')
    } finally {
      setDemoLoading(null)
    }
  }

  const features = [
    { icon: ClipboardList, label: "Plan d'entraînement adaptatif" },
    { icon: Trophy, label: "Compétitions & compte à rebours" },
    { icon: BarChart3, label: "Suivi des 3 disciplines + stats" },
  ]

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Panel gauche */}
      <div
        className="hidden lg:flex flex-col justify-between p-10 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #FB923C 0%, #EA580C 100%)' }}
      >
        {/* Orbe déco */}
        <div className="absolute -top-32 -right-16 w-80 h-80 rounded-full bg-white/10" />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-white font-bold text-lg flex-none">
            M
          </div>
          <div>
            <p className="font-bold text-white text-xl leading-tight">Tri Planner</p>
            <p className="text-sm text-white/70">Triathlon Club Nantais</p>
          </div>
        </div>

        {/* Hero */}
        <div className="relative">
          <h1 className="text-4xl font-bold text-white leading-tight mt-12">
            Ton triathlon, du premier longueur à la ligne d'arrivée.
          </h1>
          <p className="text-sm text-white/80 max-w-xs mt-4">
            Entraînement, compétitions et planification réunis. Quand tu t'entraînes en club, ton coach affine ton plan avec l'aide de l'IA.
          </p>
          <div className="space-y-4 mt-10">
            {features.map(f => (
              <div key={f.label} className="flex items-center gap-3">
                <div className="bg-white/20 rounded-lg p-2 flex-none">
                  <f.icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm text-white">{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="relative text-sm text-white/50 mt-auto">© 2026 Tri Planner</p>
      </div>

      {/* Panel droit */}
      <div className="flex items-center justify-center p-8 bg-white dark:bg-slate-900">
        <div className="w-full max-w-sm animate-fade-in">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Bon retour 👋</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-6">
            Connecte-toi pour accéder à ton espace.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-none" />
                {error}
              </div>
            )}

            <Input
              label="Adresse e-mail"
              type="email"
              placeholder="lea.fontaine@tcn.fr"
              icon={<Mail className="w-4 h-4" />}
              error={errors.email?.message}
              {...register('email', { required: 'Email requis' })}
            />

            <div>
              <Input
                label="Mot de passe"
                type="password"
                placeholder="••••••••"
                icon={<Lock className="w-4 h-4" />}
                error={errors.password?.message}
                {...register('password', { required: 'Mot de passe requis' })}
              />
              <div className="flex justify-end mt-1.5">
                <Link to="/forgot-password" className="text-sm text-orange-600 hover:text-orange-700 font-medium">
                  Mot de passe oublié ?
                </Link>
              </div>
            </div>

            <Button
              type="submit"
              loading={isSubmitting || demoLoading !== null}
              className="w-full mt-2"
              size="lg"
            >
              Se connecter
            </Button>

            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              Pas encore de compte ?{' '}
              <Link to="/register" className="text-orange-600 hover:text-orange-700 font-medium">
                Créer un compte
              </Link>
            </p>
          </form>

          {/* Séparateur */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-gray-200 dark:bg-slate-700" />
            <span className="text-xs text-gray-400">ou entrer en démo</span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-slate-700" />
          </div>

          {/* Demo — Léa Fontaine (Athlète) */}
          <button
            type="button"
            onClick={() => handleDemo('athlete')}
            disabled={demoLoading !== null || isSubmitting}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 hover:border-orange-200 hover:bg-orange-50/30 dark:hover:bg-orange-900/10 transition-all cursor-pointer bg-white dark:bg-slate-800 disabled:opacity-60 mb-2"
          >
            <div
              className="w-9 h-9 rounded-xl flex-none flex items-center justify-center text-white text-sm font-bold"
              style={{ background: 'linear-gradient(135deg,#FB923C,#EA580C)' }}
            >
              LF
            </div>
            <div className="flex-1 text-left min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Léa Fontaine</span>
                <span className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 text-xs font-medium px-2 py-0.5 rounded-full">
                  Athlète
                </span>
              </div>
              <p className="text-xs text-gray-400 truncate">Mes plans, mes courses, mes stats</p>
            </div>
            {demoLoading === 'athlete' ? (
              <div className="w-4 h-4 rounded-full border-2 border-orange-500 border-t-transparent animate-spin flex-none" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-300 ml-auto flex-none" />
            )}
          </button>

          {/* Demo — Thomas Mercier (Coach) */}
          <button
            type="button"
            onClick={() => handleDemo('coach')}
            disabled={demoLoading !== null || isSubmitting}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 hover:border-orange-200 hover:bg-orange-50/30 dark:hover:bg-orange-900/10 transition-all cursor-pointer bg-white dark:bg-slate-800 disabled:opacity-60 mb-2"
          >
            <div className="w-9 h-9 rounded-xl flex-none flex items-center justify-center text-white text-sm font-bold bg-slate-600">
              TM
            </div>
            <div className="flex-1 text-left min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Thomas Mercier</span>
                <span className="bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400 text-xs px-2 py-0.5 rounded-full">
                  Coach
                </span>
              </div>
              <p className="text-xs text-gray-400 truncate">Mes athlètes, mes groupes, mes plans</p>
            </div>
            {demoLoading === 'coach' ? (
              <div className="w-4 h-4 rounded-full border-2 border-orange-500 border-t-transparent animate-spin flex-none" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-300 ml-auto flex-none" />
            )}
          </button>

          {/* Demo — Marie Lemoine (Admin CODIR) */}
          <button
            type="button"
            onClick={() => handleDemo('admin')}
            disabled={demoLoading !== null || isSubmitting}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 hover:border-violet-200 hover:bg-violet-50/30 dark:hover:bg-violet-900/10 transition-all cursor-pointer bg-white dark:bg-slate-800 disabled:opacity-60"
          >
            <div
              className="w-9 h-9 rounded-xl flex-none flex items-center justify-center text-white text-sm font-bold"
              style={{ background: 'linear-gradient(135deg,#8B5CF6,#7C3AED)' }}
            >
              ML
            </div>
            <div className="flex-1 text-left min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Marie Lemoine</span>
                <span className="bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 text-xs font-medium px-2 py-0.5 rounded-full">
                  Admin CODIR
                </span>
              </div>
              <p className="text-xs text-gray-400 truncate">Membres, invitations, administration</p>
            </div>
            {demoLoading === 'admin' ? (
              <div className="w-4 h-4 rounded-full border-2 border-violet-500 border-t-transparent animate-spin flex-none" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-300 ml-auto flex-none" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
