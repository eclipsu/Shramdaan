import { AppDataSource } from '../database.js'
import { User } from '../entities/User.js'

const repo = AppDataSource.getRepository(User)

export async function createUser(
    discordUserId: string,
    isAdmin: boolean = false
): Promise<User> {
    const user = repo.create({ discordUserId, isAdmin })
    await repo.save(user)
    return user
}

export async function findUserByDiscordId(
    discordUserId: string
): Promise<User | null> {
    return repo.findOne({
        where: { discordUserId }
    })
}

export async function getOrCreateUser(discordUserId: string) {
    let user = await repo.findOne({ where: { discordUserId } })

    if (!user) {
        user = repo.create({ discordUserId })
        await repo.save(user)
    }

    return user
}
