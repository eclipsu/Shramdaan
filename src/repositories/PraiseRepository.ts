import { AppDataSource } from '../database.js'
import { Praise } from '../entities/Praise.js'
import { User } from '../entities/User.js'
import { getOrCreateUser } from './UserRepository.js'

const repo = AppDataSource.getRepository(Praise)

export async function givePraise({
    fromDiscordId,
    toDiscordId,
    reason
}: {
    fromDiscordId: string
    toDiscordId: string
    reason: string
}): Promise<Praise> {
    if (fromDiscordId === toDiscordId) {
        throw new Error("You can't praise yourself!")
    }

    return await repo.manager.transaction(async (manager) => {
        const fromUser = await getOrCreateUser(fromDiscordId)
        const toUser = await getOrCreateUser(toDiscordId)

        const POINTS = 20

        await manager.update(
            User,
            { id: toUser.id },
            {
                points: () => `points + ${POINTS}`
            }
        )

        const praise = manager.create(Praise, {
            fromUser,
            toUser: { ...toUser, points: toUser.points + POINTS },
            reason,
            pointsAwarded: POINTS
        })

        return await manager.save(praise)
    })
}
