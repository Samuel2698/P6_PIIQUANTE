const mongoose = require('mongoose')
const unlink = require('fs').promises.unlink

const productSchema = new mongoose.Schema({
  userId: String,
  name: String,
  manufacturer: String,
  description: String,
  mainPepper: String,
  imageUrl: String,
  heat: Number,
  likes: Number,
  dislikes: Number,
  usersLiked: [String],
  usersDisliked: [String]
})

const Product = mongoose.model('Product', productSchema)

function getSauces(req, res) {
  Product.find({})
    .then((products) => res.send(products))
    .catch((error) => res.status(500).send(error))
}

function getSauce(req, res) {
  const { id } = req.params
  return Product.findById(id)
}

function getSaucesById(req, res) {
  const { id } = req.params
  Product.findById(id)
    .then((product) => res.send(product))
    .catch(console.error)
}

function deleteSauces(req, res) {
  const { id } = req.params
  Product.findByIdAndDelete(id)
    .then((item) => deleteImage(item))
    .then((product) => sendClientResponse(product, res))
    .catch((err) => res.status(500).send({ message: err }))
}

async function deleteImage(product) {
  const { imageUrl } = product
  const fileToDelete = imageUrl.split('/').at(-1)

  try {
    await unlink(`images/${fileToDelete}`)
    return product
  } catch (error) {
    console.error('Error deleting image:', error)
    throw error
  }
}

function modifySauces(req, res) {
  const {
    params: { id }
  } = req

  const hasNewImage = req.file != null
  const payload = makePayload(hasNewImage, req)

  Product.findById(id)
    .then((product) => {
      if (!product) {
        return res.status(404).send({ message: 'Product not found' })
      }

      if (hasNewImage) {
        payload.imageUrl = makeImageUrl(req, req.file.fileName)
      } else {
        payload.imageUrl = product.imageUrl
      }

      return Product.findByIdAndUpdate(id, payload)
    })
    .then((dbResponse) => sendClientResponse(dbResponse, res))
    .then((product) => {
      if (hasNewImage) {
        return deleteImage(product)
      } else {
        return product
      }
    })
    .catch((err) => console.error('Problem', err))
}

function makePayload(hasNewImage, req) {
  if (!hasNewImage) return req.body
  const payload = JSON.parse(req.body.sauce)
  payload.imageUrl = makeImageUrl(req, req.file.fileName)
  return payload
}

function sendClientResponse(product, res) {
  if (product == null) {
    console.log('Nothing to update')
    return res.status(400).send({ message: 'Object not found in database' })
  }
  console.log('All good updating:', product)
  return Promise.resolve(
    res.status(200).send({ message: 'Successfully updated' })
  ).then(() => product)
}

function makeImageUrl(req, fileName) {
  return req.protocol + '://' + req.get('host') + '/images/' + fileName
}

function createSauces(req, res) {
  const { body, file } = req
  const { fileName } = file
  const sauce = JSON.parse(body.sauce)
  const { name, manufacturer, description, mainPepper, heat, userId } = sauce

  const product = new Product({
    userId: userId,
    name: name,
    manufacturer: manufacturer,
    description: description,
    mainPepper: mainPepper,
    imageUrl: makeImageUrl(req, fileName),
    heat,
    likes: 0,
    dislikes: 0,
    usersLiked: [],
    usersDisliked: []
  })
  product
    .save()
    .then((message) => {
      res.status(201).send({ message: message })
    })
    .catch(console.error)
}

function likeSauces(req, res) {
  const { like, userId } = req.body
  if (![1, -1, 0].includes(like)) {
    return res.status(403).send({ message: 'Invalid like value' })
  }

  getSauce(req, res)
    .then((product) => updateVote(product, like, userId))
    .then((product) => product.save())
    .then((product) => sendClientResponse(product, res))
    .catch((err) => res.status(500).send(err))
}

function updateVote(product, like, userId) {
  if (like === 1 || like === -1) {
    return incrementVote(product, userId, like)
  } else {
    return resetVote(product, userId)
  }
}

function resetVote(product, userId) {
  const { usersLiked, usersDisliked } = product
  const userLiked = usersLiked.includes(userId)
  const userDisliked = usersDisliked.includes(userId)

  if (userLiked && userDisliked) {
    return Promise.reject('User seems to have voted both ways')
  }

  if (!userLiked && !userDisliked) {
    return Promise.reject('User has not voted')
  }

  if (userLiked) {
    product.likes--
    product.usersLiked = product.usersLiked.filter((id) => id !== userId)
  } else {
    product.dislikes--
    product.usersDisliked = product.usersDisliked.filter((id) => id !== userId)
  }

  return product
}

function incrementVote(product, userId, like) {
  const { usersLiked, usersDisliked } = product
  const votersArray = like === 1 ? usersLiked : usersDisliked

  if (!votersArray.includes(userId)) {
    votersArray.push(userId)
    like === 1 ? product.likes++ : product.dislikes++
  }

  return product
}

// Product.deleteMany({}).then(() => console.log('All sauces removed').catch(console.error))
module.exports = {
  getSauces,
  getSaucesById,
  createSauces,
  deleteSauces,
  modifySauces,
  likeSauces
}
