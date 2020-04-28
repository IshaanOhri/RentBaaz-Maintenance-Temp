import { pool } from '../database';
import { User } from '../interfaces/user';
import { Complaint } from '../interfaces/complaint';

export async function updatePassword(password: string, userID: string){
    await pool.query('UPDATE user SET password = ? WHERE userID = ?', [password,userID]);
}

export async function updateProfile(userID: string, personContact: string, businessName: string, streetAddress1: string, streetAddress2: string, city: string, state: string, country: string, pincode: string){
    await pool.query('UPDATE user SET personContact = ?, businessName = ?, streetAddress1 = ?, streetAddress2 = ?, city = ?, state = ?, country = ?, pincode = ? WHERE userID = ?', [personContact,businessName,streetAddress1,streetAddress2,city,state,country, pincode, userID])
}