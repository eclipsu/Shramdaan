// import {
//     SlashCommandBuilder,
//     ChatInputCommandInteraction,
//     EmbedBuilder
// } from 'discord.js'
// import ApplicationCommand from '../templates/ApplicationCommand.js'
// import { findUser, getLeaderboard } from '../repositories/UserRepository.js'

// export default new ApplicationCommand({
//     data: new SlashCommandBuilder()
//         .setName('points')
//         .setDescription('View points for a user or leaderboard')
//         .addUserOption((o) =>
//             o
//                 .setName('user')
//                 .setDescription('User to view points for')
//                 .setRequired(false)
//         ),

//     async execute(interaction: ChatInputCommandInteraction): Promise<void> {
//         await interaction.deferReply()

//         const discordUser = interaction.options.getUser('user')

//         // no user specified — show leaderboard
//         if (!discordUser) {
//             const leaderboard = await getLeaderboard(10)

//             if (leaderboard.length === 0) {
//                 await interaction.editReply({ content: 'No points data yet.' })
//                 return
//             }

//             const embed = new EmbedBuilder()
//                 .setTitle('🏆 Points Leaderboard')
//                 .setColor(0xfee75c)
//                 .setTimestamp()
//                 .setDescription(
//                     leaderboard
//                         .map(
//                             (u, i) =>
//                                 `**${i + 1}.** <@${u.discordId}> — ${
//                                     u.totalPoints
//                                 } pts (this week: ${u.weeklyPoints})`
//                         )
//                         .join('\n')
//                 )

//             await interaction.editReply({ embeds: [embed] })
//             return
//         }

//         // specific user
//         const user = await findUser(discordUser.id)
//         if (!user) {
//             await interaction.editReply({
//                 content: `No data found for <@${discordUser.id}>.`
//             })
//             return
//         }

//         const embed = new EmbedBuilder()
//             .setTitle(`📊 Points — ${discordUser.username}`)
//             .setColor(0x5865f2)
//             .setTimestamp()
//             .addFields(
//                 {
//                     name: 'Total Points',
//                     value: String(user.totalPoints),
//                     inline: true
//                 },
//                 {
//                     name: 'This Week',
//                     value: String(user.weeklyPoints),
//                     inline: true
//                 },
//                 {
//                     name: 'Weekly Streak',
//                     value: `${user.weeklyStreak} weeks`,
//                     inline: true
//                 },
//                 {
//                     name: 'Warnings',
//                     value: String(user.warningCount),
//                     inline: true
//                 },
//                 {
//                     name: 'Rewards',
//                     value: String(user.rewardCount),
//                     inline: true
//                 }
//             )

//         await interaction.editReply({ embeds: [embed] })
//     }
// })
