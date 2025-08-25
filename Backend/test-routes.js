// Simple test to verify routes are working
import express from 'express';
import bookingRoutes from './routes/bookingRoutes.js';

const app = express();
app.use(express.json());

// Test middleware to simulate authentication
app.use((req, res, next) => {
  // Simulate authenticated user
  req.user = { id: 1, role: 'owner' };
  next();
});

app.use('/api/bookings', bookingRoutes);

// Test endpoint
app.get('/test', (req, res) => {
  res.json({ message: 'Test endpoint working' });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
  console.log('Available routes:');
  console.log('GET /test');
  console.log('POST /api/bookings/slots/availability');
  
  // Test the endpoint
  setTimeout(async () => {
    try {
      const response = await fetch(`http://localhost:${PORT}/test`);
      const data = await response.json();
      console.log('Test endpoint response:', data);
    } catch (error) {
      console.error('Test failed:', error);
    }
  }, 1000);
});