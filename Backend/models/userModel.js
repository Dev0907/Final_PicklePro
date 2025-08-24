import pool from '../db.js';

export async function findUserByEmail(email) {
  const res = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return res.rows[0];
}

export async function createUser(user) {
  const {
    fullname, email, phone_no, age, gender, level_of_game, password, user_type
  } = user;
  const res = await pool.query(
    `INSERT INTO users (fullname, email, phone_no, age, gender, level_of_game, password, user_type)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [fullname, email, phone_no, age, gender, level_of_game, password, user_type]
  );
  return res.rows[0];
} 