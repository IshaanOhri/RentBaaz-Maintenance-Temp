import { pool } from '../database';
import {Product_Complaint} from '../interfaces/product';
import {ProductDetails} from '../interfaces/productDetails';
import {ProductFaults} from '../interfaces/productFaults';
import {Complaint} from '../interfaces/complaint';
import * as cryptoRandomString from 'crypto-random-string';

export async function getAllProductID(userID: string): Promise<Product_Complaint[]>{
    const rows = await pool.query(
        `SELECT * FROM userProducts WHERE userID = ?;`,
        [userID]
    );
    return rows;
}

export async function getProductDetail(productID: string): Promise<ProductDetails>{
    const rows = await pool.query(
        `SELECT * FROM product WHERE productID = ?;`,
        [productID]
    );
    return rows[0];
}

export async function getProductFaults(productID: string): Promise<ProductFaults[]>{
    const rows = await pool.query(
        `SELECT * FROM productFaults WHERE productID = ?;`,
        [productID]
    );
    return rows;
}

export async function addNewComplaint(
    userID: string,
    productID: string,
    faults: string,
    probDesc: string,
    dateOfComplaint: number,
    dateOfMaintenance: number,
    status: number,
    cost: number
): Promise<string>{
    let complaintID;
    let unique = true;
    while (unique === true){
        complaintID = cryptoRandomString({length:6,type:'numeric'});
        const rows = await pool.query(
            'SELECT * FROM complaint WHERE complaintID = ?;',
            [complaintID]
        );
        rows.length === 0 ? unique = false : unique = true;
    }
    await pool.query(
        `INSERT INTO complaint(
            complaintID,
            userID, 
            productID, 
            faults, 
            probDesc, 
            dateOfComplaint, 
            dateOfMaintenance, 
            status, 
            cost)
        VALUES(?,?,?,?,?,?,?,?,?);`,
        [
            complaintID,
            userID,
            productID,
            faults,
            probDesc,
            dateOfComplaint,
            dateOfMaintenance,
            status,
            cost
        ]
    );
    return complaintID;

}

export async function updateComplaintStatus(status: number,complaintID: string){
    await pool.query(
        `UPDATE complaint SET status = ? WHERE complaintID = ?;`,
        [
            status, 
            complaintID
        ]
    );
}

export async function checkComplaintID(complaintID: string): Promise<boolean>{
    const rows = await pool.query(
        `SELECT * FROM complaint WHERE complaintID = ?;`,
        [complaintID]
    );
    return rows.length === 0 ? false : true;
}

export async function deleteComplaint(complaintID: string){
    await pool.query(
        `DELETE FROM complaint WHERE complaintID = ?;`,
        [complaintID]
    );
}

export async function getComplaintCreation(complaintID: string): Promise<number> {
    const rows = await pool.query(
        `SELECT dateOfComplaint FROM complaint WHERE complaintID = ?;`,
        [complaintID]
    );
    return rows[0].dateOfComplaint;
}

export async function getAllUserComplaints(userID: string): Promise<Complaint[]>{
    const rows = await pool.query(
        `SELECT * FROM complaint WHERE userID = ?`,
        [userID]
    );
    return rows;
}

export async function findComplaintsByUserID(userID: string): Promise<Array<Complaint>>{
    const rows = await pool.query('SELECT * FROM complaint WHERE userID = ?', [userID]);
    return rows.length === 0 ? null : rows;
}

export async function getActiveComplaints(): Promise<Array<Complaint>>{
    const rows = await pool.query('SELECT * FROM complaint WHERE status = 0');
    return rows.length === 0 ? null : rows;
}

export async function getInactiveComplaints(): Promise<Array<Complaint>>{
    const rows = await pool.query('SELECT * FROM complaint WHERE status = 1');
    return rows.length === 0 ? null : rows;
}

export async function addCostToComplaint(complaintID: string, cost: number){
    await pool.query('UPDATE complaint SET cost = ? WHERE complaintID = ?', [cost, complaintID]);
}

export async function getUserNameByID(userID: string): Promise<string>{
    const rows = await pool.query('SELECT businessName FROM user WHERE userID = ?', [userID]);
    return rows.length === 0 ? null : rows[0].businessName;
}

export async function getProductNameByID(productID: string): Promise<string>{
    const rows = await pool.query('SELECT productName FROM product WHERE productID = ?', [productID]);
    return rows.length === 0 ? null : rows[0].productName;
}

export async function updateComplaintByID(complaintID: string,faults: string, probDesc: string, dateOfComplaint: number, dateOfMaintenance: number, status: boolean, cost: number){
    await pool.query('UPDATE complaint SET faults = ?, probDesc = ?, dateOfComplaint = ?, dateOfMaintenance = ?, status = ?, cost = ? WHERE complaintID = ?', [faults, probDesc, dateOfComplaint, dateOfMaintenance, status, cost, complaintID]);
}

export async function getComplaintByID(complaintID: string): Promise<Complaint>{
    const rows = await pool.query('SELECT * FROM complaint WHERE complaintID = ?', [complaintID]);
    return rows.length === 0 ? null : rows[0];
}