import { AppDataSource } from '../database.js'
import {
    WeeklyReport,
    WeeklySnapshot,
    UserWeeklyStat
} from '../entities/WeeklyReport.js'
import { ChoreCompletion } from '../entities/ChoresCompletion.js'
import { Praise } from '../entities/Praise.js'
import { Redemption } from '../entities/Redemption.js'
import { AreaRotation } from '../entities/AreaRotations.js'
import { User } from '../entities/User.js'

const repo = AppDataSource.getRepository(WeeklyReport)

function getWeekBounds(date: Date): { weekStart: Date; weekEnd: Date } {
    const weekStart = new Date(date)
    weekStart.setDate(date.getDate() - date.getDay() + 1)
    weekStart.setHours(0, 0, 0, 0)

    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)

    return { weekStart, weekEnd }
}

export async function buildWeeklySnapshot(date: Date): Promise<{
    snapshot: WeeklySnapshot
    bestInchargeId: string | null
    rotationSuggestion: string | null
    weekStart: Date
    weekEnd: Date
}> {
    const { weekStart, weekEnd } = getWeekBounds(date)

    const manager = AppDataSource.manager

    const users = await manager.find(User)

    const completions = await manager
        .createQueryBuilder(ChoreCompletion, 'cc')
        .leftJoinAndSelect('cc.completedBy', 'user')
        .leftJoinAndSelect('cc.chore', 'chore')
        .leftJoinAndSelect('chore.area', 'area')
        .where('cc.completedAt BETWEEN :weekStart AND :weekEnd', {
            weekStart,
            weekEnd
        })
        .getMany()

    const praises = await manager
        .createQueryBuilder(Praise, 'p')
        .leftJoinAndSelect('p.fromUser', 'fromUser')
        .leftJoinAndSelect('p.toUser', 'toUser')
        .where('p.createdAt BETWEEN :weekStart AND :weekEnd', {
            weekStart,
            weekEnd
        })
        .getMany()

    const redemptions = await manager
        .createQueryBuilder(Redemption, 'r')
        .leftJoinAndSelect('r.user', 'user')
        .where('r.redeemedAt BETWEEN :weekStart AND :weekEnd', {
            weekStart,
            weekEnd
        })
        .getMany()

    const currentRotations = await manager
        .createQueryBuilder(AreaRotation, 'ar')
        .leftJoinAndSelect('ar.roomates', 'user')
        .leftJoinAndSelect('ar.area', 'area')
        .where('ar.isCurrent = true')
        .getMany()

    const rotationByUserId = new Map(currentRotations.map((r) => [r.userId, r]))

    const userStats: UserWeeklyStat[] = users.map((user) => {
        const userCompletions = completions.filter(
            (c) => c.completedById === user.id
        )
        const rotation = rotationByUserId.get(user.id)

        return {
            discordUserId: user.discordUserId,
            displayName: user.discordUserId,
            totalPoints: userCompletions.reduce(
                (sum, c) => sum + c.pointsAwarded,
                0
            ),
            choresCompleted: userCompletions.length,
            coverChores: userCompletions.filter((c) => c.isCover).length,
            praiseGiven: praises.filter((p) => p.fromUser?.id === user.id)
                .length,
            praiseReceived: praises.filter((p) => p.toUser?.id === user.id)
                .length,
            redemptions: redemptions.filter((r) => r.userId === user.id).length,
            isCurrentIncharge: !!rotation,
            areaName: rotation?.area?.name ?? null
        }
    })

    const inchargeStats = userStats.filter((u) => u.isCurrentIncharge)
    const bestIncharge =
        inchargeStats.sort((a, b) => b.totalPoints - a.totalPoints)[0] ?? null

    const worstIncharge =
        inchargeStats.sort((a, b) => a.totalPoints - b.totalPoints)[0] ?? null
    const topNonIncharge =
        userStats
            .filter((u) => !u.isCurrentIncharge)
            .sort((a, b) => b.totalPoints - a.totalPoints)[0] ?? null

    let rotationSuggestion: string | null = null
    if (worstIncharge && topNonIncharge) {
        rotationSuggestion =
            `Consider rotating <@${worstIncharge.discordUserId}> (${worstIncharge.areaName}) ` +
            `with <@${topNonIncharge.discordUserId}> who had a strong week.`
    }

    const snapshot: WeeklySnapshot = {
        users: userStats.filter(
            (u) => u.choresCompleted > 0 || u.praiseReceived > 0
        ),
        totalChoresCompleted: completions.length,
        totalPointsAwarded: completions.reduce(
            (sum, c) => sum + c.pointsAwarded,
            0
        )
    }

    const bestInchargeUser = bestIncharge
        ? users.find((u) => u.discordUserId === bestIncharge.discordUserId) ??
          null
        : null

    return {
        snapshot,
        bestInchargeId: bestInchargeUser?.id ?? null,
        rotationSuggestion,
        weekStart,
        weekEnd
    }
}

export async function saveWeeklyReport(date: Date): Promise<WeeklyReport> {
    const { snapshot, bestInchargeId, rotationSuggestion, weekStart, weekEnd } =
        await buildWeeklySnapshot(date)

    const report = repo.create({
        weekStart,
        weekEnd,
        snapshot,
        bestInchargeId,
        rotationSuggestion
    })

    return await repo.save(report)
}

export async function getLatestReport(): Promise<WeeklyReport | null> {
    return await repo.findOne({
        order: { createdAt: 'DESC' },
        relations: ['bestIncharge']
    })
}
