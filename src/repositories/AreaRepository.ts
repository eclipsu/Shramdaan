import { AppDataSource } from '../database.js'
import { Area } from '../entities/Area.js'

const repo = () => AppDataSource.getRepository(Area)

export async function createArea(data: { name: string }): Promise<Area> {
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
