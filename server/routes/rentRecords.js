const express = require('express');
const { body } = require('express-validator');
const {
  getRecords,
  getRecord,
  createRecord,
  updateRecord,
  deleteRecord,
  addPayment,
  deletePayment,
  getDashboardStats,
} = require('../controllers/rentRecordController');
const { protect }  = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();
router.use(protect);

router.get('/dashboard', getDashboardStats);
router.get('/',          getRecords);
router.get('/:id',       getRecord);

router.post(
  '/',
  [
    body('houseId').notEmpty().withMessage('House is required'),
    body('month').matches(/^\d{4}-\d{2}$/).withMessage('Month must be YYYY-MM'),
    body('currReading')
      .optional({ nullable: true })
      .isNumeric()
      .withMessage('Current reading must be a number'),
  ],
  validate,
  createRecord
);

router.put('/:id', updateRecord);
router.delete('/:id', deleteRecord);

// Payment transactions on a rent record
router.post(
  '/:id/payments',
  [
    body('amount').isNumeric({ min: 0.01 }).withMessage('Amount must be a positive number'),
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be a positive number'),
  ],
  validate,
  addPayment
);
router.delete('/:id/payments/:txnId', deletePayment);

module.exports = router;
