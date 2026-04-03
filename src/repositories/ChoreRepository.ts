// import { AppDataSource } from '../database.js'
// import { Chore } from '../entities/Chore.js'

// const repo = () => AppDataSource.getRepository(Chore)

// export async function createChore(data: {
//     area: 'Kitchen' | 'Hall/Living Room' | 'Washroom' | 'Misc'
//     name: string
//     createdBy: string
//     basePoints: number
//     frequency: 'Everyday' | 'Weekly'
// }): Promise<Chore> {
//     const chore = repo().create(data)
//     return repo().save(chore)
// }

// export async function findChoreById(id: number): Promise<Chore | null> {
//     return repo().findOne({
//         where: { id },
//         relations: ['assignments', 'assignments.user']
//     })
// }

// export async function findChoreByName(name: string): Promise<Chore | null> {
//     return repo().findOne({
//         where: { name },
//         relations: ['assignments', 'assignments.user']
//     })
// }

// export async function getAllActiveChores(): Promise<Chore[]> {
//     return repo().find({
//         where: { isActive: true },
//         relations: ['assignments', 'assignments.user']
//     })
// }

// export async function getChoresByArea(
//     area: 'Kitchen' | 'Hall/Living Room' | 'Washroom' | 'Misc'
// ): Promise<Chore[]> {
//     return repo().find({
//         where: { isActive: true, area },
//         relations: ['assignments', 'assignments.user']
//     })
// }

// export async function updateChore(
//     id: number,
//     data: Partial<Chore>
// ): Promise<void> {
//     await repo().update({ id }, data)
// }

// export async function deactivateChore(id: number): Promise<void> {
//     await repo().update({ id }, { isActive: false })
// }
