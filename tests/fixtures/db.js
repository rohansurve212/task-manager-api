const mongoose = require('mongoose')
const jwt = require('jsonwebtoken')
const User = require('../../src/models/user')
const Task = require('../../src/models/task')

const userOneId = new mongoose.Types.ObjectId()
const userOne = {
    _id: userOneId,
    name: 'Test user 1',
    email: 'testuser1@example.com',
    password: '23Efder!@',
    tokens: [{
        token: jwt.sign({ _id: userOneId.toString() }, process.env.JWT_SECRET)
    }]
}

const userTwoId = new mongoose.Types.ObjectId()
const userTwo = {
    _id: userTwoId,
    name: 'User Two',
    email: 'user2@example.com',
    password: '56ghyuw!@',
    tokens: [{
        token: jwt.sign({ _id: userTwoId.toString() }, process.env.JWT_SECRET)
    }]
}

const taskOne = {
    _id: new mongoose.Types.ObjectId(),
    description: 'First task for the day',
    completed: false,
    owner: userOneId
}

const taskTwo = {
    _id: new mongoose.Types.ObjectId(),
    description: 'Last task for the day',
    completed: false,
    owner: userTwoId
}

const taskThree = {
    _id: new mongoose.Types.ObjectId(),
    description: 'Sleep before 2am',
    completed: false,
    owner: userTwoId
}

const setupDatabase = async () => {
    await User.deleteMany()
    await Task.deleteMany()
    await new User(userOne).save()
    await new User(userTwo).save()
    await new Task(taskOne).save()
    await new Task(taskTwo).save()
    await new Task(taskThree).save()
}

module.exports = {
    userOneId,
    userOne,
    userTwo,
    taskOne,
    taskTwo,
    taskThree,
    setupDatabase
}