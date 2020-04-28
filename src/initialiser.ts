import { pool } from './models/database';
import { setDatabaseVersion, getDatabaseMajorVersion, getDatabaseMinorVersion, getDatabaseIncrementVersion } from './models/database-modules/misc';

export const DatabaseVersion = {
	major: 1,
	minor: 0,
	increment: 0
};

export async function initialize() {
	console.log('Initialising database');
	const rows = await pool.query('SHOW TABLES;');

	if (rows.length === 0) {
		console.log('No tables exist. Creating fresh');
		// Create all tables
		await initialiseMeta();
		await initializeFiles();
		await initializeUserAccounts();
		await initializeComplaint();
		await initializePlans();
		await initializeProduct();

		// Set the database schema version
		await setDatabaseVersion(DatabaseVersion.major, DatabaseVersion.minor, DatabaseVersion.increment);
		console.log('Database created fresh');
		return;
	}

	console.log('Tables already exist. Performing a migration');
	console.log('meta_data table exist. Getting current version');
	// If it already exists, perform a migration with the known version
	const majorVersion = await getDatabaseMajorVersion();
	const minorVersion = await getDatabaseMinorVersion();
	const incrementVersion = await getDatabaseIncrementVersion();

	console.log(`Migrating from ${majorVersion}.${minorVersion}.${incrementVersion}`);
	await migrateDatabase(majorVersion, minorVersion, incrementVersion);
}

// tslint:disable: no-switch-case-fall-through
async function migrateDatabase(majorVersion: number, minorVersion: number, increment: number) {
	// Intentional fall through
	switch (`${majorVersion}.${minorVersion}.${increment}`) {
		case '1.0.0':
			break;
	}
	await setDatabaseVersion(DatabaseVersion.major, DatabaseVersion.minor, DatabaseVersion.increment);
}
// tslint:enable: no-switch-case-fall-through

async function initialiseMeta() {
	await pool.query(
		`
		CREATE TABLE IF NOT EXISTS meta_data (
			metaId VARCHAR(100) PRIMARY KEY,
			value TEXT
		);
		`
	);
}

async function initializeUserAccounts() {
	await pool.query(
		`
		CREATE TABLE IF NOT EXISTS user(
			userID VARCHAR(10) PRIMARY KEY,
			role VARCHAR(10) DEFAULT 'user',
			personContact VARCHAR(180) NOT NULL,
			mobileNumber VARCHAR(15) UNIQUE NOT NULL,
			email VARCHAR(180) UNIQUE NOT NULL,
			businessName VARCHAR(180),
			streetAddress1 VARCHAR(180),
			streetAddress2 VARCHAR(180),
			city VARCHAR(80),
			state VARCHAR(80),
			country VARCHAR(80),
			pincode VARCHAR(10),
			password VARCHAR(180),
			planID VARCHAR(10),
			created BIGINT
		);
		`
	);

	await pool.query(
		`
		CREATE TABLE IF NOT EXISTS userProducts(
			userID VARCHAR(10),
			productID VARCHAR(10),
			FOREIGN KEY (userID) REFERENCES user(userID) ON DELETE CASCADE
		);
		`
	);

	await pool.query(
		`
		CREATE TABLE IF NOT EXISTS login(
			refreshToken VARCHAR(36),
			userID VARCHAR(10) PRIMARY KEY,
			expiry BIGINT
		);
		`
	);
}

async function initializeComplaint() {
	await pool.query(
		`
		CREATE TABLE IF NOT EXISTS complaint(
			complaintID INT(10) PRIMARY KEY,
			userID VARCHAR(10),
			productID VARCHAR(10),
			faults VARCHAR(180),
			probDesc VARCHAR(180),
			dateOfComplaint BIGINT,
			dateOfMaintenance BIGINT,
			status BOOL DEFAULT 0,
			cost INT DEFAULT 0,
			FOREIGN KEY (userID) REFERENCES user(userID)
		);
		`
	);				
}

async function initializePlans() {
	await pool.query(
		`
		CREATE TABLE IF NOT EXISTS plans(
			planID VARCHAR(10) PRIMARY KEY,
			cost INT,
			planName VARCHAR(180),
			description VARCHAR(180)
		);
		`
	);

	await pool.query(
		`
		CREATE TABLE IF NOT EXISTS planProducts(
			planID VARCHAR(10),
			productName VARCHAR(180),
			FOREIGN KEY (planID) REFERENCES plans(planID) ON DELETE CASCADE
		);
		`
	);
}

async function initializeProduct() {
	await pool.query(
		`
		CREATE TABLE IF NOT EXISTS product(
			productID VARCHAR(10) PRIMARY KEY,
			productName VARCHAR(180),
			productModel VARCHAR(180)
		);
		`
	);

	await pool.query(
		`
		CREATE TABLE IF NOT EXISTS productFaults(
			productID VARCHAR(10),
			fault VARCHAR(80),
			FOREIGN KEY (productID) REFERENCES product(productID) ON DELETE CASCADE
		);
		`
	);
}
	
async function initializeFiles() {
	await pool.query(
		`
		CREATE TABLE IF NOT EXISTS files (
			fileId VARCHAR(36) PRIMARY KEY,
			contentType VARCHAR(100),
			fileName VARCHAR(150),
			created BIGINT,
			hash VARCHAR(128),
			size BIGINT
		);
		`
	);

	await pool.query(
		`
		CREATE TABLE IF NOT EXISTS access_groups (
			groupId VARCHAR(100) PRIMARY KEY
		);
		`
	);

	await pool.query(
		`
		CREATE TABLE IF NOT EXISTS file_acl_groups (
			fileId VARCHAR(36),
			groupId VARCHAR(100),
			permission VARCHAR(20),
			PRIMARY KEY(fileId, groupId),
			FOREIGN KEY(fileId) REFERENCES files(fileId),
			FOREIGN KEY(groupId) REFERENCES access_groups(groupId)
		);
		`
	);
}
