import {pool} from '../database';
import {UserID} from '../interfaces/userID';

export async function getAllUsers(): Promise<UserID[]>{
    const rows = await pool.query(
        `SELECT userID, businessName FROM user WHERE role = 'user';`
    );
    return rows;
}