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
import {
    getAllRewards,
    redeemReward
} from '../repositories/RewardRepository.js'
import { Reward } from '../entities/Reward.js'

function buildContainer(
    rewards: Reward[],
    selectedId?: string
): ContainerBuilder {
    const header = new TextDisplayBuilder().setContent(
        `## 🎁 Reward Shop\nSpend your hard-earned points on rewards!`
    )

    const separator = new SeparatorBuilder()
        .setSpacing(SeparatorSpacingSize.Small)
        .setDivider(true)

    const rewardList = new TextDisplayBuilder().setContent(
        rewards.length > 0
            ? rewards
                  .map(
                      (r) =>
                          `> 🎁 **${r.name}** — \`${r.pointsCost}pts\`${
                              r.description ? `\n> *${r.description}*` : ''
                          }`
                  )
                  .join('\n')
            : `> *No rewards available right now*`
    )

    const footer = new TextDisplayBuilder().setContent(
        `-# ${rewards.length} reward${
            rewards.length === 1 ? '' : 's'
        } available`
    )

    const container = new ContainerBuilder()
        .addTextDisplayComponents(header)
        .addSeparatorComponents(separator)
        .addTextDisplayComponents(rewardList)
        .addSeparatorComponents(
            new SeparatorBuilder()
                .setSpacing(SeparatorSpacingSize.Small)
                .setDivider(true)
        )
        .addTextDisplayComponents(footer)
        .setAccentColor(0xf1c40f)

    if (rewards.length > 0) {
        container.addActionRowComponents(buildRewardRow(rewards, selectedId))
    }

    return container
}

function buildRedeemedContainer(
    reward: Reward,
    discordUserId: string
): ContainerBuilder {
    return new ContainerBuilder()
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `✅ <@${discordUserId}> redeemed **${reward.name}** for \`${reward.pointsCost}pts\` — pending fulfillment!`
            )
        )
        .setAccentColor(0x2ecc71)
}

function buildRewardRow(
    rewards: Reward[],
    selectedId?: string
): ActionRowBuilder<StringSelectMenuBuilder> {
    return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('select_reward')
            .setPlaceholder('Select a reward to redeem…')
            .addOptions(
                rewards.slice(0, 25).map((r) =>
                    new StringSelectMenuOptionBuilder()
                        .setLabel(r.name)
                        .setDescription(
                            `${r.pointsCost} pts${
                                r.description
                                    ? ` • ${r.description.slice(0, 50)}`
                                    : ''
                            }`
                        )
                        .setValue(r.id)
                        .setDefault(r.id === selectedId)
                )
            )
    )
}

export default new ApplicationCommand({
    data: new SlashCommandBuilder()
        .setName('redeem')
        .setDescription('Redeem a reward with your points'),

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        await interaction.deferReply({ ephemeral: false })

        const rewards = await getAllRewards()

        const message = await interaction.editReply({
            components: [buildContainer(rewards)],
            flags: MessageFlags.IsComponentsV2
        })

        const collector = message.createMessageComponentCollector({
            componentType: ComponentType.StringSelect,
            time: 5 * 60 * 1000
        })

        collector.on('collect', (i: StringSelectMenuInteraction) => {
            void handleSelectReward(i)
        })

        collector.on('end', () => {
            void interaction.editReply({ components: [] }).catch(() => {})
        })

        async function handleSelectReward(
            i: StringSelectMenuInteraction
        ): Promise<void> {
            await i.deferUpdate()

            const rewardId = i.values[0]
            const reward = rewards.find((r) => r.id === rewardId)
            if (!reward) return

            try {
                await redeemReward({
                    userId: i.user.id,
                    rewardId
                })

                await interaction.editReply({
                    components: [
                        buildContainer(rewards, rewardId),
                        buildRedeemedContainer(reward, i.user.id)
                    ],
                    flags: MessageFlags.IsComponentsV2
                })
            } catch (err: unknown) {
                const message =
                    err instanceof Error ? err.message : 'Something went wrong'

                await i.followUp({
                    content: `❌ ${message}`,
                    flags: MessageFlags.Ephemeral
                })
            }
        }
    }
})
