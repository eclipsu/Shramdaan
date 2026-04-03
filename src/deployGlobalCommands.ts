/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { REST } from '@discordjs/rest'
import { RESTPostAPIApplicationCommandsJSONBody, Routes } from 'discord.js'
import { readdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath, pathToFileURL } from 'url'
import type ApplicationCommand from './templates/ApplicationCommand.js'

const { TOKEN, CLIENT_ID } = process.env
const __dirname = dirname(fileURLToPath(import.meta.url))

export default async function deployGlobalCommands() {
    const commands: RESTPostAPIApplicationCommandsJSONBody[] = []
    const commandFiles: string[] = readdirSync(
        resolve(__dirname, 'commands')
    ).filter((file) => file.endsWith('.js'))

    for (const file of commandFiles) {
        const filePath = pathToFileURL(
            resolve(__dirname, 'commands', file)
        ).href
        const module = await import(filePath)
        const command = module.default as ApplicationCommand

        if (!command?.data) {
            console.warn(`Skipping ${file} — no default export with data`)
            continue
        }

        const commandData = command.data.toJSON()
        commands.push(commandData)
    }

    const rest = new REST({ version: '10' }).setToken(TOKEN as string)

    try {
        console.log('Started refreshing application (/) commands.')

        await rest.put(Routes.applicationCommands(CLIENT_ID as string), {
            body: commands
        })

        console.log('Successfully reloaded application (/) commands.')
    } catch (error) {
        console.error(error)
    }
}
