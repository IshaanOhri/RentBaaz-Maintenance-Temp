import {pool} from '../database';
import {Plan} from '../interfaces/plan';
import {PlanProduct} from '../interfaces/planProducts';
import {User} from '../interfaces/user';
import * as cryptoRandomString from 'crypto-random-string';

export async function addNewPlan(
    cost: number,
    planName: string,
    description: string
): Promise<string>{
    let planID;
    let unique = true;
    while(unique === true){
        planID = cryptoRandomString({length: 4})
        const rows = await pool.query(
            `SELECT * FROM plans WHERE planID = ?;`,
            [planID]
        );
        rows.length === 0 ? unique = false : unique = true;
    }
    await pool.query(
        `INSERT INTO plans(
            planID,
            cost,
            planName,
            description
        ) VALUES (?,?,?,?);`,
        [
            planID,
            cost,
            planName,
            description
        ]
    );
    return planID;
}

export async function addPlanProduct(planID: string, productName: string){
    await pool.query(
        `INSERT INTO planProducts(
            planID,
            productName
        ) VALUES (?, ?);`,
        [
            planID,
            productName
        ]
    );
}

export async function checkPlan(planID: string): Promise<boolean>{
    const rows = await pool.query(
        `SELECT * FROM plans WHERE planID = ?;`,
        [planID]
    );
    return rows.length !== 0;
}

export async function removePlan(planID: string){
    await pool.query(
        `DELETE FROM plans WHERE planID = ?;`,
        [planID]
    );
}

export async function updateCost(planID: string, cost: number){
    await pool.query(
        `UPDATE plans SET cost = ? WHERE planID = ?;`,
        [
            cost,
            planID
        ]
    );
}

export async function updateName(planID: string, planName: string){
    await pool.query(
        `UPDATE plans SET planName = ? WHERE planID = ?;`,
        [
            planName,
            planID
        ]
    );
}

export async function updateDescription(planID: string, description: string){
    await pool.query(
        `UPDATE plans SET description = ? WHERE planID = ?;`,
        [
            description,
            planID
        ]
    );
}

export async function getPlan(planID: string): Promise<Plan>{
    const rows = await pool.query(
        `SELECT * FROM plans WHERE planID = ?;`,
        [planID]
    );
    return rows.length === 0 ? null : rows[0];
}

export async function getAllPlans(): Promise<Plan[]>{
    const rows = await pool.query(
        `SELECT * FROM plans;`
    );
    return rows;
}

export async function getPlanProducts(planID: string): Promise<PlanProduct[]>{
    const rows = await pool.query(
        `SELECT productName FROM planProducts WHERE planID = ?`,
        [planID]
    )
    return rows;
}

export async function getUsersByPlanID(planID: string): Promise<User[]>{
    const rows = await pool.query(
        `SELECT * FROM user WHERE planID = ? AND role = 'user';`,
        [planID]
    );
    return rows;
}

export async function updateUserPlan(userID: string, planID: string){
    await pool.query(
        `UPDATE user SET planID = ? WHERE userID = ? AND role = 'user';`,
        [
            planID,
            userID
        ]
    )
}

export async function deletePlanProduct(planID: string, productName: string){
    await pool.query(
        `DELETE FROM planProducts WHERE planID = ? AND productName = ?;`,
        [
            planID,
            productName
        ]
    );
}

export async function isNotPlanProduct(planID: string, productName: string): Promise<boolean>{
    const rows = await pool.query(
        `SELECT * FROM planProducts WHERE planID =? AND productName =?;`,
        [
            planID,
            productName
        ]
    );
    return rows.length === 0;
}