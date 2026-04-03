// import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js'
// import ApplicationCommand from '../templates/ApplicationCommand.js'
// import { postAllAreaEmbeds } from '../scheduler.js'

// export default new ApplicationCommand({
//     data: new SlashCommandBuilder()
//         .setName('today')
//         .setDescription("Post today's chore embeds for all areas"),

//     async execute(interaction: ChatInputCommandInteraction): Promise<void> {
//         await interaction.deferReply({ ephemeral: true })
//         await postAllAreaEmbeds()
//         await interaction.editReply({ content: "✅ Today's chores posted." })
//     }
// })
