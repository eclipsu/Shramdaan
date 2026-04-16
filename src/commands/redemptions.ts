import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    ActionRowBuilder,
    ComponentType,
    StringSelectMenuInteraction,
    MessageFlags,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize
} from 'discord.js'

import ApplicationCommand from '../templates/ApplicationCommand.js'
import { getAllRedemption } from '../repositories/RedemptionRepository.js'
import { Redemption, RedemptionStatus } from '../entities/Redemption.js'

// function builedUpdatedContainer(
//     redemption: Redemption,
//     status: RedemptionStatus
// ): ContainerBuilder {
//     return new ContainerBuilder()
//         .addTextDisplayComponents(
//             new TextDisplayBuilder().setContent(
//                 `✅ <@${redemption.name}> redeemed **${reward.name}** for \`${reward.pointsCost}pts\` — pending fulfillment!`
//             )
//         )
//         .setAccentColor(0x2ecc71)
// }

function buildUI(redemptions: any[]) {
    return new ContainerBuilder()
        .setAccentColor(0x5865f2)
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `## 📦 Redemption Debug Panel\nSelect items to test logging`
            )
        )
        .addSeparatorComponents(
            new SeparatorBuilder()
                .setDivider(true)
                .setSpacing(SeparatorSpacingSize.Small)
        )
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                redemptions.length
                    ? redemptions
                          .map((r) => `• ${r.id} | ${r.userId} | ${r.status}`)
                          .join('\n')
                    : `No redemptions`
            )
        )
}

function buildRedemptionRow(redemptions: any[]) {
    return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('select_redemption')
            .setPlaceholder('Pick a redemption to log…')
            .addOptions(
                redemptions.slice(0, 25).map((r) =>
                    new StringSelectMenuOptionBuilder()
                        .setLabel(r.rewardId ?? 'Reward')
                        .setValue(r.id)
                        .setDescription(`${r.userId} • ${r.status}`)
                )
            )
    )
}

function buildStatusRow() {
    return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('select_status')
            .setPlaceholder('Pick a status (logs only)…')
            .addOptions(
                new StringSelectMenuOptionBuilder()
                    .setLabel('Fulfilled')
                    .setValue('fulfilled'),

                new StringSelectMenuOptionBuilder()
                    .setLabel('Rejected')
                    .setValue('rejected'),

                new StringSelectMenuOptionBuilder()
                    .setLabel('Pending')
                    .setValue('pending')
            )
    )
}

export default new ApplicationCommand({
    data: new SlashCommandBuilder()
        .setName('redemption')
        .setDescription('Debug redemption UI'),

    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral })

        const redemptions = await getAllRedemption()
        console.log(redemptions)

        const message = await interaction.editReply({
            components: [
                buildUI(redemptions),
                buildRedemptionRow(redemptions),
                buildStatusRow()
            ],
            flags: MessageFlags.IsComponentsV2
        })

        const collector = message.createMessageComponentCollector({
            componentType: ComponentType.StringSelect,
            time: 10 * 60 * 1000
        })

        collector.on('collect', async (i: StringSelectMenuInteraction) => {
            await i.deferUpdate()

            if (i.customId === 'select_redemption') {
                console.log('🧾 Selected redemption ID:', i.values[0])
            }

            if (i.customId === 'select_status') {
                console.log('⚙️ Selected status:', i.values[0])
            }
        })
    }
})
