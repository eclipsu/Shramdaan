// import {
//     SlashCommandBuilder,
//     ChatInputCommandInteraction,
//     PermissionFlagsBits
// } from 'discord.js'
// import ApplicationCommand from '../templates/ApplicationCommand.js'
// import {
//     createChore,
//     findChoreByName
// } from '../repositories/ChoreRepository.js'

// export default new ApplicationCommand({
//     data: new SlashCommandBuilder()
//         .setName('addchore')
//         .setDescription('Add a new chore')
//         .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
//         .addStringOption((o) =>
//             o
//                 .setName('area') // fix: matches entity column name
//                 .setDescription('Where is this chore performed?')
//                 .setRequired(true)
//                 .addChoices(
//                     { name: 'Kitchen', value: 'Kitchen' },
//                     { name: 'Hall/Living Room', value: 'Hall/Living Room' },
//                     { name: 'Washroom', value: 'Washroom' },
//                     { name: 'Misc', value: 'Misc' }
//                 )
//         )
//         .addStringOption((o) =>
//             o
//                 .setName('name') // fix: lowercase
//                 .setDescription('Name of the task')
//                 .setRequired(true)
//         )
//         .addIntegerOption((o) =>
//             o
//                 .setName('points') // fix: lowercase
//                 .setDescription('Base points (X value)')
//                 .setRequired(true)
//         )
//         .addStringOption((o) =>
//             o
//                 .setName('frequency') // fix: required by entity, was missing
//                 .setDescription('How often is this chore performed?')
//                 .setRequired(true)
//                 .addChoices(
//                     { name: 'Everyday', value: 'Everyday' },
//                     { name: 'Weekly', value: 'Weekly' }
//                 )
//         )
//         .addStringOption((o) =>
//             o
//                 .setName('description')
//                 .setDescription('Description of the task')
//                 .setRequired(false)
//         ),

//     async execute(interaction: ChatInputCommandInteraction): Promise<void> {
//         await interaction.deferReply({ ephemeral: true })

//         const area = interaction.options.getString('area', true) as
//             | 'Kitchen'
//             | 'Hall/Living Room'
//             | 'Washroom'
//             | 'Misc'
//         const name = interaction.options.getString('name', true)
//         const points = interaction.options.getInteger('points', true)
//         const frequency = interaction.options.getString('frequency', true) as
//             | 'Everyday'
//             | 'Weekly'
//         const description =
//             interaction.options.getString('description') ?? undefined

//         // check duplicate
//         const existing = await findChoreByName(name)
//         if (existing) {
//             await interaction.editReply({
//                 content: `A chore named **${name}** already exists.`
//             })
//             return
//         }

//         const chore = await createChore({
//             area,
//             name,
//             createdBy: interaction.user.tag,
//             basePoints: points,
//             frequency
//         })

//         console.log('Ya pugyo')

//         await interaction.editReply({
//             content: `Chore **${chore.name}** added successfully!`
//         })
//     }
// })
