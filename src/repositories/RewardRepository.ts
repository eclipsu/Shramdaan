import { User } from '../entities/User.js'
import { AppDataSource } from '../database.js'
import { Reward } from '../entities/Reward.js'
import { RedemptionStatus, Redemption } from '../entities/Redemption.js'

const repo = () => AppDataSource.getRepository(Reward)

export async function createReward(data: {
    name: string
    description: string
    pointsCost: number
    createdById: string // discord user id
}): Promise<Reward> {
    const user = await AppDataSource.getRepository(User).findOne({
        where: { discordUserId: data.createdById }
    })
    if (!user) throw new Error('User not found')

    const reward = repo().create({
        name: data.name,
        description: data.description,
        pointsCost: data.pointsCost,
        createdBy: user
    })
    return repo().save(reward)
}
export async function redeemReward(data: {
    userId: string
    rewardId: string
}): Promise<Redemption> {
    return AppDataSource.transaction(async (manager) => {
        const user = await manager.findOne(User, {
            where: { discordUserId: data.userId }
        })
        if (!user) throw new Error('User not found')

        const reward = await manager.findOne(Reward, {
            where: { id: data.rewardId, isActive: true }
        })
        if (!reward) throw new Error('Reward not found')

        if (user.points < reward.pointsCost)
            throw new Error('Not enough points')

        user.points -= reward.pointsCost
        await manager.save(user)

        const redemption = manager.create(Redemption, {
            user,
            reward,
            status: RedemptionStatus.PENDING
        })

        return manager.save(redemption)
    })
}

export async function getAllRewards(): Promise<Reward[]> {
    return repo().find({ where: { isActive: true } })
}
