import express from 'express';
import * as environmentController from '../controllers/environmentController.js';

const router = express.Router();

router.get('/', environmentController.getEnvironments);
router.post('/', environmentController.createEnvironment);

export default router;
