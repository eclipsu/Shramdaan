import {
    TextChannel,
    EmbedBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
    ActionRowBuilder,
    ComponentType,
    StringSelectMenuInteraction,
    MessageFlags,
    Message
} from 'discord.js'
import cron from 'node-cron'
import { findAllAreas } from './repositories/AreaRepository.js'
import { getChoresByAreaForToday } from './repositories/ChoreRepository.js'
import { getOrCreateUser } from './repositories/UserRepository.js'
import { markCompleted } from './repositories/ChoreRepository.js'
import { Chore } from './entities/Chore.js'
import { ChoreCompletion } from './entities/ChoresCompletion.js'
import { Area } from './entities/Area.js'

const activeMessages = new Map<string, Message>()

function buildEmbed(
    areaName: string,
    completed: ChoreCompletion[],
    due: Chore[],
    today: Date
): EmbedBuilder {
    const dateStr = today.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })

    const totalPoints = completed.reduce((sum, c) => sum + c.pointsAwarded, 0)
    const duePoints = due.reduce((sum, c) => sum + c.points, 0)

    const completedField =
        completed.length > 0
            ? completed
                  .map(
                      (c) =>
                          `✅ **${c.chore.name}** — \`+${c.pointsAwarded}pts\``
                  )
                  .join('\n')
            : '*No chores completed yet*'

    const dueField =
        due.length > 0
            ? due
                  .map(
                      (c) =>
                          `🔲 **${c.name}** — \`${c.points}pts\` • *${c.recurrence}*`
                  )
                  .join('\n')
            : '*All chores completed! 🎉*'

    return new EmbedBuilder()
        .setTitle(`🧹 Chore Report — ${areaName}`)
        .setDescription(`📅 **${dateStr}**`)
        .setColor(
            completed.length > 0 && due.length === 0 ? 0x2ecc71 : 0xe67e22
        )
        .addFields(
            {
                name: `Completed (${completed.length}) — ${totalPoints}pts earned`,
                value: completedField
            },
            {
                name: `Due (${due.length}) — ${duePoints}pts remaining`,
                value: dueField
            }
        )
        .setFooter({
            text: `${completed.length}/${
                completed.length + due.length
            } chores done`
        })
        .setTimestamp()
}

function buildDoneEmbed(
    choreName: string,
    discordUserId: string,
    pointsAwarded: number
): EmbedBuilder {
    return new EmbedBuilder()
        .setDescription(
            `✅ **${choreName}** marked as done by <@${discordUserId}> — \`+${pointsAwarded}pts\``
        )
        .setColor(0x2ecc71)
        .setTimestamp()
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
                            .setDescription(`${c.points} pts`)
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

    if (!(channel instanceof TextChannel)) {
        console.warn(
            `[Scheduler] Channel for "${area.name}" not found or not a TextChannel.`
        )
        return
    }

    const { completed, due } = await getChoresByAreaForToday(area.id, today)
    const embeds = [buildEmbed(area.name, completed, due, today)]
    const components = due.length > 0 ? [buildChoreRow(due)] : []

    // if we already have an active message for this area today, just edit it
    const existing = activeMessages.get(area.id)
    if (existing) {
        await existing.edit({ embeds, components }).catch(() => {
            // msg was deleted or unreachable
            activeMessages.delete(area.id)
        })

        if (activeMessages.has(area.id)) {
            console.log(
                `[Scheduler] Updated existing chore report for "${area.name}"`
            )
            return
        }
    }

    const message = await channel.send({ embeds, components })
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

    await message.edit({
        embeds: [
            buildEmbed(area.name, completed, dueAfter, today),
            buildDoneEmbed(chore.name, i.user.id, record.pointsAwarded)
        ],
        components: dueAfter.length > 0 ? [buildChoreRow(dueAfter)] : []
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

        // Small delay to avoid hitting rate limits
        await new Promise((res) => setTimeout(res, 1000))
    } while (deleted > 0)

    console.log(`[Purge] Done purging #${channel.name}`)
}
2

export async function postAllChoreReports(): Promise<void> {
    const areas = await findAllAreas()
    for (const area of areas) {
        await postChoreReport(area)
    }
}

export default function startScheduler(): void {
    void postAllChoreReports()

    // the cron value is experimental
    // TODO: change cron to 0 8 * * *
    cron.schedule('*/30 * * * *', () => void postAllChoreReports())
}
