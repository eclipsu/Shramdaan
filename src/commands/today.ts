import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    EmbedBuilder
} from 'discord.js'
import ApplicationCommand from '../templates/ApplicationCommand.js'

import { findAllAreas } from '../repositories/AreaRepository.js'
import { getChoresByAreaForToday } from '../repositories/ChoreRepository.js'

const areas = await findAllAreas()

export default new ApplicationCommand({
    data: new SlashCommandBuilder()
        .setName('today')
        .setDescription("Choose what area's todos you want to see")
        .addStringOption((o) =>
            o
                .setName('area')
                .setDescription('Which area to check')
                .setRequired(true)
                .setAutocomplete(true)
        ),

    async autocomplete(interaction) {
        const focused = interaction.options.getFocused().toLowerCase()

        const filtered = areas
            .filter((a) => a.name.toLowerCase().includes(focused))
            .slice(0, 25)

        await interaction.respond(
            filtered.map((a) => ({ name: a.name, value: a.id }))
        )
    },

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        await interaction.deferReply({ ephemeral: false })

        const areaId: string = interaction.options.getString('area', true)
        const today: Date = new Date()

        const { completed, due } = await getChoresByAreaForToday(areaId, today)

        const area = areas.find((a) => a.id === areaId)
        const areaName = area?.name ?? 'Unknown Area'

        const dateStr = today.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })

        const totalPoints = completed.reduce(
            (sum, c) => sum + c.pointsAwarded,
            0
        )
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

        const embed = new EmbedBuilder()
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
                    name: `Due (${due.length}) — ${duePoints}pts remaining to be claimed`,
                    value: dueField
                }
            )
            .setFooter({
                text: `${completed.length}/${
                    completed.length + due.length
                } chores done`
            })
            .setTimestamp()

        await interaction.editReply({ embeds: [embed] })
    }
})
