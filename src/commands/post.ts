import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js'
import ApplicationCommand from '../templates/ApplicationCommand.js'

import { postAllChoreReports } from '../scheduler.js'

export default new ApplicationCommand({
    data: new SlashCommandBuilder()
        .setName('post')
        .setDescription('Post chores list on channels'),

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        await interaction.deferReply({ ephemeral: false })
        await postAllChoreReports()
        await interaction.editReply('✅ Chores are posted on their channels.')
    }
})
