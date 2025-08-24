import express from 'express';
import {
  createBookingController,
  getUserBookingsController,
  getFacilityBookingsController,
  getCourtBookingsController,
  getBookingByIdController,
  cancelBookingController,
  completeBookingController,
  getUpcomingBookingsController,
  getSlotAvailabilityController,
  getBookingAnalyticsController,
  getRevenueAnalyticsController,
  getBookingHeatmapController,
  createSlotsController,
  saveSlotsController,
  getSlotsController
} from '../controllers/bookingController.js';
import { authenticateToken, authenticateOwner } from '../middleware/auth.middleware.js';

const router = express.Router();

// User routes
router.post('/create', authenticateToken, createBookingController);
router.get('/user/bookings', authenticateToken, getUserBookingsController);
router.get('/user/upcoming', authenticateToken, getUpcomingBookingsController);
router.put('/:id/cancel', authenticateToken, cancelBookingController);

// Public routes
router.get('/court/:court_id', getCourtBookingsController);
router.get('/:id', getBookingByIdController);

// Owner routes
router.get('/facility/:facility_id', authenticateOwner, getFacilityBookingsController);
router.put('/:id/complete', authenticateOwner, completeBookingController);
router.post('/create-slots', authenticateOwner, createSlotsController);
router.post('/save-slots', authenticateOwner, saveSlotsController);

// Slot availability routes
router.get('/slots/:court_id', getSlotsController);

// Analytics routes (Owner only)
router.get('/facility/:facility_id/analytics', authenticateOwner, getBookingAnalyticsController);
router.get('/facility/:facility_id/revenue', authenticateOwner, getRevenueAnalyticsController);
router.get('/facility/:facility_id/heatmap', authenticateOwner, getBookingHeatmapController);

// Slot availability routes
router.get('/court/:court_id/slots', getSlotAvailabilityController);

export default router;