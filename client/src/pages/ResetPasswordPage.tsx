import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { authApi, type ResetPasswordData } from '@/api/auth.api'

type ResetFormData = ResetPasswordData & { confirmPassword: string }

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const emailFromQuery = searchParams.get('email') ?? ''
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<ResetFormData>({
    defaultValues: { email: emailFromQuery },
  })

  const onSubmit = async ({ confirmPassword, ...data }: ResetFormData) => {
    try {
      setError('')
      await authApi.resetPassword(data)
      setSuccess(true)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors de la r\u00e9initialisation')
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Tri Planner</h1>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 space-y-6 text-center">
            <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg text-sm">
              Mot de passe r&eacute;initialis&eacute; avec succ&egrave;s
            </div>
            <Link
              to="/login"
              className="inline-block w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 font-medium transition-colors text-center"
            >
              Se connecter
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Tri Planner</h1>
          <p className="text-gray-500 mt-2">R&eacute;initialiser le mot de passe</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
          )}

          <p className="text-sm text-gray-600">
            Entrez le code re&ccedil;u ainsi que votre nouveau mot de passe.
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              {...register('email', { required: 'Email requis' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="vous@exemple.com"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Code de v&eacute;rification</label>
            <input
              {...register('code', { required: 'Code requis' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-center text-lg tracking-widest"
              placeholder="000000"
              maxLength={6}
            />
            {errors.code && <p className="text-red-500 text-xs mt-1">{errors.code.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nouveau mot de passe</label>
            <input
              type="password"
              {...register('newPassword', {
                required: 'Mot de passe requis',
                minLength: { value: 8, message: 'Minimum 8 caract\u00e8res' },
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
            {errors.newPassword && <p className="text-red-500 text-xs mt-1">{errors.newPassword.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmer le mot de passe</label>
            <input
              type="password"
              {...register('confirmPassword', {
                required: 'Confirmation requise',
                validate: (value) =>
                  value === watch('newPassword') || 'Les mots de passe ne correspondent pas',
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
            {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors"
          >
            {isSubmitting ? 'R\u00e9initialisation...' : 'R\u00e9initialiser le mot de passe'}
          </button>

          <p className="text-center text-sm text-gray-500">
            <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
              Retour &agrave; la connexion
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
