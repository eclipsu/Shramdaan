import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuInteraction,
    ComponentType
} from 'discord.js'
import ApplicationCommand from '../templates/ApplicationCommand.js'
import { getOrCreateUser } from '../repositories/UserRepository.js'
import { findAllAreas } from '../repositories/AreaRepository.js'
import { claimArea, getCurrentRotation } from '../repositories/AreaRotations.js'

export default new ApplicationCommand({
    data: new SlashCommandBuilder()
        .setName('claim')
        .setDescription('Claim responsibility for an area for the week'),

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        await interaction.deferReply({ ephemeral: true })

        const areas = await findAllAreas()
        if (areas.length === 0) {
            await interaction.editReply(
                'No areas found. Please ask an administrator to create some areas first.'
            )
            return
        }

        const select = new StringSelectMenuBuilder()
            .setCustomId('claim-area-select')
            .setPlaceholder('Select an area to claim')
            .addOptions(
                areas.map((area) => ({
                    label: area.name,
                    value: area.id,
                    description: `Claim incharge of ${area.name} for this week`
                }))
            )

        const row =
            new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
                select
            )
        await interaction.editReply({
            content: 'Which area do you want to be incharge of this week?',
            components: [row]
        })

        const message = await interaction.fetchReply()

        const collector = message.createMessageComponentCollector({
            componentType: ComponentType.StringSelect,
            time: 30_000
        })

        collector.on('collect', async (i: StringSelectMenuInteraction) => {
            if (i.customId !== 'claim-area-select') return // Ignore other selects if any

            const areaId = i.values[0]
            const area = areas.find((a) => a.id === areaId)

            // CHECK WHO IS CURRENTLY INCHARGE OF THIS AREA
            const currentRotation = await getCurrentRotation(areaId)

            const user = await getOrCreateUser(i.user.id)
            await claimArea(areaId, user?.id)

            const embed = new EmbedBuilder()
                .setColor(0x378add)
                .setTitle(`${area?.name} claimed!`)
                .setDescription(
                    currentRotation
                        ? `You have taken over from <@${currentRotation.userId}> as the incharge of **${area?.name}** for this week!`
                        : `You are now the incharge of **${area?.name}** for this week`
                )
                .setFooter({
                    text: `Rotation resets every Sunday at midnight!`
                })
                .setTimestamp()

            await i.update({ embeds: [embed], components: [], content: '' })
            collector.stop()
        })

        collector.on('end', async (_, reason) => {
            if (reason === 'time') {
                await interaction.editReply({
                    content:
                        'Claim timed out - run `/claim` again to select an area.',
                    components: []
                })
            }
        })
    }
})
