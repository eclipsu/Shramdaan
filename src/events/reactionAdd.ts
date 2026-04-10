// import {
//     Events,
//     MessageReaction,
//     User,
//     PartialMessageReaction,
//     PartialUser
// } from 'discord.js'
// import Event from '../templates/Event.js'
// import {
//     findInstanceByMessageId,
//     markComplete,
//     getTodayInstances
// } from '../repositories/ChoreInstanceRepository.js'
// import {
//     findOrCreateUser,
// } from '../repositories/UserRepository.js'
// import { EmbedBuilder } from 'discord.js'
// import { createRequire } from 'module'
// import { fileURLToPath } from 'url'
// import { resolve, dirname } from 'path'

// const __dirname = dirname(fileURLToPath(import.meta.url))
// const require = createRequire(import.meta.url)
// const config = require(resolve(__dirname, '../config.json')) as {
//     roles: Record<string, string>
// }

// const numberEmojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣']

// export default new Event({
//     name: Events.MessageReactionAdd,
//     async execute(
//         reaction: MessageReaction | PartialMessageReaction,
//         user: User | PartialUser
//     ): Promise<void> {
//         if (user.bot) return

//         if (reaction.partial) {
//             try {
//                 await reaction.fetch()
//             } catch {
//                 return
//             }
//         }
//         if (reaction.message.partial) {
//             try {
//                 await reaction.message.fetch()
//             } catch {
//                 return
//             }
//         }

//         const emoji = reaction.emoji.name ?? ''
//         const numberIndex = numberEmojis.indexOf(emoji)
//         if (numberIndex === -1) return // ignore non-number reactions

//         const messageId = reaction.message.id

//         // find which instance this message belongs to by getting all today's instances for this message
//         // all instances in an area share the same messageId
//         const allInstances = await getTodayInstances()
//         const areaInstances = allInstances.filter(
//             (i) => i.discordMessageId === messageId
//         )

//         if (areaInstances.length === 0) return

//         const instance = areaInstances[numberIndex]
//         if (!instance) return

//         // ignore if already completed
//         if (instance.status === 'completed') {
//             await reaction.users.remove(user.id)
//             return
//         }

//         const member = await reaction.message.guild?.members.fetch(user.id)
//         if (!member) return

//         const roleId = config.roles?.[instance.area]
//         const isIncharge = roleId ? member.roles.cache.has(roleId) : false
//         const points = isIncharge
//             ? instance.chore.basePoints
//             : instance.chore.basePoints * 2

//         await markComplete(instance.id, user.id, !isIncharge, points)
//         await findOrCreateUser(user.id, member.user.username)

//         // update the embed to reflect new status
//         await updateAreaEmbed(messageId, instance.area)

//         await reaction.message.channel.send({
//             content: [
//                 isIncharge
//                     ? `✅ <@${user.id}> completed **${instance.chore.name}** · **+${points} pts**`
//                     : `🌟 <@${user.id}> helped with **${instance.chore.name}** · **+${points} pts** _(spectator bonus)_`
//             ].join('')
//         })
//     }
// })

// async function updateAreaEmbed(messageId: string, area: string): Promise<void> {
//     try {
//         const allInstances = await getTodayInstances(
//             area as 'Kitchen' | 'Hall/Living Room' | 'Washroom' | 'Misc'
//         )
//         const instances = allInstances.filter(
//             (i) => i.discordMessageId === messageId
//         )
//         if (instances.length === 0) return

//         const firstInstance = instances[0]
//         const message = await client.channels
//             .fetch(firstInstance.discordChannelId!)
//             .then((ch) =>
//                 ch?.isTextBased() ? ch.messages.fetch(messageId) : null
//             )
//             .catch(() => null)

//         if (!message) return

//         const oldEmbed = message.embeds[0]
//         if (!oldEmbed) return

//         const roleId = config.roles?.[area]

//         const areaEmoji: Record<string, string> = {
//             Kitchen: '🍳',
//             'Hall/Living Room': '🛋️',
//             Washroom: '🚿',
//             Misc: '📋'
//         }

//         const lines = instances.map((inst, i) => {
//             const emoji =
//                 inst.status === 'completed'
//                     ? '✅'
//                     : inst.status === 'overdue'
//                     ? '🔴'
//                     : '⏳'
//             const completedNote = inst.completedBy
//                 ? ` · _done by <@${inst.completedBy}>_`
//                 : ''
//             return `**${i + 1}.** ${emoji} **${
//                 inst.chore.name
//             }**${completedNote}\n　　_${
//                 inst.chore.basePoints
//             } pts · Due <t:${Math.floor(inst.dueBy.getTime() / 1000)}:t>_`
//         })

//         const areaColor: Record<string, number> = {
//             Kitchen: 0xe67e22,
//             'Hall/Living Room': 0x3498db,
//             Washroom: 0x1abc9c,
//             Misc: 0x95a5a6
//         }

//         const newEmbed = new EmbedBuilder()
//             .setTitle(`${areaEmoji[area] ?? '📌'} ${area}`)
//             .setColor(areaColor[area] ?? 0x5865f2)
//             .setDescription(
//                 [
//                     roleId
//                         ? `> 👤 Incharge: <@&${roleId}>`
//                         : '> 👤 No incharge assigned',
//                     `> 📅 <t:${Math.floor(Date.now() / 1000)}:D>`,
//                     '',
//                     '**Chores**',
//                     ...lines,
//                     '',
//                     '─────────────────────',
//                     '_React with the number to mark complete_',
//                     `_Incharge +X pts · Others +2X pts_`
//                 ].join('\n')
//             )
//             .setTimestamp()

//         await message.edit({ embeds: [newEmbed] })
//     } catch (err) {
//         console.error('Failed to update area embed:', err)
//     }
// }
