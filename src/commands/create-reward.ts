import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
    ModalSubmitInteraction
} from 'discord.js'

import ApplicationCommand from '../templates/ApplicationCommand.js'
import { createReward } from '../repositories/RewardRepository.js'

export default new ApplicationCommand({
    data: new SlashCommandBuilder()
        .setName('create-reward')
        .setDescription('Create a new reward'),

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        const modal = new ModalBuilder()
            .setCustomId('create-reward-modal')
            .setTitle('Create Reward')

        const nameInput = new TextInputBuilder()
            .setCustomId('name')
            .setLabel('Reward Name')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('e.g. Custom Role')
            .setRequired(true)

        const descriptionInput = new TextInputBuilder()
            .setCustomId('description')
            .setLabel('Description')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Describe the reward...')
            .setRequired(true)

        const pointsCostInput = new TextInputBuilder()
            .setCustomId('pointsCost')
            .setLabel('Points Cost')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('e.g. 100')
            .setRequired(true)

        modal.addComponents(
            new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput),
            new ActionRowBuilder<TextInputBuilder>().addComponents(
                descriptionInput
            ),
            new ActionRowBuilder<TextInputBuilder>().addComponents(
                pointsCostInput
            )
        )

        await interaction.showModal(modal)

        const submitted = await interaction
            .awaitModalSubmit({
                filter: (i: ModalSubmitInteraction) =>
                    i.customId === 'create-reward-modal' &&
                    i.user.id === interaction.user.id,
                time: 60_000
            })
            .catch(() => null)

        if (!submitted) return

        const name = submitted.fields.getTextInputValue('name')
        const description = submitted.fields.getTextInputValue('description')
        const pointsCost = parseInt(
            submitted.fields.getTextInputValue('pointsCost')
        )

        if (isNaN(pointsCost)) {
            await submitted.reply({
                content: 'Points cost must be a number.',
                ephemeral: true
            })
            return
        }

        await createReward({
            name,
            description,
            pointsCost,
            createdById: interaction.user.id
        })

        await submitted.reply({
            content: `Reward **${name}** created for **${pointsCost}** points!`,
            ephemeral: true
        })
    }
})
