import { pool } from '../database';
import { User } from '../interfaces/user';
import { Login } from '../interfaces/login';
import * as cryptoRandomString from 'crypto-random-string';

export async function addNewUser(
	role: string,
	personContact: string,
	mobileNumber: string,
	email: string,
	businessName: string,
	streetAddress1: string,
	streetAddress2: string,
	city: string,
	state: string,
	country: string,
	pincode: string,
	password: string,
	planID: string,
	created: number
	) { 
		let userID;
		let unique = true;
		while (unique === true){
			userID = cryptoRandomString({length:10});
			const rows = await pool.query(
				`SELECT * FROM user WHERE userID = ?;`,
				[userID]
			);
			rows.length === 0 ? unique = false : unique = true;
		}
		await pool.query(
			`
			INSERT INTO user (
				userID,
				role,
				personContact,
				mobileNumber,
				email,
				businessName,
				streetAddress1,
				streetAddress2,
				city,
				state,
				country,
				pincode,
				password,
				planID,
				created
			) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?);
			`,[
				userID,
				role,
				personContact,
				mobileNumber,
				email,
				businessName,
				streetAddress1,
				streetAddress2,
				city,
				state,
				country,
				pincode,
				password,
				planID,
				created
			]
	);
	return userID;
}

export async function addUserProducts(userID: string, productID: string) {
	await pool.query(
		`INSERT INTO userProducts(userID, productID) VALUES(?,?); `,
		[
			userID, 
			productID
		]
	);
}

export async function getUserByID(userID: string): Promise<User>{
	const rows = await pool.query(
		`SELECT * FROM user WHERE userID = ?;`, 
		[userID]
	);
	return rows.length === 0 ? null : rows[0];
}

export async function isEmailAvailable(email: string): Promise<boolean>{
	const rows = await pool.query(
		`SELECT * FROM user WHERE email = ?;`,
		[email]
	);
	return rows.length === 0;
}

export async function isMobileAvailable(mobileNumber: string): Promise<boolean>{
	const rows = await pool.query(
		`SELECT * FROM user WHERE mobileNumber = ?;`,
		[mobileNumber]
	);
	return rows.length === 0;
}

export async function isAdmin(userID: string): Promise<boolean>{
	const rows = await pool.query(
		`SELECT * FROM user WHERE userID = ?`,
		[userID]
	);
	return rows[0].role === 'admin';
}

export async function deleteUser(userID: string) {
	await pool.query(
		`DELETE FROM user WHERE userID = ?;`,
		[userID]
	);
}

export async function getUserByMobileNumber(mobileNumber: string): Promise<User> {
	const rows = await pool.query(
		`SELECT * FROM user WHERE mobileNumber = ?`, 
		[mobileNumber]
	);
	return rows.length === 0 ? null : rows[0];
}

export async function addNewLogin(userID: string, refreshToken: string, expiry: number){
	await pool.query('INSERT INTO login (refreshToken, userID, expiry) VALUES (?, ?, ?);', [refreshToken, userID, expiry]);
}

export async function isLoggedIn(userID: string): Promise<Boolean>{
	const rows = await pool.query('SELECT * FROM login WHERE userID = ?', [userID]);
	return rows.length != 0;
}

export async function logout(userID: string){
	await pool.query('DELETE FROM login WHERE userID = ?', [userID]);
}

export async function newPassword(userID: string, password: string){
	await pool.query('UPDATE user SET password = ? WHERE userID = ?', [password, userID]);
}

export async function findByRefreshToken(refreshToken: string): Promise<Login>{
	const rows = await pool.query('SELECT * FROM login WHERE refreshToken = ?', [refreshToken]);
	return rows.length === 0 ? null : rows[0];
}

export async function updateRefreshTokenExpiry(refreshToken: string, expiry: number){
	await pool.query('UPDATE login SET expiry = ? WHERE refreshToken = ?', [expiry, refreshToken]);
}

export async function findUserByID(userID: string): Promise<User>{
	const rows = await pool.query('SELECT * FROM user WHERE userID = ?', [userID]);
	return rows.length === 0 ? null : rows[0];
}
