import {
    TextChannel,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    ActionRowBuilder,
    ComponentType,
    StringSelectMenuInteraction,
    MessageFlags,
    Message,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize
} from 'discord.js'
import cron from 'node-cron'
import { findAllAreas } from './repositories/AreaRepository.js'
import { getChoresByAreaForToday } from './repositories/ChoreRepository.js'
import {
    getOrCreateUser,
    incrementStreak
} from './repositories/UserRepository.js'
import { markCompleted } from './repositories/ChoreRepository.js'
import { Chore } from './entities/Chore.js'
import { ChoreCompletion } from './entities/ChoresCompletion.js'
import { Area } from './entities/Area.js'

const activeMessages = new Map<string, Message>()

function buildContainer(
    areaName: string,
    completed: ChoreCompletion[],
    due: Chore[],
    today: Date
): ContainerBuilder {
    const dateStr = today.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })

    const totalPoints = completed.reduce((sum, c) => sum + c.pointsAwarded, 0)
    const duePoints = due.reduce((sum, c) => sum + c.points, 0)
    const allDone = due.length === 0

    const header = new TextDisplayBuilder().setContent(
        `## 🧹 ${areaName}\n📅 ${dateStr}`
    )

    const separator = new SeparatorBuilder()
        .setSpacing(SeparatorSpacingSize.Small)
        .setDivider(true)

    const completedText = new TextDisplayBuilder().setContent(
        completed.length > 0
            ? `**✅ Completed (${completed.length}) — ${totalPoints} pts earned**\n` +
                  completed
                      .map(
                          (c) =>
                              `> ✅ **${c.chore.name}** — \`+${c.pointsAwarded}pts\``
                      )
                      .join('\n')
            : `**✅ Completed (0)**\n> *No chores completed yet*`
    )

    const separator2 = new SeparatorBuilder()
        .setSpacing(SeparatorSpacingSize.Small)
        .setDivider(true)

    const dueText = new TextDisplayBuilder().setContent(
        allDone
            ? `**🎉 All chores done! Great work!**`
            : `**🔲 Due (${due.length}) — ${duePoints} pts remaining**\n` +
                  due
                      .map(
                          (c) =>
                              `> 🔲 **${c.name}** — \`${c.points}pts\` • *${c.recurrence}*`
                      )
                      .join('\n')
    )

    const footer = new TextDisplayBuilder().setContent(
        `-# ${completed.length}/${completed.length + due.length} chores done`
    )

    const container = new ContainerBuilder()
        .addTextDisplayComponents(header)
        .addSeparatorComponents(separator)
        .addTextDisplayComponents(completedText)
        .addSeparatorComponents(separator2)
        .addTextDisplayComponents(dueText)
        .addSeparatorComponents(
            new SeparatorBuilder()
                .setSpacing(SeparatorSpacingSize.Small)
                .setDivider(true)
        )
        .addTextDisplayComponents(footer)
        .setAccentColor(allDone ? 0x2ecc71 : 0xe67e22)

    if (due.length > 0) {
        container.addActionRowComponents(buildChoreRow(due))
    }

    return container
}

function buildDoneContainer(
    choreName: string,
    discordUserId: string,
    pointsAwarded: number
): ContainerBuilder {
    return new ContainerBuilder()
        .addTextDisplayComponents(
            new TextDisplayBuilder().setContent(
                `✅ **${choreName}** marked as done by <@${discordUserId}> — \`+${pointsAwarded}pts\``
            )
        )
        .setAccentColor(0x2ecc71)
}

function buildChoreRow(
    due: Chore[]
): ActionRowBuilder<StringSelectMenuBuilder> {
    return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId('complete_chore')
            .setPlaceholder('Mark a chore as complete…')
            .addOptions(
                due
                    .slice(0, 25)
                    .map((c) =>
                        new StringSelectMenuOptionBuilder()
                            .setLabel(c.name)
                            .setDescription(`${c.points} pts • ${c.recurrence}`)
                            .setValue(c.id)
                    )
            )
    )
}

async function postChoreReport(area: Area): Promise<void> {
    const today = new Date()

    if (!area.discordChannelId) {
        console.warn(
            `[Scheduler] Area "${area.name}" has no channel ID, skipping.`
        )
        return
    }

    const channel = client.channels.cache.get(area.discordChannelId)
    if (!(channel instanceof TextChannel)) return

    await purgeAll(channel)

    const { completed, due } = await getChoresByAreaForToday(area.id, today)
    const container = buildContainer(area.name, completed, due, today)

    const existing = activeMessages.get(area.id)
    if (existing) {
        await existing
            .edit({
                components: [container],
                flags: MessageFlags.IsComponentsV2
            })
            .catch(() => activeMessages.delete(area.id))

        if (activeMessages.has(area.id)) {
            console.log(
                `[Scheduler] Updated existing chore report for "${area.name}"`
            )
            return
        }
    }

    const message = await channel.send({
        components: [container],
        flags: MessageFlags.IsComponentsV2
    })

    activeMessages.set(area.id, message)
    console.log(
        `[Scheduler] Posted chore report for "${area.name}" in #${channel.name}`
    )

    const collector = message.createMessageComponentCollector({
        componentType: ComponentType.StringSelect
    })

    collector.on('collect', (i: StringSelectMenuInteraction) => {
        void handleCompleteChore(i, area, message, today)
    })
}

async function handleCompleteChore(
    i: StringSelectMenuInteraction,
    area: Area,
    message: Awaited<ReturnType<TextChannel['send']>>,
    today: Date
): Promise<void> {
    await i.deferUpdate()

    const choreId = i.values[0]
    const { due } = await getChoresByAreaForToday(area.id, today)
    const chore = due.find((c) => c.id === choreId)

    if (!chore) {
        await i.followUp({
            content: 'That chore is already completed!',
            flags: MessageFlags.Ephemeral
        })
        return
    }

    const user = await getOrCreateUser(i.user.id)

    const record: ChoreCompletion = await markCompleted({
        choreId: chore.id,
        isCover: false,
        completedById: user.id,
        pointsAwarded: chore.points
    })

    const { completed, due: dueAfter } = await getChoresByAreaForToday(
        area.id,
        today
    )
    await incrementStreak(user.discordUserId)

    await message.edit({
        components: [
            buildContainer(area.name, completed, dueAfter, today),
            buildDoneContainer(chore.name, i.user.id, record.pointsAwarded)
        ],
        flags: MessageFlags.IsComponentsV2
    })
}

async function purgeAll(channel: TextChannel): Promise<void> {
    let deleted: number

    do {
        const messages = await channel.messages.fetch({ limit: 100 })
        if (messages.size === 0) break

        const result = await channel.bulkDelete(messages, true)
        deleted = result.size
        console.log(`[Purge] Deleted ${deleted} messages…`)

        await new Promise((res) => setTimeout(res, 1000))
    } while (deleted > 0)

    console.log(`[Purge] Done purging #${channel.name}`)
}

export async function postAllChoreReports(): Promise<void> {
    const areas = await findAllAreas()
    for (const area of areas) {
        await postChoreReport(area)
    }
}

export default function startScheduler(): void {
    void postAllChoreReports()
    cron.schedule('*/30 * * * *', () => void postAllChoreReports())
}
