// import { SlashCommandBuilder, ChatInputCommandInteraction, PermissionFlagsBits } from 'discord.js'
// import ApplicationCommand from '../templates/ApplicationCommand.js'
// import { findChoreByName, getAllActiveChores } from '../repositories/ChoreRepository.js'
// import { assignChore } from '../repositories/AssignmentRepository.js'
// import { findOrCreateUser } from '../repositories/UserRepository.js'

// export default new ApplicationCommand({
//     data: new SlashCommandBuilder()
//         .setName('assign')
//         .setDescription('Assign a chore to a user')
//         .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
//         .addStringOption(o =>
//             o.setName('chore').setDescription('Chore name').setRequired(true).setAutocomplete(true)
//         )
//         .addUserOption(o =>
//             o.setName('user').setDescription('User to assign as incharge').setRequired(true)
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
//         const discordUser = interaction.options.getUser('user', true)

//         const chore = await findChoreByName(choreName)
//         if (!chore) {
//             await interaction.editReply({ content: `❌ Chore **${choreName}** not found.` })
//             return
//         }

//         const user = await findOrCreateUser(discordUser.id, discordUser.username)
//         await assignChore(chore, user)

//         await interaction.editReply({
//             content: `✅ **${choreName}** assigned to <@${discordUser.id}>.`
//         })
//     }
// })
