import express from 'express';
import * as proxyController from '../controllers/proxyController.js';

const router = express.Router();

router.post('/', proxyController.executeProxy);

export default router;
