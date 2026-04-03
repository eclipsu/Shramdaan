import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    PermissionFlagsBits
} from 'discord.js'

import ApplicationCommand from '../templates/ApplicationCommand.js'
import {
    createUser,
    findUserByDiscordId
} from '../repositories/UserRepository.js'

export default new ApplicationCommand({
    data: new SlashCommandBuilder()
        .setName('profile')
        .setDescription('Profile commands')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand((sub) =>
            sub
                .setName('create')
                .setDescription('Create a user profile for a member')
                .addUserOption((o) =>
                    o

                        .setName('user')
                        .setDescription('The user to create a profile for')
                        .setRequired(true)
                )
        ),

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        await interaction.deferReply({ ephemeral: true })
        const sub = interaction.options.getSubcommand()

        if (sub === 'create') {
            const user = interaction.options.getUser('user', true)
            const existing = await findUserByDiscordId(user.id)
            if (existing) {
                await interaction.editReply({
                    content: `A profile for ${user.tag} already exists.`
                })
                return
            }
            await createUser(user.id)
            await interaction.editReply({
                content: `Profile for ${user.tag} created successfully.\nYou can now assign chores to them and they can start earning points!`
            })
        }
    }
})
