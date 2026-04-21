import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    UserSelectMenuBuilder,
    ActionRowBuilder,
    ComponentType,
    UserSelectMenuInteraction,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    MessageFlags,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize
} from 'discord.js'
import ApplicationCommand from '../templates/ApplicationCommand.js'
import { givePraise } from '../repositories/PraiseRepository.js'

const POINTS = 20

function buildContainer(selectedUserId?: string): ContainerBuilder {
    const header = new TextDisplayBuilder().setContent(
        `## 🌟 Give Praise\nRecognize someone's hard work and award them **${POINTS} pts**!`
    )

    const separator = new SeparatorBuilder()
        .setSpacing(SeparatorSpacingSize.Small)
        .setDivider(true)

    const body = new TextDisplayBuilder().setContent(
        selectedUserId
            ? `**Selected:** <@${selectedUserId}>\nNow add a reason and submit!`
            : `Select a housemate below to praise, then you'll be asked for a reason.`
    )

    const footer = new TextDisplayBuilder().setContent(
        `-# Praise awards +${POINTS} pts to the recipient`
    )

    return new ContainerBuilder()
        .addTextDisplayComponents(header)
        .addSeparatorComponents(separator)
        .addTextDisplayComponents(body)
        .addSeparatorComponents(
            new SeparatorBuilder()
                .setSpacing(SeparatorSpacingSize.Small)
                .setDivider(true)
        )
        .addTextDisplayComponents(footer)
        .setAccentColor(0xf1c40f)
        .addActionRowComponents(buildUserRow())
}

function buildUserRow(): ActionRowBuilder<UserSelectMenuBuilder> {
    return new ActionRowBuilder<UserSelectMenuBuilder>().addComponents(
        new UserSelectMenuBuilder()
            .setCustomId('select_praise_user')
            .setPlaceholder('Choose someone to praise…')
            .setMinValues(1)
            .setMaxValues(1)
    )
}

function buildSuccessContainer(
    fromId: string,
    toId: string,
    reason: string
): ContainerBuilder {
    return new ContainerBuilder()
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `🌟 <@${fromId}> praised <@${toId}> — \`+${POINTS}pts\`\n> *"${reason}"*`
            )
        )
        .setAccentColor(0x2ecc71)
}

export default new ApplicationCommand({
    data: new SlashCommandBuilder()
        .setName('praise')
        .setDescription('Praise a housemate and award them points'),

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        await interaction.deferReply({ ephemeral: false })

        const message = await interaction.editReply({
            components: [buildContainer()],
            flags: MessageFlags.IsComponentsV2
        })

        const collector = message.createMessageComponentCollector({
            componentType: ComponentType.UserSelect,
            time: 5 * 60 * 1000
        })

        collector.on('collect', (i: UserSelectMenuInteraction) => {
            void handleUserSelect(i)
        })

        collector.on('end', () => {
            void interaction.editReply({ components: [] }).catch(() => {})
        })

        async function handleUserSelect(
            i: UserSelectMenuInteraction
        ): Promise<void> {
            const toUserId = i.values[0]

            // Update the embed to show the selected user, then open modal
            await interaction.editReply({
                components: [buildContainer(toUserId)],
                flags: MessageFlags.IsComponentsV2
            })

            const modal = new ModalBuilder()
                .setCustomId(`praise_reason_${toUserId}`)
                .setTitle('Add a reason for the praise')
                .addComponents(
                    new ActionRowBuilder<TextInputBuilder>().addComponents(
                        new TextInputBuilder()
                            .setCustomId('reason')
                            .setLabel('Reason')
                            .setStyle(TextInputStyle.Paragraph)
                            .setPlaceholder(
                                'e.g. "Cleaned the kitchen without being asked!"'
                            )
                            .setMinLength(5)
                            .setMaxLength(300)
                            .setRequired(true)
                    )
                )

            await i.showModal(modal)

            const modalSubmit = await i
                .awaitModalSubmit({
                    time: 5 * 60 * 1000,
                    filter: (m) =>
                        m.customId === `praise_reason_${toUserId}` &&
                        m.user.id === i.user.id
                })
                .catch(() => null)

            if (!modalSubmit) return

            await modalSubmit.deferUpdate()

            const reason = modalSubmit.fields.getTextInputValue('reason')

            try {
                await givePraise({
                    fromDiscordId: i.user.id,
                    toDiscordId: toUserId,
                    reason
                })

                collector.stop()

                await interaction.editReply({
                    components: [
                        buildSuccessContainer(i.user.id, toUserId, reason)
                    ],
                    flags: MessageFlags.IsComponentsV2
                })
            } catch (err: unknown) {
                const msg =
                    err instanceof Error ? err.message : 'Something went wrong'

                await modalSubmit.followUp({
                    content: `❌ ${msg}`,
                    flags: MessageFlags.Ephemeral
                })
            }
        }
    }
})
