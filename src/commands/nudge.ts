// import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js'
// import ApplicationCommand from '../templates/ApplicationCommand.js'
// import { findOrCreateUser, resetNudgesIfNeeded } from '../repositories/UserRepository.js'
// import { findChoreByName, getAllActiveChores } from '../repositories/ChoreRepository.js'
// import { getActiveAssignment } from '../repositories/AssignmentRepository.js'
// import { getTodayInstances } from '../repositories/ChoreInstanceRepository.js'
// import { AppDataSource } from '../database.js'

// const MAX_NUDGES_PER_DAY = 3

// export default new ApplicationCommand({
//     data: new SlashCommandBuilder()
//         .setName('nudge')
//         .setDescription('Request help from a spectator for your chore')
//         .addStringOption(o =>
//             o.setName('chore').setDescription('Which chore do you need help with?').setRequired(true).setAutocomplete(true)
//         )
//         .addUserOption(o =>
//             o.setName('user').setDescription('Spectator to nudge').setRequired(true)
//         )
//         .addIntegerOption(o =>
//             o.setName('timeout').setDescription('Minutes to respond (default 30)').setRequired(false)
//         ),

//     async autocomplete(interaction): Promise<void> {
//         const focused = interaction.options.getFocused()
//         const chores = await getAllActiveChores()
//         const filtered = chores
//             .filter(c => c.name.toLowerCase().includes(focused.toLowerCase()))
//             .slice(0, 25)
//         await interaction.respond(filtered.map(c => ({ name: c.name, value: c.name })))
//     },

//     async execute(interaction: ChatInputCommandInteraction): Promise<void> {
//         await interaction.deferReply({ ephemeral: true })

//         const choreName = interaction.options.getString('chore', true)
//         const spectatorDiscord = interaction.options.getUser('user', true)
//         const timeout = interaction.options.getInteger('timeout') ?? 30

//         // can't nudge yourself
//         if (spectatorDiscord.id === interaction.user.id) {
//             await interaction.editReply({ content: '❌ You cannot nudge yourself.' })
//             return
//         }

//         const incharge = await findOrCreateUser(interaction.user.id, interaction.user.username)
//         const updatedIncharge = await resetNudgesIfNeeded(incharge)

//         // check nudge limit
//         if (updatedIncharge.nudgesUsedToday >= MAX_NUDGES_PER_DAY) {
//             await interaction.editReply({ content: `❌ You've used all ${MAX_NUDGES_PER_DAY} nudges for today.` })
//             return
//         }

//         const chore = await findChoreByName(choreName)
//         if (!chore) {
//             await interaction.editReply({ content: `❌ Chore **${choreName}** not found.` })
//             return
//         }

//         // make sure caller is the incharge for this chore
//         const assignment = await getActiveAssignment(chore.id)
//         if (!assignment || assignment.user.discordId !== interaction.user.id) {
//             await interaction.editReply({ content: `❌ You are not the incharge for **${choreName}**.` })
//             return
//         }

//         // find today's pending instance
//         const instances = await getTodayInstances()
//         const instance = instances.find(i => i.chore.id === chore.id && (i.status === 'pending' || i.status === 'overdue'))
//         if (!instance) {
//             await interaction.editReply({ content: `❌ No pending instance found for **${choreName}** today.` })
//             return
//         }

//         const expiresAt = new Date()
//         expiresAt.setMinutes(expiresAt.getMinutes() + timeout)

//         // increment nudges used
//         await AppDataSource.getRepository('User').increment(
//             { discordId: interaction.user.id },
//             'nudgesUsedToday',
//             1
//         )

//         // notify spectator
//         const channel = interaction.channel
//         if (channel && channel.isTextBased()) {
//             await channel.send({
//                 content: `👋 <@${spectatorDiscord.id}>, <@${interaction.user.id}> needs help with **${choreName}**. You have **${timeout} minutes** to respond by reacting 🔁 on the chore. Ignoring will cost you **-${chore.basePoints} pts**.`
//             })
//         }

//         await interaction.editReply({ content: `✅ Nudge sent to <@${spectatorDiscord.id}> for **${choreName}**. They have ${timeout} minutes to respond.` })
//     }
// })
