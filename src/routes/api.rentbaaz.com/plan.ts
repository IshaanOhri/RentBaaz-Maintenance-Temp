import { Router } from 'express';
import {
    addNewPlan,
    addPlanProduct,
    checkPlan,
    removePlan,
    updateCost,
    updateName,
    updateDescription,
    getAllPlans,
    getPlanProducts,
    getUsersByPlanID,
    updateUserPlan,
    isAdmin,
    deletePlanProduct,
    isNotPlanProduct
} from '../../models/database';
import { errors, messages } from '../../config/errors';
import { tokenAuthenticator } from './middlewares';
import { ROLE } from '../../config/role';
import {PlanDetail} from '../../models/interfaces/planDetails';

const router = Router();

router.post('/createPlan',tokenAuthenticator(ROLE.ADMIN), async(req, res) => {
    try{
        if(
            !req.body.cost||
            !req.body.planName||
            !req.body.description||
            !req.body.planProducts
        ){
            return res.status(400).send({
                success: false,
                error: errors.wrongParameters,
                message: messages.wrongParameters
            });
        }
        const planID = await addNewPlan(
            req.body.cost,
            req.body.planName,
            req.body.description
        );
        for(let i = 0; i < req.body.planProducts.length; i++){
            await addPlanProduct(planID, req.body.planProducts[i]);
        }
        res.send({
            success: true,
            planID: planID
        });
    }catch(e){
        res.status(500).send({
            error : errors.serverError,
            message : messages.serverError
        });
    }
});

router.delete('/removePlan', tokenAuthenticator(ROLE.ADMIN), async(req, res) => {
    try{
        if(!req.query.planID){
            return res.status(400).send({
                success: false,
                error: errors.wrongParameters,
                message: messages.wrongParameters
            });
        }
        const plan = await checkPlan(req.query.planID);
        if(!plan){
            return res.send({
                success: false,
                error: errors.invalidPlanID,
                message: messages.invalidPlanID
            });
        }
        await removePlan(req.query.planID);
        res.send({
            success: true
        });
    }catch(e){
        res.status(500).send({
            error : errors.serverError,
            message : messages.serverError
        });
    }
});

router.patch('/modifyPlan', tokenAuthenticator(ROLE.ADMIN), async(req, res) => {
    try{
        if(
            !req.body.cost &&
            !req.body.planName &&
            !req.body.description
        ){
            return res.status(400).send({
                success: false,
                error: errors.wrongParameters,
                message: messages.wrongParameters
            });
        }
        if(!req.query.planID){
            return res.status(400).send({
                success: false,
                error: errors.wrongParameters,
                message: messages.wrongParameters
            });
        }
        const plan = await checkPlan(req.query.planID);
        if(!plan){
            return res.send({
                success: false,
                error: errors.invalidPlanID,
                message: messages.invalidPlanID
            });
        }
        if(req.body.cost){
            await updateCost(
                req.query.planID,
                req.body.cost
            );
        }
        if(req.body.planName){
            await updateName(
                req.query.planID,
                req.body.planName
            );
        }
        if(req.body.description){
            await updateDescription(
                req.query.planID,
                req.body.description
            )
        }
        res.send({
            success: true
        });
    
    }catch(e){
        res.status(500).send({
            error : errors.serverError,
            message : messages.serverError
        });
    }
});

router.get('/getPlans', tokenAuthenticator(ROLE.BOTH), async(req, res) => {
    try{
        let planDetails: PlanDetail[] = []
        const plans  = await getAllPlans();
        for(let i = 0; i < plans.length; i++){
            const planProducts = await getPlanProducts(plans[i].planID);
            
            let temp:string[] = [];
            planProducts.forEach((p) => {
                temp.push(p.productName);
            });
            planDetails.push({
                plan : plans[i],
                planProducts : temp
            });
        }
        res.send({
            success: true,
            response: planDetails
        });
    }catch(e){
        res.status(500).send({
            error : errors.serverError,
            message : messages.serverError
        });
    }
});

router.get('/getUsersByPlan', tokenAuthenticator(ROLE.ADMIN), async(req, res) => {
    try{
        if(!req.query.planID){
            return res.status(400).send({
                success: false,
                error: errors.wrongParameters,
                message: messages.wrongParameters
            });
        }
        const plan = await checkPlan(req.query.planID);
        if(!plan){
            return res.send({
                success: false,
                error: errors.invalidPlanID,
                message: messages.invalidPlanID
            });
        }
        const users = await getUsersByPlanID(req.query.planID);
        users.forEach((user) => {
            delete user['password'];
        });
        res.send({
            success: true,
            users : users
        });
    }catch(e){
        res.status(500).send({
            error : errors.serverError,
            message : messages.serverError
        });
    }
});

router.patch('/editUserPlan', tokenAuthenticator(ROLE.ADMIN), async(req, res) => {
    try{
        if(
            !req.query.userID ||
            !req.body.planID
        ){
            return res.status(400).send({
                success: false,
                error: errors.wrongParameters,
                message: messages.wrongParameters
            });
        }
        const plan = await checkPlan(req.body.planID);
        if(!plan){
            return res.send({
                success: false,
                error: errors.invalidPlanID,
                message: messages.invalidPlanID
            });
        }
        const admin = await isAdmin(req.query.userID);
        if(admin){
            return res.send({
                success: false,
                error: errors.unprivileged,
                message: messages.unprivileged
            });
        }
    
        await updateUserPlan(
            req.query.userID,
            req.body.planID
        );
        
        res.send({
            success: true
        });
    }catch(e){
        res.status(500).send({
            error : errors.serverError,
            message : messages.serverError
        });
    }
})

router.post('/addPlanProducts', tokenAuthenticator(ROLE.ADMIN), async(req, res) => {
    try{
        if(
            !req.body.productName||
            !req.query.planID
        ){
            return res.status(400).send({
                success: false,
                error: errors.wrongParameters,
                message: messages.wrongParameters
            });
        }
        const plan = await checkPlan(req.query.planID);
        if(!plan){
            return res.send({
                success: false,
                error: errors.invalidPlanID,
                message: messages.invalidPlanID
            });
        }
        const check = await isNotPlanProduct(
            req.query.planID,
            req.body.productName
        );
        if(!check){
            return res.send({
                success: false,
                error: errors.productExist,
                message: messages.productExist
            });
        }
        await addPlanProduct(
            req.query.planID,
            req.body.productName
        );
        res.send({
            success: true
        });
    
    }catch(e){
        res.status(500).send({
            error : errors.serverError,
            message : messages.serverError
        });
    }
});

router.delete('/deletePlanProducts', tokenAuthenticator(ROLE.ADMIN), async(req, res) => {
    try{
        if(
            !req.body.productName||
            !req.query.planID
        ){
            return res.status(400).send({
                success: false,
                error: errors.wrongParameters,
                message: messages.wrongParameters
            });
        }
        const plan = await checkPlan(req.query.planID);
        if(!plan){
            return res.send({
                success: false,
                error: errors.invalidPlanID,
                message: messages.invalidPlanID
            });
        }
        const check = await isNotPlanProduct(
            req.query.planID,
            req.body.productName
        );
        if(check){
            return res.send({
                success: false,
                error: errors.productNotExist,
                message: messages.productNotExist
            });
        }
        await deletePlanProduct(
            req.query.planID,
            req.body.productName
        );
        res.send({
            success: true
        });
    
    }catch(e){
        res.status(500).send({
            error : errors.serverError,
            message : messages.serverError
        });
    }
});

export default router;