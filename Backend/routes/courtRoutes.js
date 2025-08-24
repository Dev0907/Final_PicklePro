import express from 'express';
import {
  createCourtController,
  getCourtsByFacilityController,
  getCourtByIdController,
  updateCourtController,
  deleteCourtController,
  getAvailableSlotsController
} from '../controllers/courtController.js';
import { authenticateToken, authenticateOwner } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public routes
router.get('/facility/:facility_id', getCourtsByFacilityController);
router.get('/:id', getCourtByIdController);
router.get('/:court_id/slots', getAvailableSlotsController);

// Owner routes
router.post('/create', authenticateOwner, createCourtController);
router.put('/:id', authenticateOwner, updateCourtController);
router.delete('/:id', authenticateOwner, deleteCourtController);

export default router;