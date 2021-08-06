const express = require('express')
const router = new express.Router()
const mongoose = require('mongoose')
const Task = require('../models/task')
const auth = require('../middleware/auth')

// API call to create a new task
router.post('/tasks', auth, async (req, res) => {
    const task = new Task({
        ...req.body,
        owner: req.user._id
    })

    try {
        await task.save()
        res.status(201).send(task)
    } catch (e) {
        res.status(400).send(e)
    }
})

// API call to get a list of all tasks
// GET /tasks?completed=true
// GET /tasks?limit=2&skip=2
// GET /tasks?sortBy=completed:asc
router.get('/tasks', auth, async (req, res) => {
    let match = {}
    let sort = {}

    if (req.query.completed) {
        match.completed = req.query.completed === 'true'
    }

    if (req.query.sortBy) {
        const parts = req.query.sortBy.split(':')
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
    }

    try {
        await req.user.populate({
            path: 'tasks',
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate()
        res.status(200).send(req.user.tasks)
    } catch (e) {
        res.status(500).send(e)
    }
})

// API call to get a task by its id
router.get('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id

    try {
        const task = await Task.findOne({ _id, owner: req.user._id })

        if (!task) {
            return res.status(404).send()
        }

        res.status(200).send(task)
    } catch (e) {
        res.status(403).send(e)
    }
})

// API call to find a task by its id and then update that task
router.patch('/tasks/:id', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['description', 'completed']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidOperation) {
        return res.status(404).send({ "error": 'Invalid Updates!' })
    }
    try {
        const task = await Task.findOne({ _id: req.params.id, owner: req.user._id })

        if (!task) {
            return res.send(404).send()
        }

        updates.forEach((update) => task[update] = req.body[update])
        await task.save()

        res.status(200).send(task)
    } catch (e) {
        res.status(400).send(e)
    }
})

// API call to find a task by its id and then delete that task
router.delete('/tasks/:id', auth, async (req, res) => {
    
    try {
        const task = await Task.findOneAndDelete({ _id: req.params.id, owner: req.user._id })

        if (!task) {
            res.status(404).send()
        }

        res.status(200).send(task)
    } catch (e) {
        res.status(500).send(e)
    }
})

module.exports = router