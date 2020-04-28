import { Router } from 'express';

import auth from './auth';
import complaint from './complaint';
import misc from './misc-routes';
import plan from './plan';
import profile from './profile';
import product from './product';


const router = Router();

router.use('/auth', auth);
router.use('/complaint', complaint);
router.use('/admin',misc);
router.use('/plan', plan);
router.use('/profile', profile);
router.use('/product', product);


export default router;
