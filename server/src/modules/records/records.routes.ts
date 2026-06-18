import { Router } from 'express'
import { authenticate } from '../../middleware/auth.js'
import { validate } from '../../middleware/validate.js'
import { createRecordSchema } from './records.schema.js'
import * as recordsController from './records.controller.js'

const router = Router()

router.use(authenticate)

router.get('/', recordsController.getRecords)
router.get('/categories', recordsController.getCategories)
router.get('/:sport', recordsController.getRecordsBySport)
router.post('/', validate(createRecordSchema), recordsController.createRecord)
router.delete('/:id', recordsController.deleteRecord)

export default router
