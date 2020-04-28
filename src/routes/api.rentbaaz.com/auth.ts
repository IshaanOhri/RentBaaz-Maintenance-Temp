import { Router } from 'express';
import { compare, hash } from 'bcrypt';
import { createTransport } from 'nodemailer';
import {
	isEmailAvailable,
	addNewUser,
	isMobileAvailable,
	isAdmin,
	deleteUser,
	addUserProducts,
	getUserByMobileNumber,
	isLoggedIn,
	logout,
	newPassword,
	addNewLogin,
	findByRefreshToken,
	updateRefreshTokenExpiry,
} from '../../models/database';
import { errors, messages } from '../../config/errors';
import { email, jwtSecret, passwordSaltRounds } from '../../config/config';
import { isEmailValid, isPhoneNumberValid } from '../../models/interfaces/validators';
import { tokenAuthenticator } from './middlewares';
import { ROLE } from '../../config/role';
import * as cryptoRandomString from 'crypto-random-string';
const jwt = require('jsonwebtoken');

const router = Router();

const transporter = createTransport({
	host: email.host,
	port: email.port,
	secure: email.secure,
	auth: {
		user: email.username,
		pass: email.password
	}
});

router.post('/login', async(req,res) => {
	try{
		if(!req.body.mobileNumber || !req.body.password){
			res.status(400).send({
				success : false,
				error : errors.wrongParameters,
				message : messages.wrongParameters
			});
			return;
		}
	
		const user = await getUserByMobileNumber(req.body.mobileNumber);
		if(user === null){
			res.status(404).send({
				success : false,
				error : errors.userNotFound,
				message : messages.userNotFound
			});
			return;
		}
	
		const success = await compare(req.body.password, user.password);
		if(!success){
			res.status(400).send({
				success : false,
				error : errors.invalidPassword,
				message : messages.invalidPassword
			});
			return;
		}
	
		const userID = user.userID;
	
		if(await isLoggedIn(userID)){
			await logout(userID);
		}
	
		const refreshToken = cryptoRandomString({length : 36, type : 'url-safe'});
		const timestamp = Date.now();
		const tokenExpiry = timestamp + (15 * 24 * 60 * 60 * 1000);  //15 Days
	
		const accessToken = jwt.sign({
			userID
		}, jwtSecret, {
			expiresIn : '3h'
		});
	
		res.send({
			success : true,
			refreshToken,
			accessToken
		});
	
		await addNewLogin(userID, refreshToken, tokenExpiry);
	}catch(error){
		res.status(500).send({
            success : false,
			error : errors.serverError,
			messages : messages.serverError
		});
	}
	return;
})

router.post('/forgotPassword', async(req,res) => {
	try{
		if(!req.body.mobileNumber){
			res.status(400).send({
				success : false,
				error : errors.wrongParameters,
				message : messages.wrongParameters
			});
			return;
		}
	
		const user = await getUserByMobileNumber(req.body.mobileNumber);
		if(user === null){
			res.status(404).send({
				success : false,
				error : errors.userNotFound,
				message : messages.userNotFound
			});
			return;
		}
	
		const password = cryptoRandomString({length : 8});
		const encodedPassword = await hash(password,passwordSaltRounds);
		await newPassword(user.userID, encodedPassword);
	
		let mail = {
			from : email.from,
			to : user.email,
			subject : 'Forgot Password',
			text : `New password ${password}`
		};
	
		transporter.sendMail(mail, function(error: any, data: any)  {
			if(error){
				console.log(error)
			}
		});
	
		res.send({
			success : true,
			message : 'New password sent on registered email.'
		});
	}catch(error){
		res.status(500).send({
            success : false,
			error : errors.serverError,
			messages : messages.serverError
		});
	}
	return;
})

router.get('/refresh', async(req,res) => {
	try{
		if(!req.headers.authorization){
			res.status(400).send({
				success : false,
				error : errors.wrongParameters,
				message : messages.wrongParameters
			});
			return;
		}

		const login = await findByRefreshToken(req.headers.authorization);
		if(login == null){
			res.status(400).send({
				success : false,
				error : errors.wrongParameters,
				message : messages.wrongParameters
			});
			return;
		}

		if(login.expiry < Date.now()){
			res.status(401).send({
				success : false,
				error : errors.unauthorized,
				message : messages.unauthorized
			});
			return;
		}

		const timestamp = Date.now();
		const tokenExpiry = timestamp + (15 * 24 * 60 * 60 * 1000);  //15 Days
	
		const accessToken = jwt.sign({
			usedID : login.userID
		}, jwtSecret, {
			expiresIn : '3h'
		});
	
		res.send({
			success : true,
			accessToken
		});	

		await updateRefreshTokenExpiry(req.headers.authorization, tokenExpiry);
	}catch(error){
		res.status(500).send({
            success : false,
			error : errors.serverError,
			messages : messages.serverError
		});
		return;
	}

})

