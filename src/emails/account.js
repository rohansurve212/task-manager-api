const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendWelcomeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'rohan.surve.signups@gmail.com',
        subject: 'Thanks for joining in!',
        text: `Welcome to the app, ${name}. Let me know how you get along with the app.`
    })
}

const sendGoodbyeEmail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'rohan.surve.signups@gmail.com',
        subject: 'Sorry to see you go!',
        text: `It's really sad to see you go, ${name}. Please let us know if there's anything we could change to make you come back.`
    })
}

module.exports = {
    sendWelcomeEmail,
    sendGoodbyeEmail
}