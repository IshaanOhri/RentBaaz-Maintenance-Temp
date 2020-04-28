import { Router } from 'express';
import { errors, messages } from '../../config/errors';
import { email, jwtSecret, passwordSaltRounds } from '../../config/config';

import { ROLE } from '../../config/role';
import { tokenAuthenticator } from './middlewares';
import { compare, hash } from 'bcrypt';
import { findUserByID,
    updatePassword,
    updateProfile
} from '../../models/database';

const router = Router();

router.post('/resetPassword', tokenAuthenticator(ROLE.BOTH), async (req, res) => {
    try{
        if(!req.body.oldPassword || !req.body.newPassword){
            res.status(400).send({
                success : false,
                error : errors.wrongParameters,
                message : messages.wrongParameters
            });
            return;
        }

        const verify = await compare(req.body.oldPassword, req.user.password);
        if(!verify){
            res.send({
                success : false,
                error : errors.invalidPassword,
                messages : messages.invalidPassword
            });
            return;
        }

        await updatePassword(await hash(req.body.newPassword, passwordSaltRounds), req.user.userID);

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

router.get('/viewProfile', tokenAuthenticator(ROLE.BOTH), async (req, res) => {
    try{
        const user = req.user;

        delete user.userID;
        delete user.password;
        delete user.created;

        res.send({
            success : true,
            user
        })
    }catch(error){
        res.status(500).send({
            success : false,
			error : errors.serverError,
			messages : messages.serverError
		});
		return;
    }
})

router.patch('/editProfile', tokenAuthenticator(ROLE.BOTH), async(req, res) => {
    try{
        const userKeys = Object.keys(req.body);
        const reqKeys = ['personContact','businessName','streetAddress1','streetAddress2','city','state','country', 'pincode'];

        const isValid = userKeys.every((key) => reqKeys.includes(key))

        if(!isValid){
            res.status(400).send({
                success : false,
                error : errors.wrongParameters,
                message : messages.wrongParameters
            });
            return;
        }

        const user = req.user;

        if(userKeys.includes('personContact')){
            user.personContact = req.body.personContact;
        }
        if(userKeys.includes('businessName')){
            user.businessName = req.body.businessName;
        }
        if(userKeys.includes('streetAddress1')){
            user.streetAddress1 = req.body.streetAddress1;
        }
        if(userKeys.includes('streetAddress2')){
            user.streetAddress2 = req.body.streetAddress2;
        }
        if(userKeys.includes('city')){
            user.city = req.body.city;
        }
        if(userKeys.includes('state')){
            user.state = req.body.state;
        }
        if(userKeys.includes('country')){
            user.country = req.body.country;
        }
        if(userKeys.includes('pincode')){
            user.pincode = req.body.pincode;
        }

        await updateProfile(user.userID, user.personContact, user.businessName, user.streetAddress1, user.streetAddress2, user.city, user.state, user.country, user.pincode);

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