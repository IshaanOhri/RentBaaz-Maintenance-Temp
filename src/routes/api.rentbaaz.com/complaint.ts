import { Router } from 'express';
import {
    getAllProductID,
    getProductDetail,
    getProductFaults,
    addNewComplaint,
    updateComplaintStatus,
    checkComplaintID,
    deleteComplaint,
    getComplaintCreation,
    getActiveComplaints,
    getInactiveComplaints,
    addCostToComplaint,
    getProductNameByID,
    getUserNameByID,
    getComplaintByID,
    updateComplaintByID,
    findComplaintsByUserID
} from '../../models/database';
import { errors, messages } from '../../config/errors';
import { tokenAuthenticator } from './middlewares';
import { ROLE } from '../../config/role';
import {PreComplaint} from '../../models/interfaces/preComplaint';

const router = Router();

router.get('/preComplaint',tokenAuthenticator(ROLE.USER), async(req, res) => {
    try{
        let productsDetails:PreComplaint[] = [];
        const userProducts = await getAllProductID(req.user.userID);

        for(let i = 0; i < userProducts.length; i++){
            const productDetail = await getProductDetail(userProducts[i].productID);
            const productFaults = await getProductFaults(userProducts[i].productID);

            let temp: string[] = [];
            productFaults.forEach((productFault) => {
                temp.push(productFault.fault);
            })

            let obj: PreComplaint = {
                productDetail : productDetail,
                productFaults : temp
            }
            productsDetails.push(obj);
        }
        res.send({
            success : true,
            response : productsDetails
        });
    }catch(e){
        res.status(500).send({
            error : errors.serverError,
            message : messages.serverError
        });
    }
});

router.post('/addComplaint', tokenAuthenticator(ROLE.USER), async(req, res) => {
    try{
        if(!req.body.productID ||
            !req.body.faults ||
            !req.body.dateOfComplaint ||
            !req.body.dateOfMaintenance){
            
            return res.status(400).send({
                success : false,
                error : errors.wrongParameters,
                message : messages.wrongParameters
            });
        }
        if(!req.body.probDesc){
            req.body.probDesc = null;
        }
        if(!req.body.status){
            req.body.status = 0;
        }
        if(!req.body.cost){
            req.body.cost = 0;
        }
        const complaintID = await addNewComplaint(
            req.user.userID,
            req.body.productID,
            req.body.faults,
            req.body.probDesc,
            req.body.dateOfComplaint,
            req.body.dateOfMaintenance,
            req.body.status,
            req.body.cost
        );
        res.send({
            success:true,
            complaintID : complaintID
        });
    }catch(e){
        res.status(500).send({
            error : errors.serverError,
            message : messages.serverError
        });
    }
});

router.patch('/updateComplaintStatus', tokenAuthenticator(ROLE.ADMIN), async(req, res) => {
    try{
        if(!req.body.status){
            return res.status(400).send({
                success: false,
                error: errors.wrongParameters,
                message: messages.wrongParameters
            });
        }
        const isComplaint = await checkComplaintID(req.query.complaintID);
        if(!isComplaint){
            return res.send({
                success: false,
                error: errors.invalidComplaintID,
                message: messages.invalidComplaintID
            });
        }
        await updateComplaintStatus(
            req.body.status,
            req.query.complaintID
        );
        res.send({
            success : true
        });

    }catch(e){
        res.status(500).send({
            error : errors.serverError,
            message : messages.serverError
        }); 
    }
});