router.get('/logout', tokenAuthenticator('*'), async(req, res) => {
	try{
		await logout(req.user.userID);
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

router.post('/newUser',tokenAuthenticator(ROLE.ADMIN), async(req, res)=>{
	try{
		if(!req.body){
			return res.status(400).send({
				success: false,
				error: errors.wrongParameters,
				message: messages.wrongParameters
			});
		}
		if(!isEmailValid(req.body.email)){
			return res.send({
				success: false,
				error: errors.invalidEmail,
				message: messages.invalidEmail
			});
		}

		const emailAvailable = await isEmailAvailable(req.body.email);
		if (!emailAvailable) {
			return res.send({
				success: false,
				error: errors.emailTaken,
				message: messages.emailTaken
			});
		}

		if(!isPhoneNumberValid(req.body.mobileNumber)){
			res.json({
				success: false,
				error: errors.invalidPhoneNumber,
				message: messages.invalidPhoneNumber
			});
		}

		const mobileAvailable = await isMobileAvailable(req.body.mobileNumber);
		if (!mobileAvailable) {
				return res.send({
					success: false,
					error: errors.mobileTaken,
					message: messages.mobileTaken
			});
		}

		const password = cryptoRandomString({length : 8});
		const hashPassword = await hash(password, passwordSaltRounds);

		res.send({
			success : true,
			mobileNumber : req.body.mobileNumber,
			password : password
		})

		const userID = await addNewUser(
			req.body.role,
			req.body.personContact,
			req.body.mobileNumber,
			req.body.email,
			req.body.businessName,
			req.body.streetAddress1,
			req.body.streetAddress2,
			req.body.city,
			req.body.state,
			req.body.country,
			req.body.pincode,
			hashPassword,
			req.body.planID,
			Date.now()
		);
		req.body.products.forEach(async(productID: string) => {
			await addUserProducts(userID, productID)
		})
	}catch(e){
		res.status(500).send({
			error : errors.serverError,
			messages : messages.serverError
		});
	}

});

router.get('/emailAvailable',tokenAuthenticator(ROLE.ADMIN), async (req, res) => {
	try{
		if (!req.query.email) {
			return res.status(400).send({
				success: false,
				error: errors.wrongParameters,
				message: messages.wrongParameters
			});
		}

		if (!isEmailValid(req.query.email)) {
			return res.send({
				success: false,
				error: errors.invalidEmail,
				message: messages.invalidEmail
			});
		}
		const emailAvailable = await isEmailAvailable(req.query.email);
		if (!emailAvailable) {
			return res.send({
				success: false,
				error: errors.emailTaken,
				message: messages.emailTaken
			});
		}

		res.json({
			success: true
		});	
	}catch(e){
		res.status(500).send({
			error : errors.serverError,
			messages : messages.serverError
		});
	}
});

router.get('/mobileAvailable',tokenAuthenticator(ROLE.ADMIN), async (req, res) => {
	try{
		if (!req.query.mobile) {
			return res.status(400).send({
				success: false,
				error: errors.wrongParameters,
				message: messages.wrongParameters
			});
		}

		if (!isPhoneNumberValid(req.query.mobile)) {
			return res.send({
				success: false,
				error: errors.invalidPhoneNumber,
				message: messages.invalidPhoneNumber
			});
		}
		const mobileAvailable = await isMobileAvailable(req.query.mobile);
		if (!mobileAvailable) {
			return res.send({
				success: false,
				error: errors.mobileTaken,
				message: messages.mobileTaken
			});
		}

		res.json({
			success: true
		});
	}catch(e){
		res.status(500).send({
			error : errors.serverError,
			messages : messages.serverError
		});
	}
});

router.delete('/userDelete',tokenAuthenticator(ROLE.ADMIN), async(req, res)=>{
	try{
		if (!req.query.userId) {
			return res.status(400).send({
				success: false,
				error: errors.wrongParameters,
				message: messages.wrongParameters
			});
		}
		const admin = await isAdmin(req.query.userId);
		if(admin){
			return res.send({
				success: false,
				error: errors.unprivileged,
				message: messages.unprivileged
			});
		}

		res.send({
			success: true
		});
		await deleteUser(req.query.userId);
	}catch(e){
		res.status(500).send({
			error : errors.serverError,
			messages : messages.serverError
		});
	}
});

router.post('/newUser',tokenAuthenticator(ROLE.ADMIN), async(req, res)=>{
	try{
		if(!req.body){
			return res.status(400).send({
				success: false,
				error: errors.wrongParameters,
				message: messages.wrongParameters
			});
		}
		if(!isEmailValid(req.body.email)){
			return res.send({
				success: false,
				error: errors.invalidEmail,
				message: messages.invalidEmail
			});
		}

		const emailAvailable = await isEmailAvailable(req.body.email);
		if (!emailAvailable) {
			return res.send({
				success: false,
				error: errors.emailTaken,
				message: messages.emailTaken
			});
		}

		if(!isPhoneNumberValid(req.body.mobileNumber)){
			res.json({
				success: false,
				error: errors.invalidPhoneNumber,
				message: messages.invalidPhoneNumber
			});
		}

		const mobileAvailable = await isMobileAvailable(req.body.mobileNumber);
		if (!mobileAvailable) {
				return res.send({
					success: false,
					error: errors.mobileTaken,
					message: messages.mobileTaken
			});
		}

		const password = cryptoRandomString({length : 8});
		const hashPassword = await hash(password, passwordSaltRounds);

		res.send({
			success : true,
			mobileNumber : req.body.mobileNumber,
			password : password
		})

		const userID = await addNewUser(
			req.body.role,
			req.body.personContact,
			req.body.mobileNumber,
			req.body.email,
			req.body.businessName,
			req.body.streetAddress1,
			req.body.streetAddress2,
			req.body.city,
			req.body.state,
			req.body.country,
			req.body.pincode,
			hashPassword,
			req.body.planID,
			Date.now()
		);
		req.body.products.forEach(async(productID: string) => {
			await addUserProducts(userID, productID)
		})
		
	}catch(e){
		res.status(500).send({
			error : errors.serverError,
			messages : messages.serverError
		});
	}

});

router.get('/emailAvailable',tokenAuthenticator(ROLE.ADMIN), async (req, res) => {
	try{
		if (!req.query.email) {
			return res.status(400).send({
				success: false,
				error: errors.wrongParameters,
				message: messages.wrongParameters
			});
		}

		if (!isEmailValid(req.query.email)) {
			return res.send({
				success: false,
				error: errors.invalidEmail,
				message: messages.invalidEmail
			});
		}
		const emailAvailable = await isEmailAvailable(req.query.email);
		if (!emailAvailable) {
			return res.send({
				success: false,
				error: errors.emailTaken,
				message: messages.emailTaken
			});
		}

		res.json({
			success: true
		});	
	}catch(e){
		res.status(500).send({
			error : errors.serverError,
			messages : messages.serverError
		});
	}
});

router.get('/mobileAvailable',tokenAuthenticator(ROLE.ADMIN), async (req, res) => {
	try{
		if (!req.query.mobile) {
			return res.status(400).send({
				success: false,
				error: errors.wrongParameters,
				message: messages.wrongParameters
			});
		}

		if (!isPhoneNumberValid(req.query.mobile)) {
			return res.send({
				success: false,
				error: errors.invalidPhoneNumber,
				message: messages.invalidPhoneNumber
			});
		}
		const mobileAvailable = await isMobileAvailable(req.query.mobile);
		if (!mobileAvailable) {
			return res.send({
				success: false,
				error: errors.mobileTaken,
				message: messages.mobileTaken
			});
		}

		res.json({
			success: true
		});
	}catch(e){
		res.status(500).send({
			error : errors.serverError,
			messages : messages.serverError
		});
	}
});

router.delete('/userDelete',tokenAuthenticator(ROLE.ADMIN), async(req, res)=>{
	try{
		if (!req.query.userId) {
			return res.status(400).send({
				success: false,
				error: errors.wrongParameters,
				message: messages.wrongParameters
			});
		}
		const admin = await isAdmin(req.query.userId);
		if(admin){
			return res.send({
				success: false,
				error: errors.unprivileged,
				message: messages.unprivileged
			});
		}

		res.send({
			success: true
		});
		await deleteUser(req.query.userId);
	}catch(e){
		res.status(500).send({
			error : errors.serverError,
			messages : messages.serverError
		});
	}
});

export default router;
