import {
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    PermissionFlagsBits,
    EmbedBuilder,
    ActionRowBuilder
} from 'discord.js'
import ApplicationCommand from '../templates/ApplicationCommand.js'
import {
    createArea,
    deleteArea,
    findAreaByName,
    findAllAreas
} from '../repositories/AreaRepository.js'
import { ButtonBuilder } from '@discordjs/builders'

export default new ApplicationCommand({
    data: new SlashCommandBuilder()
        .setName('area')
        .setDescription('Area commands')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand((sub) =>
            sub
                .setName('create')
                .setDescription('Create a new area')
                .addStringOption((o) =>
                    o
                        .setName('name')
                        .setDescription(
                            'Area name e.g. Kitchen, Bathroom, Hallway'
                        )
                        .setRequired(true)
                )
        )

        .addSubcommand((sub) =>
            sub
                .setName('delete')
                .setDescription('Delete an area and all its chores')
                .addStringOption((o) =>
                    o
                        .setName('name')
                        .setDescription('Name of the area to delete')
                        .setRequired(true)
                )
        )
        .addSubcommand((sub) =>
            sub
                .setName('claim')
                .setDescription('Claim responsibility for an area for the week')
        ),

    async execute(interaction: ChatInputCommandInteraction): Promise<void> {
        await interaction.deferReply({ ephemeral: true })

        const sub = interaction.options.getSubcommand()

        if (sub === 'create') {
            const name = interaction.options.getString('name', true).trim()

            const existing = await findAreaByName(name)
            if (existing) {
                await interaction.editReply({
                    content: `An area named ${name}* already exists.`
                })
                return
            }

            const area = await createArea({
                name
            })

            const embed = new EmbedBuilder()
                .setColor(0x378add)
                .setTitle(`Area created — ${area.name}`)
                .setDescription(
                    'No incharge yet. Members can claim with `/area claim`.'
                )
                .setTimestamp()

            await interaction.editReply({ embeds: [embed] })
            return
        }

        if (sub === 'delete') {
            const name = interaction.options.getString('name', true).trim()

            const existing = await findAreaByName(name)
            if (!existing) {
                await interaction.editReply({
                    content: `No area named **${name}** was found.`
                })
                return
            }

            await deleteArea(existing.id)

            const embed = new EmbedBuilder()
                .setColor(0xe24b4a)
                .setTitle('Area deleted')
                .setDescription(
                    `**${name}** and all its chores have been removed.`
                )
                .setTimestamp()

            await interaction.editReply({ embeds: [embed] })
            return
        }

        if (sub === 'claim') {
            const areas = await findAllAreas()
            const row = new ActionRowBuilder()

            areas.forEach((area) => {
                row.components.push(
                    new ButtonBuilder()
                        .setCustomId(area.id)
                        .setLabel(area.name)
                        .setStyle(1)
                )
            })
            console.log(areas)
            await interaction.editReply({
                content:
                    'Claiming not implemented yet. Available areas:\n' +
                    areas.map((a) => `- ${a.name}`).join('\n'),
                components: []
            })
            return
        }
    }
})
