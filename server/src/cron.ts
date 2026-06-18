import cron from 'node-cron'
import { checkAndSendReminders } from './modules/notifications/notifications.service.js'

cron.schedule('0 8 * * *', async () => {
  try {
    await checkAndSendReminders()
  } catch (err) {
    console.error('[CRON] Error in checkAndSendReminders:', err)
  }
})
