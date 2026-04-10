import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    OneToMany
} from 'typeorm'
import { Chore } from './Chore.js'

@Entity('areas')
export class Area {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column()
    name: string

    @Column({ type: 'varchar', nullable: true })
    discordChannelId: string

    @CreateDateColumn()
    createdAt: Date

    @OneToMany(() => Chore, (chore) => chore.area)
    chores: Chore[]
}
