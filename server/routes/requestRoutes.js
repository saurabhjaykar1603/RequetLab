import express from 'express';
import * as requestController from '../controllers/requestController.js';

const router = express.Router();

router.get('/', requestController.getRequests);
router.post('/', requestController.createRequest);
router.put('/:id', requestController.updateRequest);
router.delete('/:id', requestController.deleteRequest);

export default router;
