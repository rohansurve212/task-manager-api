const request = require('supertest')
const app = require('../src/app')
const Task = require('../src/models/task')
const { 
    userOneId, 
    userOne, 
    userTwo, 
    taskOne, 
    taskTwo, 
    taskThree, 
    setupDatabase 
} = require('./fixtures/db')

beforeEach(setupDatabase)

test('Should create task for user', async () => {
    const response = await request(app)
        .post('/tasks')
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            description: 'From my test' 
        })
        .expect(201)

    const task = await Task.findById(response.body._id)
    expect(task).not.toBeNull()
    expect(task.description).toBe('From my test')
    expect(task.completed).toBe(false)
})

test('Fetch all tasks for a particular user', async() => {
    const response = await request(app)
        .get('/tasks')
        .set('Authorization', `Bearer ${userTwo.tokens[0].token}`)
        .send()
        .expect(200)

    expect(response.body.length).toBe(2)
})

test("Attempt to delete another user's task", async () => {
    const response = await request(app)
        .delete(`/tasks/${taskOne._id}`)
        .set('Authorization', `Bearer ${userTwo.tokens[0].token}`)
        .send()
        .expect(404)

    const task = await Task.findById(taskOne._id)
    expect(task).not.toBeNull()
})

test('Should delete a user task', async () => {
    const response = await request(app)
        .delete(`/tasks/${taskThree._id}`)
        .set('Authorization', `Bearer ${userTwo.tokens[0].token}`)
        .send()
        .expect(200)

    const task = await Task.findById(taskThree._id)
    expect(task).toBeNull()
})

test("Should not update another user's task", async () => {
    const response = await request(app)
        .patch(`/tasks/${taskThree._id}`)
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send({
            completed: true
        })
        .expect(404)

    const task = await Task.findById(taskThree._id)
    expect(task.completed).toBe(false)
})

test("Fetch a task by it's id", async () => {
    await request(app)
        .get(`/tasks/${taskOne._id}`)
        .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
        .send()
        .expect(200)
})

test("Should not fetch another user's task by it's id", async () => {
    await request(app)
        .get(`/tasks/${taskOne._id}`)
        .set('Authorization', `Bearer ${userTwo.tokens[0].token}`)
        .send()
        .expect(404)
})

test("Should not fetch user task if unauthenticated", async () => {
    await request(app)
        .get(`/tasks/${taskOne._id}`)
        .send()
        .expect(401)
})