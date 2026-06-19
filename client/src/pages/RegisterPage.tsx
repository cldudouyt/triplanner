import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, User, ArrowRight } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import type { RegisterData } from '@/api/auth.api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

type RegisterFormData = RegisterData & { confirmPassword: string }

export default function RegisterPage() {
  const { register: registerUser } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<RegisterFormData>()

  const onSubmit = async ({ confirmPassword, ...data }: RegisterFormData) => {
    try {
      setError('')
      await registerUser(data)
      navigate('/login')
    } catch (err: any) {
      setError(err.response?.data?.error || "Erreur lors de l'inscription")
    }
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Left side - branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-purple-600 to-blue-700 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 right-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-purple-300 rounded-full blur-3xl" />
        </div>

        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <span className="text-white font-bold text-2xl">T</span>
            </div>
            <span className="text-white font-bold text-2xl">Tri Planner</span>
          </div>
        </div>

        <div className="relative space-y-6">
          <h1 className="text-4xl font-bold text-white leading-tight">
            Rejoignez la<br />
            communauté.
          </h1>
          <p className="text-purple-100 text-lg max-w-md">
            Créez votre compte et commencez à planifier vos entraînements et vos compétitions dès aujourd'hui.
          </p>
          <div className="space-y-4 pt-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-white text-sm">✓</span>
              </div>
              <p className="text-white">Planification intelligente</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-white text-sm">✓</span>
              </div>
              <p className="text-white">Suivi de progression</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-white text-sm">✓</span>
              </div>
              <p className="text-white">Synchronisation Strava</p>
            </div>
          </div>
        </div>

        <p className="relative text-purple-200 text-sm">
          © 2024 Tri Planner. Tous droits réservés.
        </p>
      </div>

      {/* Right side - register form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-600/30">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M3 17l4-8 4 5 3-7 4 10"/></svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Tri Planner</h1>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Créer un compte</h2>
            <p className="text-gray-500 mt-2">Rejoignez-nous et commencez votre aventure.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {error && (
              <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Prénom"
                placeholder="Jean"
                icon={<User className="w-4 h-4" />}
                error={errors.firstName?.message}
                {...register('firstName', { required: 'Requis' })}
              />
              <Input
                label="Nom"
                placeholder="Dupont"
                error={errors.lastName?.message}
                {...register('lastName', { required: 'Requis' })}
              />
            </div>

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
              placeholder="Minimum 8 caractères"
              icon={<Lock className="w-4 h-4" />}
              error={errors.password?.message}
              {...register('password', {
                required: 'Mot de passe requis',
                minLength: { value: 8, message: 'Minimum 8 caractères' },
              })}
            />

            <Input
              label="Confirmer le mot de passe"
              type="password"
              placeholder="••••••••"
              icon={<Lock className="w-4 h-4" />}
              error={errors.confirmPassword?.message}
              {...register('confirmPassword', {
                required: 'Confirmation requise',
                validate: (value) =>
                  value === watch('password') || 'Les mots de passe ne correspondent pas',
              })}
            />

            <Button
              type="submit"
              loading={isSubmitting}
              className="w-full"
              size="lg"
              icon={<ArrowRight className="w-4 h-4" />}
              iconPosition="right"
            >
              S'inscrire
            </Button>

            <p className="text-center text-sm text-gray-500">
              Déjà un compte ?{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                Se connecter
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
