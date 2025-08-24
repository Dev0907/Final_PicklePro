import jwt from "jsonwebtoken";
import pool from "../db.js";

export async function adminLogin(req, res) {
  try {
    const { email, password } = req.body;

    // Hardcoded admin credentials
    const HARDCODED_ADMIN = {
      email: "admin@odoo.com",
      password: "123456",
      id: 1,
      full_name: "System Administrator",
      is_super_admin: true,
    };

    // Check if the provided credentials match the hardcoded admin
    if (
      email !== HARDCODED_ADMIN.email ||
      password !== HARDCODED_ADMIN.password
    ) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: HARDCODED_ADMIN.id,
        email: HARDCODED_ADMIN.email,
        role: "admin",
        is_super_admin: HARDCODED_ADMIN.is_super_admin,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Return success response with token and admin data
    res.status(200).json({
      user: {
        id: HARDCODED_ADMIN.id,
        email: HARDCODED_ADMIN.email,
        full_name: HARDCODED_ADMIN.full_name,
        is_super_admin: HARDCODED_ADMIN.is_super_admin,
        role: "admin",
      },
      token,
    });
  } catch (err) {
    console.error("Admin login error:", err);
    res.status(500).json({ error: "Server error during admin login" });
  }
}

// Middleware to verify admin token
export function verifyAdminToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }

    // Check if the user has admin role
    if (decoded.role !== "admin") {
      return res.status(403).json({ error: "Access denied. Admins only." });
    }

    // Attach the decoded token to the request for use in other routes
    req.user = decoded;
    next();
  });
}

// Middleware to check if admin is super admin
export function isSuperAdmin(req, res, next) {
  if (req.user && req.user.is_super_admin) {
    return next();
  }
  res.status(403).json({ error: "Access denied. Super admin only." });
}
