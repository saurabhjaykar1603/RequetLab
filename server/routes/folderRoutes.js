import express from 'express';
import * as folderController from '../controllers/folderController.js';

const router = express.Router();

router.get('/', folderController.getFolders);
router.post('/', folderController.createFolder);
router.put('/:id', folderController.updateFolder);
router.delete('/:id', folderController.deleteFolder);

export default router;
