const express = require('express');
const { body } = require('express-validator');
const { getAreas, createArea, updateArea, deleteArea } = require('../controllers/areaController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

router.use(protect);

router.get('/', getAreas);

router.post(
  '/',
  [body('name').trim().notEmpty().withMessage('Area name is required')],
  validate,
  createArea
);

router.put(
  '/:id',
  [body('name').trim().notEmpty().withMessage('Area name is required')],
  validate,
  updateArea
);

router.delete('/:id', deleteArea);

module.exports = router;
