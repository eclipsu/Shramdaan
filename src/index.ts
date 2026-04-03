import 'dotenv/config'
import 'reflect-metadata'

/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Client, GatewayIntentBits, Collection, Partials } from 'discord.js'
import { readdirSync } from 'fs'
import { resolve } from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import type ApplicationCommand from './templates/ApplicationCommand.js'
import type Event from './templates/Event.js'
import type MessageCommand from './templates/MessageCommand.js'
import { AppDataSource } from './database.js'
import deployGlobalCommands from './deployGlobalCommands.js'
// import { startScheduler } from './scheduler.js'

const { TOKEN } = process.env
const __dirname = fileURLToPath(new URL('.', import.meta.url))

await AppDataSource.initialize()
    .then(() => console.log('Database connected'))
    .catch((err) => {
        console.error('Database connection failed:', err)
        process.exit(1)
    })

await deployGlobalCommands()

global.client = Object.assign(
    new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.DirectMessages,
            GatewayIntentBits.MessageContent,
            GatewayIntentBits.GuildMessageReactions
        ],
        partials: [Partials.Channel, Partials.Message, Partials.Reaction]
    }),
    {
        commands: new Collection<string, ApplicationCommand>(),
        msgCommands: new Collection<string, MessageCommand>()
    }
)

// load slash commands — skip files with no default export
const commandFiles = readdirSync(resolve(__dirname, 'commands')).filter((f) =>
    f.endsWith('.js')
)
for (const file of commandFiles) {
    const filePath = pathToFileURL(resolve(__dirname, 'commands', file)).href
    const mod = await import(filePath)
    const command = mod.default as ApplicationCommand
    if (!command?.data) {
        console.warn(`Skipping ${file} — no default export`)
        continue
    }
    client.commands.set(command.data.name, command)
}

// load message commands
const msgCommandFiles = readdirSync(
    resolve(__dirname, 'messageCommands')
).filter((f) => f.endsWith('.js'))
for (const file of msgCommandFiles) {
    const filePath = pathToFileURL(
        resolve(__dirname, 'messageCommands', file)
    ).href
    const mod = await import(filePath)
    const command = mod.default as MessageCommand
    if (!command?.name) continue
    client.msgCommands.set(command.name, command)
}

// load events
const eventFiles = readdirSync(resolve(__dirname, 'events')).filter((f) =>
    f.endsWith('.js')
)
for (const file of eventFiles) {
    const filePath = pathToFileURL(resolve(__dirname, 'events', file)).href
    const mod = await import(filePath)
    const event = mod.default as Event
    if (!event?.name) continue
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args))
    } else {
        client.on(event.name, (...args) => event.execute(...args))
    }
}

await client.login(TOKEN)

client.once('ready', () => {
    // startScheduler()
})
