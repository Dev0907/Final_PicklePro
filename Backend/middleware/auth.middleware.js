import jwt from 'jsonwebtoken';

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  }); 
}

export function authenticateOwner(req, res, next) {
  authenticateToken(req, res, () => {
    if (req.user) {
      // For now, allow any authenticated user to access owner routes
      // In production, you should check if user owns facilities
      return next();
    }
    return res.status(403).json({ message: 'Access denied. Authentication required.' });
  });
}

export function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    // No token provided, continue without user info
    req.user = null;
    return next();
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      // Invalid token, continue without user info
      req.user = null;
    } else {
      req.user = user;
    }
    next();
  });
}
