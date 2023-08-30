const jwt = require('jsonwebtoken')

function authenticateUser(req, res, next) {
  const header = req.header('Authorization')
  if (header == null) return

  const token = header.split(' ')[1]
  if (token == null)
    return res.status(403).send({ message: 'The token cannot be null' })

  jwt.verify(token, process.env.JWT_PASSWORD, (err, decoded) => {
    if (err) return res.status(403).send({ message: 'Token invalid', err })
    next()
  })
}

module.exports = { authenticateUser }
