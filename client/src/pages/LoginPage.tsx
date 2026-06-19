import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, ArrowRight } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import type { LoginData } from '@/api/auth.api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginData>()

  const onSubmit = async (data: LoginData) => {
    try {
      setError('')
      await login(data)
      navigate('/')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur de connexion')
    }
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
      {/* Left side - branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-purple-700 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-300 rounded-full blur-3xl" />
        </div>

        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M3 17l4-8 4 5 3-7 4 10"/></svg>
            </div>
            <span className="text-white font-bold text-2xl">Tri Planner</span>
          </div>
        </div>

        <div className="relative space-y-6">
          <h1 className="text-4xl font-bold text-white leading-tight">
            Planifiez vos objectifs.<br />
            Atteignez vos sommets.
          </h1>
          <p className="text-blue-100 text-lg max-w-md">
            Gérez vos compétitions, suivez vos entraînements et atteignez vos objectifs sportifs avec Tri Planner.
          </p>
          <div className="flex items-center gap-6 pt-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-white">1000+</p>
              <p className="text-blue-200 text-sm">Athlètes</p>
            </div>
            <div className="w-px h-12 bg-white/20" />
            <div className="text-center">
              <p className="text-3xl font-bold text-white">50K+</p>
              <p className="text-blue-200 text-sm">Séances</p>
            </div>
            <div className="w-px h-12 bg-white/20" />
            <div className="text-center">
              <p className="text-3xl font-bold text-white">500+</p>
              <p className="text-blue-200 text-sm">Compétitions</p>
            </div>
          </div>
        </div>

        <p className="relative text-blue-200 text-sm">
          © 2024 Tri Planner. Tous droits réservés.
        </p>
      </div>

      {/* Right side - login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md animate-fade-in-up">
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-600/30">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M3 17l4-8 4 5 3-7 4 10"/></svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Tri Planner</h1>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Connexion</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Bienvenue ! Connectez-vous à votre compte.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm flex items-center gap-2 animate-shake">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                {error}
              </div>
            )}

            <Input
              label="Email"
              type="email"
              placeholder="vous@exemple.com"
              icon={<Mail className="w-4 h-4" />}
              error={errors.email?.message}
              {...register('email', { required: 'Email requis' })}
            />

            <Input
              label="Mot de passe"
              type="password"
              placeholder="••••••••"
              icon={<Lock className="w-4 h-4" />}
              error={errors.password?.message}
              {...register('password', { required: 'Mot de passe requis' })}
            />

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
                Mot de passe oublié ?
              </Link>
            </div>

            <Button
              type="submit"
              loading={isSubmitting}
              className="w-full"
              size="lg"
              icon={<ArrowRight className="w-4 h-4" />}
              iconPosition="right"
            >
              Se connecter
            </Button>

            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              Pas encore de compte ?{' '}
              <Link to="/register" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">
                S'inscrire
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
