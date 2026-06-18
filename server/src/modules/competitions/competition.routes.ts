import { Router } from 'express'
import * as controller from './competition.controller.js'
import { authMiddleware } from '../../middleware/auth.js'
import { validate } from '../../middleware/validate.js'
import { upload } from '../../middleware/upload.js'
import { createCompetitionSchema, updateCompetitionSchema } from './competition.schema.js'

const router = Router()

router.use(authMiddleware)

router.get('/', controller.findAll)
router.get('/suggestions', controller.suggestions)
router.get('/:id', controller.findById)
router.post('/', validate(createCompetitionSchema), controller.create)
router.put('/:id', validate(updateCompetitionSchema), controller.update)
router.delete('/:id', controller.remove)
router.post('/import', upload.single('file'), controller.importFile)

// Equipment
router.post('/:id/equipment', controller.addEquipmentItem)
router.put('/:id/equipment/:itemId', controller.updateEquipmentItem)
router.delete('/:id/equipment/:itemId', controller.removeEquipmentItem)

export default router
