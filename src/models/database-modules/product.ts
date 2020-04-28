import { pool } from '../database';
import { Product } from '../interfaces/product';

export async function addNewProduct(productID: string, productName: string, productModel: string){
    await pool.query('INSERT into product VALUES(?, ?, ?)', [productID, productName, productModel]);
}

export async function addNewFault(productID: string, fault: string){
    await pool.query('INSERT into productFaults VALUES(?, ?)', [productID, fault]);
}

export async function deleteProduct(productID: string){
    await pool.query('DELETE FROM product WHERE productID = ?', [productID]);
}

export async function getProducts(): Promise<Product[]>{
    const rows = await pool.query('SELECT * FROM product');
    return rows.length === 0 ? null : rows;
}

export async function findProductByID(productID: string): Promise<Product>{
    const rows = await pool.query('SELECT * FROM product WHERE productID = ?', [productID]);
    return rows.length === 0 ? null : rows[0];
}

export async function removeFault(productID: string, fault: string){
    await pool.query('DELETE FROM productFaults WHERE productID = ? AND fault = ?', [productID, fault]);
}

export async function updateProductByID(productID: string,productName: string, productModel: string){
    await pool.query('UPDATE product SET productName = ?, productModel = ? WHERE productID = ?', [productName, productModel, productID]);
}

export async function findFaultsByID(productID: string): Promise<any[]>{
    const rows = await pool.query('SELECT * FROM productFaults WHERE productID = ?', [productID]);
    return rows.length === 0 ? null : rows;
}