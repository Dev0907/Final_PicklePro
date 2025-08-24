import bcrypt from 'bcrypt';
import { findUserByEmail, createUser } from '../models/userModel.js';
import jwt from 'jsonwebtoken';
import { findOwnerByEmail, createOwner } from '../models/ownersModel.js';

export async function signup(req, res) {
  try {
    const { name, email, phone, age, gender, level, password } = req.body;

    // Basic validation
    if (!name || !email || !phone || !age || !gender || !level || !password) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    // Check if user exists
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user (always as player)
    const newUser = await createUser({
      fullname: name,
      email,
      phone_no: phone,
      age,
      gender,
      level_of_game: level,
      password: hashedPassword,
      user_type: 'player'
    });

    // Remove password from response
    delete newUser.password;

    res.status(201).json({ user: newUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    let user = null;
    let userType = '';
    // First check owners table
    user = await findOwnerByEmail(email);
    if (user) {
      userType = 'owner';
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }
      delete user.password;
      user.role = 'owner'; // Add role to user object
      const token = jwt.sign(
        { id: user.id, email: user.email, role: 'owner' },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );
      return res.status(200).json({ user, token });
    } else {
      // Otherwise, check users table
      user = await findUserByEmail(email);
      userType = user?.user_type || 'player';
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }
      delete user.password;
      user.role = 'player'; // Add role to user object
      const token = jwt.sign(
        { id: user.id, email: user.email, role: 'player' },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );
      return res.status(200).json({ user, token });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
}

export async function ownerSignup(req, res) {
  try {
    const { name, email, password, phone, location, no_of_courts } = req.body;
    // Basic validation
    if (!name || !email || !password || !phone || !location || !no_of_courts) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
    // Check if owner already exists
    const existingOwner = await findOwnerByEmail(email);
    if (existingOwner) {
      return res.status(409).json({ error: 'Email already registered.' });
    }
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    // Create owner
    const newOwner = await createOwner({
      full_name: name,
      email,
      location,
      number_of_courts: no_of_courts,
      password: hashedPassword,
      phone_number: phone
    });
    // Remove password from response
    delete newOwner.password;
    res.status(201).json({ owner: newOwner });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
} 