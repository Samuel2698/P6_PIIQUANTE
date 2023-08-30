const express = require('express')
const saucesRouter = express.Router()
const { upload } = require('../middleware/multer')
const { authenticateUser } = require('../middleware/auth')
const {
  getSauces,
  getSaucesById,
  createSauces,
  deleteSauces,
  modifySauces,
  likeSauces
} = require('../controllers/sauces')

saucesRouter.get('/', authenticateUser, getSauces)
saucesRouter.post('/', authenticateUser, upload.single('image'), createSauces)
saucesRouter.get('/:id', authenticateUser, getSaucesById)
saucesRouter.delete('/:id', authenticateUser, deleteSauces)
saucesRouter.put('/:id', authenticateUser, upload.single('image'), modifySauces)
saucesRouter.post('/:id/like', authenticateUser, likeSauces)

module.exports = { saucesRouter }
