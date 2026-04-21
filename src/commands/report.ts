import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    ContainerBuilder,
    TextDisplayBuilder,
    SeparatorBuilder,
    SeparatorSpacingSize,
    MessageFlags,
    userMention
} from 'discord.js'
import ApplicationCommand from '../templates/ApplicationCommand.js'
import { buildWeeklySnapshot } from '../repositories/WeeklyReportRepository.js'
import { saveWeeklyReport } from '../repositories/WeeklyReportRepository.js'
import { UserWeeklyStat } from '../entities/WeeklyReport.js'

function medal(index: number): string {
    return ['🥇', '🥈', '🥉'][index] ?? `${index + 1}.`
}

function sep(): SeparatorBuilder {
    return new SeparatorBuilder()
        .setSpacing(SeparatorSpacingSize.Small)
        .setDivider(true)
}

export default new ApplicationCommand({
    data: new SlashCommandBuilder()
        .setName('report')
        .setDescription('View or generate the weekly report')
        .addBooleanOption((opt) =>
            opt
                .setName('save')
                .setDescription('Save this report to the database')
                .setRequired(false)
        ),

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        await interaction.deferReply({ ephemeral: false })

        const shouldSave = interaction.options.getBoolean('save') ?? false

        const {
            snapshot,
            bestInchargeId,
            rotationSuggestion,
            weekStart,
            weekEnd
        } = await buildWeeklySnapshot(new Date())

        if (shouldSave) {
            await saveWeeklyReport(new Date())
        }

        const dateRange = `${weekStart.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        })} – ${weekEnd.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        })}`

        const sorted = [...snapshot.users].sort(
            (a, b) => b.totalPoints - a.totalPoints
        )

        const leaderboardLines = sorted.map((u: UserWeeklyStat, i: number) => {
            const badges = [
                u.coverChores > 0 ? `🌟 ${u.coverChores} cover` : null,
                u.praiseReceived > 0 ? `💛 ${u.praiseReceived} praise` : null
            ]
                .filter(Boolean)
                .join(' • ')

            return (
                `> ${medal(i)} <@${u.discordUserId}>${
                    u.areaName ? ` *(${u.areaName})*` : ''
                }\n` +
                `> \`${u.totalPoints}pts\` • ${u.choresCompleted} chores${
                    badges ? ` • ${badges}` : ''
                }`
            )
        })

        const header = new TextDisplayBuilder().setContent(
            `## 📊 Weekly Report\n📅 ${dateRange}${
                shouldSave ? '  •  ✅ Saved' : ''
            }`
        )

        const leaderboard = new TextDisplayBuilder().setContent(
            `**🏆 Leaderboard**\n` +
                (leaderboardLines.length > 0
                    ? leaderboardLines.join('\n')
                    : '> *No activity this week*')
        )

        const stats = new TextDisplayBuilder().setContent(
            `**📈 Week Stats**\n` +
                `> 🧹 **${snapshot.totalChoresCompleted}** chores completed\n` +
                `> ⭐ **${snapshot.totalPointsAwarded}** total points awarded`
        )

        const bestSection = new TextDisplayBuilder().setContent(
            bestInchargeId
                ? `**🌟 Best Incharge**\n> ${userMention(
                      bestInchargeId
                  )} — outstanding work this week!`
                : `**🌟 Best Incharge**\n> *No incharge data available*`
        )

        const rotationSection = new TextDisplayBuilder().setContent(
            `**🔄 Rotation Suggestion**\n> ${
                rotationSuggestion ?? '*No rotation needed*'
            }`
        )

        const container = new ContainerBuilder()
            .addTextDisplayComponents(header)
            .addSeparatorComponents(sep())
            .addTextDisplayComponents(leaderboard)
            .addSeparatorComponents(sep())
            .addTextDisplayComponents(stats)
            .addSeparatorComponents(sep())
            .addTextDisplayComponents(bestSection)
            .addSeparatorComponents(sep())
            .addTextDisplayComponents(rotationSection)
            .setAccentColor(0x5865f2)

        await interaction.editReply({
            components: [container],
            flags: MessageFlags.IsComponentsV2
        })
    }
})