router.delete('/cancelComplaintAdmin', tokenAuthenticator(ROLE.ADMIN), async(req, res)=>{
    try{
        const isComplaint = await checkComplaintID(req.query.complaintID);
        if(!isComplaint){
            return res.send({
                success: false,
                error: errors.invalidComplaintID,
                message: messages.invalidComplaintID
            });
        }
        await deleteComplaint(req.query.complaintID);
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

router.delete('/cancelComplaint', tokenAuthenticator(ROLE.USER), async(req, res) => {
    try{
        if(!req.body.timeStamp){
            return res.status(400).send({
                success: false,
                error: errors.wrongParameters,
                message: messages.wrongParameters
            });
        }
        const isComplaint = await checkComplaintID(req.query.complaintID);
        if(!isComplaint){
            return res.send({
                success: false,
                error: errors.invalidComplaintID,
                message: messages.invalidComplaintID
            });
        }
        const allowedDiff = 3 * 60 * 60 * 100; //3 hr difference
        const complaintCreated = await getComplaintCreation(req.query.complaintID);
        console.log(complaintCreated);
        if((req.body.timeStamp - complaintCreated) > allowedDiff){
            return res.send({
                success: false
            });
        }
        await deleteComplaint(req.query.complaintID);
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

router.post('/modifyComplaint', tokenAuthenticator(ROLE.ADMIN), async (req,res) => {
    try{
        if(!req.body.complaintID){
            res.status(400).send({
                success : false,
                error : errors.wrongParameters,
                message : messages.wrongParameters
            });
            return;
        }
        const userKeys = Object.keys(req.body);
        const reqKeys = ['complaintID','faults','probDesc','dateOfComplaint','dateOfMaintenance','status','cost'];

        const isValid = userKeys.every((key) => reqKeys.includes(key))

        if(!isValid){
            res.status(400).send({
                success : false,
                error : errors.wrongParameters,
                message : messages.wrongParameters
            });
            return;
        }
        const complaint = await getComplaintByID(req.body.complaintID);

        if(userKeys.includes('faults')){
            complaint.faults = req.body.faults;
        }
        if(userKeys.includes('probDesc')){
            complaint.probDesc = req.body.probDesc;
        }
        if(userKeys.includes('dateOfComplaint')){
            complaint.dateOfComplaint = req.body.dateOfComplaint;
        }
        if(userKeys.includes('dateOfMaintenance')){
            complaint.dateOfMaintenance = req.body.dateOfMaintenance;
        }
        if(userKeys.includes('status')){
            complaint.status = req.body.status;
        }
        if(userKeys.includes('cost')){
            complaint.cost = req.body.cost;
        }

        await updateComplaintByID(req.body.complaintID,complaint.faults,complaint.probDesc,complaint.dateOfComplaint,complaint.dateOfMaintenance,complaint.status,complaint.cost);

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

router.get('/myComplaints', tokenAuthenticator(ROLE.USER), async (req,res) => {
    try{
        const complaints = await findComplaintsByUserID(req.user.userID);

        if(complaints === null){
            res.status(404).send({
                success : false,
                error : errors.complaintNotFound,
                message : messages.complaintNotFound
            });
            return;
        }

        for (let i = 0 ; i < complaints.length ; i++){
            const businessName = await getUserNameByID(complaints[i].userID);
            const productName = await getProductNameByID(complaints[i].productID);
            complaints[i].businessName = businessName;
            complaints[i].productName = productName;
            delete complaints[i].userID;
            delete complaints[i].productID;
        }

        res.send({
            success : true,
            complaints
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

router.get('/activeComplaints', tokenAuthenticator(ROLE.ADMIN), async (req,res) => {
    try{
        const complaints = await getActiveComplaints();

        if(complaints === null){
            res.status(404).send({
                success : false,
                error : errors.complaintNotFound,
                message : messages.complaintNotFound
            });
            return;
        }

        for (let i = 0 ; i < complaints.length ; i++){
            const businessName = await getUserNameByID(complaints[i].userID);
            const productName = await getProductNameByID(complaints[i].productID);
            complaints[i].businessName = businessName;
            complaints[i].productName = productName;
            delete complaints[i].userID;
            delete complaints[i].productID;
        }

        res.send({
            success : true,
            complaints
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

router.get('/inactiveComplaints', tokenAuthenticator(ROLE.ADMIN), async (req,res) => {
    try{
        const complaints = await getInactiveComplaints();

        if(complaints === null){
            res.status(404).send({
                success : false,
                error : errors.complaintNotFound,
                message : messages.complaintNotFound
            });
            return;
        }

        for (let i = 0 ; i < complaints.length ; i++){
            const businessName = await getUserNameByID(complaints[i].userID);
            const productName = await getProductNameByID(complaints[i].productID);
            complaints[i].businessName = businessName;
            complaints[i].productName = productName;
            delete complaints[i].userID;
            delete complaints[i].productID;
        }

        res.send({
            success : true,
            complaints
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

router.post('/userComplaints', tokenAuthenticator(ROLE.ADMIN), async (req,res) => {
    try{
        if(!req.body.userID){
            res.status(400).send({
                success : false,
                error : errors.wrongParameters,
                message : messages.wrongParameters
            });
            return;
        }
        const complaints = await findComplaintsByUserID(req.body.userID);

        for (let i = 0 ; i < complaints.length ; i++){
            const businessName = await getUserNameByID(complaints[i].userID);
            const productName = await getProductNameByID(complaints[i].productID);
            complaints[i].businessName = businessName;
            complaints[i].productName = productName;
            delete complaints[i].userID;
            delete complaints[i].productID;
        }

        if(complaints === null){
            res.status(404).send({
                success : false,
                error : errors.complaintNotFound,
                message : messages.complaintNotFound
            });
            return;
        }

        res.send({
            success : true,
            complaints
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

router.post('/addCost', tokenAuthenticator(ROLE.ADMIN), async (req,res) => {
    try{
        if(!req.body.complaintID || !req.body.cost){
            res.status(400).send({
                error : errors.wrongParameters,
                messages : messages.wrongParameters
            });
            return;
        }

        await addCostToComplaint(req.body.complaintID, req.body.cost);

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

