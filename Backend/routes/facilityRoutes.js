import express from "express";
import {
  createFacilityController,
  getOwnerFacilitiesController,
  getAllFacilitiesController,
  getFacilityByIdController,
  updateFacilityController,
  deleteFacilityController
} from "../controllers/facilityController.js";
import { authenticateToken, authenticateOwner } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public routes
router.get("/all", getAllFacilitiesController);
router.get("/:id", getFacilityByIdController);

// Owner routes
router.post("/create", authenticateOwner, createFacilityController);
router.get(
  "/owner/facilities",
  authenticateOwner,
  getOwnerFacilitiesController
);
router.put("/:id", authenticateOwner, updateFacilityController);
router.delete("/:id", authenticateOwner, deleteFacilityController);

export default router;
