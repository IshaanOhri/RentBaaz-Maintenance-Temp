export const port = '3000';
export const basePath = '/';
export const passwordSaltRounds = 8;
export const jwtSecret = 'press1for*88';

export const s3 = {
	endpoint: '',
	region: '',
	bucket: '',
	key: '',
	secret: ''
};

export const razorpay = {
	keyId: '',
	keySecret: ''
};

export const mysql = {
	host: 'localhost',
	port: 3306,
	user: 'akshit',
	password: '123456',
	database: 'rentbaaz_maintainence',
	connectionLimit: 10
};

export const mongodb = {
	host: '',
	port: 27017,
	database: 'rentbaaz_api'
};

export const email = {
	host: 'smtp.example.com',
	port: 587,
	secure: true,
	username: 'no-reply@example.com',
	from: 'Notification <no-reply@example.com>',
	password: 'password'
};
