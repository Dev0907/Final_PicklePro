import pool from '../db.js';

export async function findOwnerByEmail(email) {
  const res = await pool.query('SELECT * FROM owners WHERE email = $1', [email]);
  return res.rows[0];
}

export async function createOwner(owner) {
  const {
    full_name, email, location, number_of_courts, password, phone_number
  } = owner;
  const res = await pool.query(
    `INSERT INTO owners (full_name, email, location, number_of_courts, password, phone_number)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [full_name, email, location, number_of_courts, password, phone_number]
  );
  return res.rows[0];
}