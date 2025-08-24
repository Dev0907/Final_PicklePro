import express from 'express';
import { signup, login, ownerSignup } from '../controllers/authController.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/owner-signup', ownerSignup);

export default router; 