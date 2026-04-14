import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
    MessageFlags
} from 'discord.js'

import { findUserByDiscordId } from '../repositories/UserRepository.js'
import { getAreasUserIsInChargeOf } from '../repositories/AreaRepository.js'

import { getCompletedAndCoveredCount } from '../repositories/ChoreRepository.js'

import ApplicationCommand from '../templates/ApplicationCommand.js'

export default new ApplicationCommand({
    data: new SlashCommandBuilder()
        .setName('profile')
        .setDescription('View your profile'),

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        await interaction.deferReply({ ephemeral: false })

        const discordId = interaction.user.id
        const user = await findUserByDiscordId(discordId)
        const areas = await getAreasUserIsInChargeOf(user.id)
        const { completed, covered } = await getCompletedAndCoveredCount(
            user.id
        )

        const areaList = areas.length
            ? areas.map((a) => `• ${a.name} - ${a.startsAt}`).join('\n')
            : 'No areas assigned'

        const header = new TextDisplayBuilder().setContent(
            `## 👤 ${interaction.user.displayName}'s Profile`
        )

        const stats = new TextDisplayBuilder().setContent(
            [
                `🔥 **Streak** — ${user.streak} days`,
                `🏆 **Points** — ${user.points}`,
                `✅ **Completed** — ${completed}`,
                `🤝 **Covered** — ${covered}`
            ].join('\n')
        )

        const separator = new SeparatorBuilder()
            .setSpacing(SeparatorSpacingSize.Small)
            .setDivider(true)

        const areasText = new TextDisplayBuilder().setContent(
            `**Areas in charge of**\n${areaList}`
        )

        const container = new ContainerBuilder()
            .addTextDisplayComponents(header)
            .addSeparatorComponents(separator)
            .addTextDisplayComponents(stats)
            .addSeparatorComponents(
                new SeparatorBuilder()
                    .setSpacing(SeparatorSpacingSize.Small)
                    .setDivider(true)
            )
            .addTextDisplayComponents(areasText)
            .setAccentColor(0x5865f2)

        await interaction.editReply({
            components: [container],
            flags: MessageFlags.IsComponentsV2
        })
    }
})
