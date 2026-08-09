import { Router } from 'express';
import {
  createException,
  getExceptions,
  getExceptionById,
  updateException,
  deleteException
} from '../controllers/exception.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateJWT);

router.post('/', createException);
router.get('/', getExceptions);
router.get('/:id', getExceptionById);
router.put('/:id', updateException);
router.delete('/:id', deleteException);

export default router;
