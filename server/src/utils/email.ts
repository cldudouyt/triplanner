import nodemailer from 'nodemailer'
import { config } from '../config/env.js'

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.secure,
  auth: config.email.user ? {
    user: config.email.user,
    pass: config.email.pass,
  } : undefined,
})

interface EmailOptions {
  to: string
  subject: string
  text: string
  html?: string
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  // In development without SMTP config, just log the email
  if (config.nodeEnv === 'development' && !config.email.user) {
    console.log('='.repeat(50))
    console.log('[EMAIL] Would send email:')
    console.log(`To: ${options.to}`)
    console.log(`Subject: ${options.subject}`)
    console.log(`Body: ${options.text}`)
    console.log('='.repeat(50))
    return true
  }

  try {
    await transporter.sendMail({
      from: config.email.from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    })
    return true
  } catch (error) {
    console.error('[EMAIL] Failed to send email:', error)
    return false
  }
}

export async function sendPasswordResetEmail(email: string, code: string): Promise<boolean> {
  const subject = 'Triathlon Planner - Code de réinitialisation'
  const text = `
Bonjour,

Vous avez demandé la réinitialisation de votre mot de passe.

Votre code de vérification est : ${code}

Ce code expire dans 15 minutes.

Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.

L'équipe Triathlon Planner
`
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .code { font-size: 32px; font-weight: bold; color: #2563eb; letter-spacing: 4px; padding: 20px; background: #f3f4f6; border-radius: 8px; text-align: center; margin: 20px 0; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <h2>Réinitialisation de mot de passe</h2>
    <p>Bonjour,</p>
    <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
    <p>Votre code de vérification est :</p>
    <div class="code">${code}</div>
    <p><strong>Ce code expire dans 15 minutes.</strong></p>
    <p>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
    <div class="footer">
      <p>L'équipe Triathlon Planner</p>
    </div>
  </div>
</body>
</html>
`
  return sendEmail({ to: email, subject, text, html })
}

export async function sendSessionReminderEmail(
  email: string,
  sessionTitle: string,
  sessionDate: string,
  sessionType: string
): Promise<boolean> {
  const subject = `Triathlon Planner - Rappel : ${sessionTitle}`
  const text = `
Bonjour,

N'oubliez pas votre séance d'entraînement !

Séance : ${sessionTitle}
Type : ${sessionType}
Date : ${sessionDate}

Bon entraînement !

L'équipe Triathlon Planner
`
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .session { padding: 20px; background: #f3f4f6; border-radius: 8px; margin: 20px 0; }
    .session h3 { margin-top: 0; color: #2563eb; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <h2>Rappel d'entraînement</h2>
    <p>Bonjour,</p>
    <p>N'oubliez pas votre séance d'entraînement !</p>
    <div class="session">
      <h3>${sessionTitle}</h3>
      <p><strong>Type :</strong> ${sessionType}</p>
      <p><strong>Date :</strong> ${sessionDate}</p>
    </div>
    <p>Bon entraînement !</p>
    <div class="footer">
      <p>L'équipe Triathlon Planner</p>
    </div>
  </div>
</body>
</html>
`
  return sendEmail({ to: email, subject, text, html })
}

export async function sendCompetitionReminderEmail(
  email: string,
  competitionName: string,
  competitionDate: string,
  daysUntil: number
): Promise<boolean> {
  const subject = `Triathlon Planner - ${competitionName} dans ${daysUntil} jour${daysUntil > 1 ? 's' : ''}`
  const text = `
Bonjour,

Votre compétition approche !

${competitionName}
Date : ${competitionDate}
Dans ${daysUntil} jour${daysUntil > 1 ? 's' : ''}

Préparez-vous bien et bonne chance !

L'équipe Triathlon Planner
`
  return sendEmail({ to: email, subject, text })
}
