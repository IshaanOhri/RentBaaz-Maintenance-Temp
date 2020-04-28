import * as createError from 'http-errors';
import * as express from 'express';
import { join } from 'path';
import { EOL } from 'os';
import { existsSync, mkdirpSync, appendFile } from 'fs-extra-promise';
import rfs from 'rotating-file-stream';
import * as compression from 'compression';
import * as helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import * as logger from 'morgan';
import * as favicon from 'serve-favicon';
import { messages, errors } from './config/errors';
import { JsonError } from './models/json-error';

import apiRouter from './routes/api.rentbaaz.com/index';
import assetsRouter from './routes/assets.rentbaaz.com/index';

const app = express();

// @if NODE_ENV != 'production'
app.locals.pretty = true;
app.use(logger('dev'));
app.set('json spaces', 4);
// @endif

/* @if NODE_ENV == 'production' **
const projectName = require('./package.json').name;
const logDirectory = join(process.env.HOME, '.logs', projectName);

app.use('/', compression());
//app.use(favicon(join(__dirname, 'public', 'favicon.ico')));

app.locals.pretty = false;

// ensure log directory exists
if (existsSync(logDirectory) === false) {
	mkdirpSync(logDirectory);
}

app.use(logger(logger.compile(':date, :method :url :status :response-time ms - :res[content-length], :remote-addr'), {
	stream: rfs(logFileNamer, {
		size: '200M',
		path: logDirectory,
		compress: true,
		immutable: true
	})
}));
app.set('json spaces', 0);
app.use(helmet());
/* @endif */

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(express.static(join(__dirname, 'public')));

app.use('/', (req, res, next) => {
	if (req.hostname === 'api.rentbaaz.com' || req.hostname === 'localhost') {
		apiRouter(req, res, next);
	} else if (req.hostname === 'assets.rentbaaz.com') {
		assetsRouter(req, res, next);
	}
});

// catch 404 and forward to error handler
app.use((_req, _res, next) => {
	next({
		status: 404,
		statusMessage: errors.notFound
	});
});

// error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
	
	if (err instanceof JsonError) {
		res.status(err.statusCode).json({
			success: false,
			error: err.error,
			message: messages[err.error]
		});
	} else {
		res.status(err.status || 500);
		res.json({
			success: false,
			error: err.statusMessage || errors.serverError,
			message: messages[err.statusMessage || errors.serverError]
		});
	}

	// @if NODE_ENV != 'production'
	if (err) {
		console.error(err);
	}
	// @endif
	/* @if NODE_ENV == 'production' **
	appendFile(join(logDirectory, 'error.log'), err.toString() + EOL + err.stack, err => {
		if (err) {
			console.error(err);
		}
	});
	/* @endif */

	next();
});

function logFileNamer(time: Date, index: number) {
	if (!time) {
		return 'access.log';
	}
	const year = time.getFullYear();
	const month = time.getMonth();
	const day = time.getDate();
	const hour = time.getHours();
	const minute = time.getMinutes();
	const seconds = time.getSeconds();

	if (index) {
		return `access - ${year}-${month + 1}-${day}, ${hour}:${minute}:${seconds}.${index}.log`;
	} else {
		return `access - ${year}-${month + 1}-${day}, ${hour}:${minute}:${seconds}.log`;
	}
}

export default app;
