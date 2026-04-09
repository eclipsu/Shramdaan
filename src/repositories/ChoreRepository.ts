import { AppDataSource } from '../database.js'
import { Chore } from '../entities/Chore.js'
import { ChoreCompletion } from '../entities/ChoresCompletion.js'
import { User } from '../entities/User.js'

const repo = () => AppDataSource.getRepository(Chore)
export enum ChoreRecurrence {
    DAILY = 'daily',
    WEEKLY = 'weekly',
    BIWEEKLY = 'biweekly'
}

export async function createChore(data: {
    name: string
    areaId: string
    points: number
    recurrence: ChoreRecurrence
}): Promise<Chore> {
    const chore = repo().create(data)
    return repo().save(chore)
}

export async function deleteChore(data: { id: string }): Promise<void> {
    await repo().delete({ id: data.id })
}

export async function findAllChoresByArea(areaId: string): Promise<Chore[]> {
    return await repo().find({
        where: { area: { id: areaId } },
        relations: ['area'],
        order: { name: 'ASC' }
    })
}

export async function findChoresAsIncharge(
    discordId: string
): Promise<Chore[]> {
    const chores = repo()
        .createQueryBuilder('chore')
        .innerJoin('chore.area', 'area')
        .innerJoin('area_rotations', 'rotation', 'rotation.areaId = area.id')
        .innerJoin(
            'roomates',
            'user',
            'user.id = rotation.userId AND user.discordUserId = :discordId',
            { discordId }
        )
        .where('rotation.isCurrent = true')
        .leftJoinAndSelect('chore.area', 'choreArea')
        .addSelect([
            'user.id',
            'user.discordUserId',
            'user.isAdmin',
            'user.points'
        ])
        .getMany()
    return await chores
}

export function markCompleted(data: {
    choreId: string
    inchargeId: string
    isCover: boolean
    completedById: string
    pointsAwarded: number
}): Promise<ChoreCompletion> {
    return AppDataSource.transaction(async (manager) => {
        // Add to come history
        const completion = manager.getRepository(ChoreCompletion).create({
            choreId: data.choreId,
            completedById: data.completedById,
            inchargeId: data.inchargeId,
            isCover: data.isCover,
            pointsAwarded: data.pointsAwarded
        })
        await manager.save(completion)

        // update point for user
        await manager
            .getRepository(User)
            .increment({ id: data.completedById }, 'points', data.pointsAwarded)

        return completion
    })
}

export async function getChoresByAreaForToday(
    areaId: string,
    date: Date
): Promise<{ completed: ChoreCompletion[]; due: Chore[] }> {
    const allChores: Chore[] = await AppDataSource.getRepository(Chore)
        .createQueryBuilder('chore')
        .where('chore.areaId = :areaId', { areaId })
        .getMany()

    const completedChores: ChoreCompletion[] =
        await AppDataSource.getRepository(ChoreCompletion)
            .createQueryBuilder('completion')
            .innerJoinAndSelect('completion.chore', 'chore')
            .where('chore.areaId = :areaId', { areaId })
            .andWhere('DATE(completion.completedAt) = DATE(:date)', { date })
            .getMany()

    const completedChoreIds = new Set(completedChores.map((c) => c.choreId))
    const due: Chore[] = allChores.filter((c) => !completedChoreIds.has(c.id))

    return { completed: completedChores, due }
}
