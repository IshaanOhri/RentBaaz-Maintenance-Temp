const {verify} = require('jsonwebtoken');
import { Request, Response, NextFunction } from 'express';
import { jwtSecret } from '../../config/config';
import { errors, messages } from '../../config/errors';
import {getUserByID} from '../../models/database-modules/auth';

export function tokenAuthenticator(role: string) {

	const expressMiddleware = async (req: Request, res: Response, next: NextFunction) => {
		try {
			const token = req.header('Authorization').replace('Bearer ', '');
			const decoded = verify(token, jwtSecret);

			const user = await getUserByID(decoded.userID);
			if(!user){
				throw new Error();
			}

			if(role === '*'){
				req.user = user;
				next();
				return;
			}

			if(role === user.role){
				req.user = user;
				next();
				return;
			}

			throw new Error();
			
		} catch (e) {
			res.status(401).send({
				error : errors.unauthorized,
				message : messages.unauthorized
			});
		}
	};
	return expressMiddleware;
}

