import { Router } from 'express';
import {
    getAllUsers,
    getUserByID,
    getAllProductID,
    getProductDetail,
    getPlan,
    getPlanProducts,
    getAllUserComplaints
} from '../../models/database';
import { errors, messages } from '../../config/errors';
import { tokenAuthenticator } from './middlewares';
import { ROLE } from '../../config/role';
import { Complaint } from '../../models/interfaces/complaint';
import { ProductDetails } from '../../models/interfaces/productDetails';

const router = Router();

router.get('/getAllUsers', tokenAuthenticator(ROLE.ADMIN), async(req, res) => {
    try{
        const users = await getAllUsers();
        res.send({
            success: true,
            users: users
        });
    }catch(e){
        res.status(500).send({
            error : errors.serverError,
            message : messages.serverError
        });
    }
});

router.get('/getUserDetails', tokenAuthenticator(ROLE.ADMIN), async(req, res) => {
    try{
        if(!req.query.userID){
            return res.status(400).send({
                success: false,
                error: errors.wrongParameters,
                message: messages.wrongParameters
            });
        }
        const user = await getUserByID(req.query.userID);
        if(!user){
            return res.send({
                success: false,
                error: errors.notFound,
                message: messages.notFound
            });
        }
        let productDetails: ProductDetails[] = [];
        //let complaintDetails: Complaint[] = [];
        const userProducts = await getAllProductID(req.query.userID);
        for(let i = 0; i < userProducts.length; i++){
            const productDetail = await getProductDetail(userProducts[i].productID);
            productDetails.push(productDetail)
        }
        delete user['password'];
        const plan = await getPlan(user.planID);
        //const planProducts = await getPlanProducts(user.planID); //?
        const complaints = await getAllUserComplaints(user.userID);

        res.send({
            success: true,
            userDetail: user,
            productDetails: productDetails,
            userPlan: plan,
            userComplaints: complaints
        });
    }catch(e){
        res.status(500).send({
            error : errors.serverError,
            message : messages.serverError
        });
    }
})

export default router;