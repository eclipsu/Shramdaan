import { AppDataSource } from '../database.js'
import { Redemption } from '../entities/Redemption.js'
import { RedemptionStatus } from '../entities/Redemption.js'
const repo = () => AppDataSource.getRepository(Redemption)

export async function getAllRedemption(
    serverId?: string
): Promise<Redemption[]> {
    serverId
    const redemption = repo().find({
        where: { status: RedemptionStatus.PENDING },
        relations: ['user', 'reward']
    })
    return redemption
}
