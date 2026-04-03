// import cron from 'node-cron'
// import {
//     todayInstancesExist,
//     createTodayInstances,
//     markOverdueInstances,
//     getTodayInstances,
//     setAreaMessageId
// } from './repositories/ChoreInstanceRepository.js'
// import { EmbedBuilder } from 'discord.js'
// import { createRequire } from 'module'
// import { fileURLToPath } from 'url'
// import { resolve, dirname } from 'path'

// const __dirname = dirname(fileURLToPath(import.meta.url))
// const require = createRequire(import.meta.url)
// const config = require(resolve(__dirname, 'config.json')) as {
//     roles: Record<string, string>
//     choreChannels: Record<string, string>
//     dailyChoresChannelId: string
// }

// const { DEFAULT_GUILD_ID } = process.env as { DEFAULT_GUILD_ID: string }

// type AreaType = 'Kitchen' | 'Hall/Living Room' | 'Washroom' | 'Misc'
// const AREAS: AreaType[] = ['Kitchen', 'Hall/Living Room', 'Washroom', 'Misc']

// const areaEmoji: Record<string, string> = {
//     Kitchen: '🍳',
//     'Hall/Living Room': '🛋️',
//     Washroom: '🚿',
//     Misc: '📋'
// }

// const areaColor: Record<string, number> = {
//     Kitchen: 0xe67e22,
//     'Hall/Living Room': 0x3498db,
//     Washroom: 0x1abc9c,
//     Misc: 0x95a5a6
// }

// const numberEmojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣']

// function statusLine(status: string): string {
//     if (status === 'completed') return '✅'
//     if (status === 'overdue') return '🔴'
//     return '⏳'
// }

// export async function postAreaEmbed(area: AreaType): Promise<void> {
//     const guild = client.guilds.cache.get(DEFAULT_GUILD_ID)
//     if (!guild) return

//     const channelId =
//         config.choreChannels?.[area] ?? config.dailyChoresChannelId
//     const channel = guild.channels.cache.get(channelId)
//     if (!channel?.isTextBased()) return

//     const instances = await getTodayInstances(area)
//     if (instances.length === 0) return

//     const roleId = config.roles?.[area]

//     const lines = instances.map((inst, i) => {
//         const emoji = statusLine(inst.status)
//         return `**${i + 1}.** ${emoji} **${inst.chore.name}**\n　　_${
//             inst.chore.basePoints
//         } pts · Due <t:${Math.floor(inst.dueBy.getTime() / 1000)}:t>_`
//     })

//     const embed = new EmbedBuilder()
//         .setTitle(`${areaEmoji[area]} ${area}`)
//         .setColor(areaColor[area] ?? 0x5865f2)
//         .setDescription(
//             [
//                 roleId
//                     ? `> 👤 Incharge: <@&${roleId}>`
//                     : '> 👤 No incharge assigned',
//                 `> 📅 <t:${Math.floor(Date.now() / 1000)}:D>`,
//                 '',
//                 '**Chores**',
//                 ...lines,
//                 '',
//                 '─────────────────────',
//                 '_React with the number to mark complete_',
//                 `_Incharge +X pts · Others +2X pts_`
//             ].join('\n')
//         )
//         .setTimestamp()

//     const message = await channel.send({ embeds: [embed] })

//     for (let i = 0; i < Math.min(instances.length, 9); i++) {
//         await message.react(numberEmojis[i])
//     }

//     await setAreaMessageId(area, message.id, channel.id)
// }

// export async function postAllAreaEmbeds(): Promise<void> {
//     console.log("Hii, I'm posting all area embeds...")
//     for (const area of AREAS) {
//         await postAreaEmbed(area)
//     }
// }

// export function startScheduler(): void {
//     // run on startup — create today's instances if not yet done
//     const createDaily = async () => {
//         try {
//             const exists = await todayInstancesExist()
//             if (!exists) {
//                 await createTodayInstances()
//                 console.log('Created chore instances for today')
//                 await postAllAreaEmbeds()
//             }
//         } catch (err) {
//             console.error('Scheduler error (daily create):', err)
//         }
//     }

//     void createDaily()

//     // every hour — check if new day and create instances
//     cron.schedule('0 * * * *', createDaily)

//     // every hour — check overdue
//     cron.schedule('0 * * * *', async () => {
//         try {
//             const overdueInstances = await markOverdueInstances()
//             if (overdueInstances.length === 0) return

//             const guild = client.guilds.cache.get(DEFAULT_GUILD_ID)
//             if (!guild) return

//             for (const instance of overdueInstances) {
//                 const penalty = Math.floor(instance.chore.basePoints / 2)
//                 const roleId = config.roles?.[instance.area]

//                 if (roleId) {
//                     const role = await guild.roles.fetch(roleId)
//                     if (role) {
//                         for (const [, member] of role.members) {
//                             console.log(
//                                 `Overdue penalty: ${member.user.username} -${penalty} pts for ${instance.chore.name}`
//                             )
//                         }
//                     }
//                 }

//                 const channelId =
//                     config.choreChannels?.[instance.area] ??
//                     config.dailyChoresChannelId
//                 const channel = guild.channels.cache.get(channelId)
//                 if (channel?.isTextBased()) {
//                     await channel.send({
//                         content: `🔴 ${
//                             roleId ? `<@&${roleId}>` : 'Incharge'
//                         } — **${
//                             instance.chore.name
//                         }** is overdue. **-${penalty} pts** applied.`
//                     })
//                 }
//             }
//         } catch (err) {
//             console.error('Scheduler error (overdue):', err)
//         }
//     })

//     console.log('Scheduler started')
// }
