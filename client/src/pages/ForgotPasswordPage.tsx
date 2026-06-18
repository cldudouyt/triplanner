import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { authApi, type ForgotPasswordData } from '@/api/auth.api'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotPasswordData>()

  const onSubmit = async (data: ForgotPasswordData) => {
    try {
      setError('')
      await authApi.forgotPassword(data)
      navigate(`/reset-password?email=${encodeURIComponent(data.email)}`)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors de la demande')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Tri Planner</h1>
          <p className="text-gray-500 mt-2">Mot de passe oubli&eacute;</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
          )}

          <p className="text-sm text-gray-600">
            Entrez votre adresse email. Un code de r&eacute;initialisation sera g&eacute;n&eacute;r&eacute;.
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

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors"
          >
            {isSubmitting ? 'Envoi...' : 'Envoyer le code'}
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
