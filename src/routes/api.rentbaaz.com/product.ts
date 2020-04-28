import { Router } from 'express';
import { errors, messages } from '../../config/errors';
import { ROLE } from '../../config/role';
import { tokenAuthenticator } from './middlewares';
import { addNewProduct,
    addNewFault,
    deleteProduct,
    getProducts,
    findProductByID,
    removeFault,
    updateProductByID,
    findFaultsByID
} from '../../models/database';
import * as cryptoRandomString from 'crypto-random-string';
import { Product } from '../../models/interfaces/product';

const router = Router();

router.post('/addProduct', tokenAuthenticator(ROLE.ADMIN), async(req,res) => {
    try{
        if(!req.body.productName || !req.body.productModel || !req.body.faults){
            res.status(400).send({
                success : false,
                error : errors.wrongParameters,
                message : messages.wrongParameters
            });
            return;
        }

        const productID = cryptoRandomString({length : 10});

        await addNewProduct(productID, req.body.productName, req.body.productModel);

        for(let i = 0; i < req.body.faults.length ; i++){
            await addNewFault(productID, req.body.faults[i]);
        }

        res.send({
            success : true
        });
        return;

    }catch(error){
        res.status(500).send({
            success : false,
			error : errors.serverError,
			messages : messages.serverError
		});
		return;
    }
})

router.delete('/removeProduct', tokenAuthenticator(ROLE.ADMIN), async(req,res) => {
    try{
        if(!req.body.productID){
            res.status(400).send({
                success : false,
                error : errors.wrongParameters,
                message : messages.wrongParameters
            });
            return;
        }

        await deleteProduct(req.body.productID);

        res.send({
            success : true
        });
        return;

    }catch(error){
        res.status(500).send({
            success : false,
			error : errors.serverError,
			messages : messages.serverError
		});
		return;
    }
})

router.get('/getProducts', tokenAuthenticator(ROLE.ADMIN), async(req, res) => {
    try{
        let productDetails: Product[] = []
        const products = await getProducts();

        if(products === null){
            res.send({
                success : false,
                error : errors.productNotFound,
                message : messages.productNotFound
            });
            return;
        }

        for(let i = 0 ; i < products.length ; i++){

            let temp: Product = products[i];

            let faults = await findFaultsByID(temp.productID);

            temp.faults = [];

            faults.forEach((fault) => {
                temp.faults.push(fault.fault);
            })

            productDetails.push(temp);
        }

        res.send({
            success : true,
            productDetails
        });
        return;

    }catch(error){
        res.status(500).send({
            success : false,
			error : errors.serverError,
			messages : messages.serverError
		});
		return;
    }
})

router.post('/addFaults', tokenAuthenticator(ROLE.ADMIN), async(req, res) => {
    try{
        if(!req.body.faults || !req.body.productID){
            res.send({
                success : false,
                error : errors.wrongParameters,
                message : messages.wrongParameters
            });
            return;
        }

        const product = await findProductByID(req.body.productID);

        if(product === null){
            res.send({
                success : false,
                error : errors.productNotFound,
                message : messages.productNotFound
            });
            return;
        }

        for(let i = 0; i < req.body.faults.length ; i++){
            await addNewFault(req.body.productID, req.body.faults[i]);
        }

        res.send({
            success : true
        });
        return;

    }catch(error){
        res.status(500).send({
            success : false,
			error : errors.serverError,
			messages : messages.serverError
		});
		return;
    }
})

router.delete('/removeFaults', tokenAuthenticator(ROLE.ADMIN), async(req, res) => {
    try{
        if(!req.body.faults || !req.body.productID){
            res.send({
                success : false,
                error : errors.wrongParameters,
                message : messages.wrongParameters
            });
            return;
        }

        const product = await findProductByID(req.body.productID);

        if(product === null){
            res.send({
                success : false,
                error : errors.productNotFound,
                message : messages.productNotFound
            });
            return;
        }

        for(let i = 0; i < req.body.faults.length ; i++){
            await removeFault(req.body.productID, req.body.faults[i]);
        }

        res.send({
            success : true
        });
        return;

    }catch(error){
        res.status(500).send({
            success : false,
			error : errors.serverError,
			messages : messages.serverError
		});
		return;
    }
})

router.patch('/modifyProduct', tokenAuthenticator(ROLE.ADMIN), async(req, res) => {
    try{
        if(!req.body.productID){
            res.status(400).send({
                success : false,
                error : errors.wrongParameters,
                message : messages.wrongParameters
            });
            return;
        }

        const userKeys = Object.keys(req.body);
        const reqKeys = ['productID','productName','productModel'];

        const isValid = userKeys.every((key) => reqKeys.includes(key))

        if(!isValid){
            res.status(400).send({
                success : false,
                error : errors.wrongParameters,
                message : messages.wrongParameters
            });
            return;
        }

        const product = await findProductByID(req.body.productID);

        if(userKeys.includes('productName')){
            product.productName = req.body.productName;
        }
        if(userKeys.includes('productModel')){
            product.productModel = req.body.productModel;
        }

        await updateProductByID(product.productID, product.productName, product.productModel);

        res.send({
            success : true
        });
        return;

    }catch(error){
        res.status(500).send({
            success : false,
			error : errors.serverError,
			messages : messages.serverError
		});
		return;
    }
})

export default router;