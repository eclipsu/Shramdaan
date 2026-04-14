import { AppDataSource } from '../database.js'
import { Area } from '../entities/Area.js'
import { AreaRotation } from '../entities/AreaRotations.js'

const repo = () => AppDataSource.getRepository(Area)
const areaRotationRepo = () => AppDataSource.getRepository(AreaRotation)

export async function createArea(data: {
    name: string
    discordChannelId: string
}): Promise<Area> {
    const area = repo().create(data)
    return repo().save(area)
}

export async function findAllAreas(): Promise<Area[]> {
    return repo().find()
}

export async function deleteArea(id: string): Promise<void> {
    await repo().delete({ id })
}

export async function findAreaById(id: string): Promise<Area | null> {
    return repo().findOne({ where: { id } })
}

export async function findAreaByName(name: string): Promise<Area | null> {
    return repo().findOne({
        where: { name }
    })
}

export async function getAreasUserIsInChargeOf(userId: string): Promise<
    {
        name: string
        startsAt: string
        endsAt: string
    }[]
> {
    const rotations = await areaRotationRepo()
        .createQueryBuilder('rotation')
        .innerJoinAndSelect('rotation.area', 'area')
        .where('rotation.userId = :userId', { userId })
        .andWhere('rotation.isCurrent = true')
        .getMany()

    return rotations.map((r) => ({
        name: r.area.name,
        startsAt: r.startsAt.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }),
        endsAt: r.endsAt.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }))
}
