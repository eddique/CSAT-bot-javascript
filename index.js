require('dotenv').config()
const colors = require('colors')
const express = require('express')
const app = express()

const JiraApi = require('jira-client')
const { WebClient } = require('@slack/web-api') 

const path = require('path')

const port = process.env.PORT || 5000

var closedCounter = 0
const interval = process.env.INTERVAL || 2

const jira = new JiraApi({
    protocol: 'https',
    host: process.env.JIRA_HOST,
    username: process.env.JIRA_USERNAME,
    password: process.env.JIRA_PASSWORD,
    apiVersion: '2',
    strictSSL: true
})

const client = new WebClient(process.env.SLACK_BOT_TOKEN, {

})

app.use(express.json({ type: '*/*' }))
app.use(express.static(__dirname))

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/index.html'));
})

app.post('/reaction', async (req, res) => {
    res.status(200)
})

app.post('/jira-comment', async (req, res) => {
    res.status(200)
})

// webhook for jira updates
app.post('/jira-update', async (req, res) => {
    res.status(200)
    
    if(req.body.changelog.items[0].toString() === 'Done'){
        closedCounter += 1
        
        if (closedCounter % interval === 0) {
            // get jira user
            user = await jira.getUser(req.body.issue.fields.reporter.accountId)

            // get user slack id
            slackUser = await client.users.lookupByEmail({email: user.emailAddress})

            // set channelId to user DM channel
            const channelId = `@${slackUser.user.id}`

            try {
                const result = await client.chat.postMessage({
                    channel: channelId,
                    blocks: blocks
                })
            } catch (error) {
                console.error(error)
            }
        }
    }
})

app.post('/button', async (req, res) => {
    res.sendStatus(200)
    
    const payload = JSON.parse(req.body.payload)
    
    if (payload.actions[0].action_id === "csat_submit") {
        // parse rating values
        const radio = Object.values(payload.state.values)[1]
        
        const rating = Object.values(radio)[0].selected_option.value

        // get rating values
        const text = Object.values(payload.state.values)[1]
        
        const comments = Object.values(text)[0].value

        // values here, decide what to do with them
        console.log({rating, comments})

        // update message
        await client.update({
            channel: payload.container.channel_id,
            ts: payload.message.ts,
            blocks: blocks2
        })
        // if user cancelled
    }   else if (payload.actions[0].action_id === "csat_cancel") {
        // update message
        await client.chat.update({
            channel: payload.container.channel_id,
            ts: payload.message.ts,
            blocks: blocks3
        })
    }

})

app.listen(port, () => {
    console.log(`Listening on http://localhost:${port}`.cyan)
})
