import express from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// Get maintenance blocks for a specific court and date
router.get('/court/:courtId/date/:date', authenticateToken, async (req, res) => {
  try {
    const { courtId, date } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM maintenance_blocks WHERE court_id = $1 AND block_date = $2 ORDER BY start_time',
      [courtId, date]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching maintenance blocks:', error);
    res.status(500).json({ error: 'Failed to fetch maintenance blocks' });
  }
});

// Create a new maintenance block
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { court_id, block_date, start_time, end_time, reason } = req.body;
    
    const result = await pool.query(
      `INSERT INTO maintenance_blocks (court_id, block_date, start_time, end_time, reason, created_by)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [court_id, block_date, start_time, end_time, reason, req.user.id]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating maintenance block:', error);
    res.status(500).json({ error: 'Failed to create maintenance block' });
  }
});

// Delete a maintenance block
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM maintenance_blocks WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Maintenance block not found' });
    }
    
    res.json({ message: 'Maintenance block deleted successfully' });
  } catch (error) {
    console.error('Error deleting maintenance block:', error);
    res.status(500).json({ error: 'Failed to delete maintenance block' });
  }
});

export default router;