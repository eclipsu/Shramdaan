// import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js'
// import ApplicationCommand from '../templates/ApplicationCommand.js'
// import { postAreaEmbed } from '../scheduler.js'

// export default new ApplicationCommand({
//     data: new SlashCommandBuilder()
//         .setName('kitchen')
//         .setDescription("Post today's Kitchen chores"),
//     async execute(interaction: ChatInputCommandInteraction): Promise<void> {
//         await interaction.deferReply({ ephemeral: true })
//         await postAreaEmbed('Kitchen')
//         await interaction.editReply({ content: '✅ Kitchen chores posted.' })
//     }
// })
