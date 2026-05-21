const express = require('express');
const { body } = require('express-validator');
const {
  getHouses, getHouse, createHouse, updateHouse, deleteHouse, vacateHouse,
} = require('../controllers/houseController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

router.use(protect);

router.get('/', getHouses);
router.get('/:id', getHouse);

router.post(
  '/',
  [
    body('area').notEmpty().withMessage('Area is required'),
    body('number').trim().notEmpty().withMessage('House number is required'),
    body('roomRent').isNumeric().withMessage('Room rent must be a number'),
  ],
  validate,
  createHouse
);

router.put('/:id', updateHouse);
router.delete('/:id', deleteHouse);
router.post('/:id/vacate', vacateHouse);

module.exports = router;
