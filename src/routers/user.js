const express = require('express')
const router = new express.Router()
const User = require('../models/user')
const auth = require('../middleware/auth')
const multer = require('multer')
const sharp = require('sharp')
const { sendWelcomeEmail, sendGoodbyeEmail } = require('../emails/account')

// [ALL USERS] API call to create a new user
router.post('/users', async (req, res) => {
    const user = new User(req.body)
    
    try {
        await user.save()
        sendWelcomeEmail(user.email, user.name)
        const token = await user.generateAuthToken()
        res.status(201).send({ user, token })
    } catch (e) {
        res.status(400).send(e)
    }
})

// [ALL USERS] API call to login a user by its credentials
router.post('/users/login', async (req, res) => {

    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        res.status(200).send({ user, token })
    } catch (e) {
        res.status(400).send(e)
    }
})

// [ALL USERS] API call to logout a user
router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token != req.token
        })
        await req.user.save()
        res.status(200).send()
    } catch(e) {
        res.status(500).send()
    }
})

// [ALL USERS] API call to logout all user sessions
router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = []
        await req.user.save()
        res.status(200).send()
    } catch (e) {
        res.status(500).send()
    }
})

// [ALL USERS] API call to read the user profile
router.get('/users/me', auth, async (req, res) => {

    try {
        res.status(200).send(req.user)
    } catch (e) {
        res.status(500).send(e) 
    }
})

// [ALL USERS] API call to authenticate a user and then update that user
router.patch('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ["name", "email", "age", "password"]
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidOperation) {
        return res.status(400).send({ "error": 'Invalid Updates!' })
    }
    try {
        const user = req.user

        updates.forEach((update) => user[update] = req.body[update])
        await user.save()

        res.status(200).send(user)
    } catch (e) {
        res.status(400).send(e)
    }
})

// [ALL USERS] API call to authenticate a user and then delete that user
router.delete('/users/me', auth, async (req, res) => {
    const user = req.user

    try {
        await user.remove()
        sendGoodbyeEmail(user.email, user.name)
        res.status(200).send(user)
    } catch (e) {
        res.status(500).send(e)
    }
})

// [ALL USERS] API call to upload profile picture
const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            cb(new Error('Please upload an Image file of either jpg, jpeg or png type.'))
        }

        cb(undefined, true)
    }
})

router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({ width:250, height: 250 }).png().toBuffer()
    req.user.avatar = buffer
    await req.user.save()
    res.send("Avatar uploaded successfully")
}, (error, req, res, next) => {
    res.status(400).send({ error: error.message })
})

// [ALL USERS] API call to delete profile picture
router.delete('/users/me/avatar', auth, async (req, res) => { 
    try{
        req.user.avatar = undefined
        await req.user.save()
        res.status(200).send("Avatar deleted successfully")
    } catch(e) {
        res.status(500).send(e)
    }
})

// [API USERS] API call to get a profile picture
router.get('/users/:id/avatar', async (req, res) => {
    try {
        const user = await User.findById(req.params.id)

        if (!user || !user.avatar) {
            throw new Error()
        }

        res.set('Content-Type', 'image/png')
        res.send(user.avatar)
    } catch (e) {
        res.status(404).send(e)
    }
})

// [ADMINISTRATORS ONLY] API call for admin to get a list of all users
router.get('/users', auth, async (req, res, next) => {
    try {
        if (req.user.email === "administrator@jedi.com") {
            const users = await User.find({})
            res.status(200).send(users)
        } else {
            res.status(403).send()
            next()
        }
    } catch (e) {
        res.status(500).send(e)
        next()
    }
})

// [ADMINISTRATORS ONLY] API call for admin to get a user by its id
router.get('/users/:id', auth, async (req, res, next) => {

    try {
        if (req.user.email === "administrator@jedi.com") {
            const user = await User.findById(req.params.id)
            if (!user) {
                return res.status(404).send()
            }
            res.status(200).send(user)
        } else {
            res.status(403).send()
            next()
        }
    } catch (e) {
        res.status(403).send(e)
        next()
    }
})

// [ADMINISTRATORS ONLY] API call for admin to find a user by its id and then delete that user
router.delete('/users/:id', auth, async (req, res, next) => {
    
    try {
        if (req.user.email === "administrator@jedi.com") {
            const user = await User.findById(req.params.id)
            await user.remove()

            if (!user) {
                res.status(404).send()
            }
            res.status(200).send(user)
        } else {
            res.status(403).send()
            next()
        }
    } catch (e) {
        res.status(500).send(e)
        next()
    }
})

module.exports = router