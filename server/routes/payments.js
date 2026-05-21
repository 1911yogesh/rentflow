const express = require('express');
const { body } = require('express-validator');
const {
  getPayments, getPayment, createPayment, deletePayment, getDashboard,
} = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

router.use(protect);

router.get('/dashboard', getDashboard);
router.get('/', getPayments);
router.get('/:id', getPayment);

router.post(
  '/',
  [
    body('houseId').notEmpty().withMessage('House is required'),
    body('month').matches(/^\d{4}-\d{2}$/).withMessage('Month must be YYYY-MM format'),
    body('currReading').isNumeric().withMessage('Current reading must be a number'),
    body('paid').isNumeric().withMessage('Paid amount must be a number'),
  ],
  validate,
  createPayment
);

router.delete('/:id', deletePayment);

module.exports = router;
