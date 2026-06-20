import { Router } from 'express'
import { authenticate } from '../../middleware/auth.js'
import { validate } from '../../middleware/validate.js'
import { importDataSchema } from './export.schema.js'
import * as exportController from './export.controller.js'

const router = Router()

router.use(authenticate)

router.get('/json', exportController.exportJSON)
router.get('/csv', exportController.exportCSV)
router.post('/import', validate(importDataSchema), exportController.importData)

export default router
