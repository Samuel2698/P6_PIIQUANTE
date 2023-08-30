const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')

const password = process.env.DB_PASSWORD
const username = process.env.DB_USER
const uri = `mongodb+srv://${username}:${password}@cluster0.mjiiere.mongodb.net/?retryWrites=true&w=majority`

mongoose
  .connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connection to MongoDB successful !')
  })
  .catch((err) => console.log('Connection to MongoDB failed !', err))

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
})
userSchema.plugin(uniqueValidator)

const User = mongoose.model('User', userSchema)

module.exports = { mongoose, User }
