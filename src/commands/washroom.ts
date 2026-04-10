// import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js'
// import ApplicationCommand from '../templates/ApplicationCommand.js'
// import { postAreaEmbed } from '../scheduler.js'

// export default new ApplicationCommand({
//     data: new SlashCommandBuilder()
//         .setName('washroom')
//         .setDescription("Post today's Washroom chores"),
//     async execute(interaction: ChatInputCommandInteraction): Promise<void> {
//         await interaction.deferReply({ ephemeral: true })
//         await postAreaEmbed('Washroom')
//         await interaction.editReply({ content: '✅ Washroom chores posted.' })
//     }
// })
