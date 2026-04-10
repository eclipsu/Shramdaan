import { AppDataSource } from '../database.js'
import { AreaRotation } from '../entities/AreaRotations.js'

const rotationRepo = () => AppDataSource.getRepository(AreaRotation)

function getNextSunday(from: Date = new Date()): Date {
    const date = new Date(from)
    const daysUntilSunday = (7 - date.getDay()) % 7 || 7
    date.setDate(date.getDate() + daysUntilSunday)
    date.setHours(23, 59, 59, 0)
    return date
}

export async function getCurrentRotation(
    areaId: string
): Promise<AreaRotation | null> {
    return rotationRepo().findOne({
        where: { areaId, isCurrent: true },
        relations: ['roomates']
    })
}

export async function claimArea(
    areaId: string,
    userId: string
): Promise<AreaRotation> {
    const now = new Date()

    return AppDataSource.transaction(async (manager) => {
        const repo = manager.getRepository(AreaRotation)

        await repo.update(
            { areaId, isCurrent: true },
            { isCurrent: false, endsAt: now }
        )

        const rotation = repo.create({
            areaId,
            userId,
            isCurrent: true,
            startsAt: now,
            endsAt: getNextSunday(now)
        })

        return repo.save(rotation)
    })
}
