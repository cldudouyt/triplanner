import app from './app.js'
import { config } from './config/env.js'
import './cron.js'

app.listen(config.port, () => {
  console.log(`Server running on http://localhost:${config.port}`)
})
