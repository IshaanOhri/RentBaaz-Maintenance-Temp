import * as mysql from 'promise-mysql';
import { mysql as mysqlConfig } from '../config/config';

export let pool = mysql.createPool(mysqlConfig);

export * from './database-modules/auth';
export * from './database-modules/file';
export * from './database-modules/complaint';
export * from './database-modules/misc-routes';
export * from './database-modules/plan';
export * from './database-modules/product';
export * from './database-modules/profile';

