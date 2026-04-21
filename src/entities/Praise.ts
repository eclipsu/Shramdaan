import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    CreateDateColumn
} from 'typeorm'
import { User } from './User.js'

@Entity()
export class Praise {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @ManyToOne(() => User, { eager: true })
    fromUser: User

    @ManyToOne(() => User, { eager: true })
    toUser: User

    @Column('text')
    reason: string

    @Column('int', { default: 20 })
    pointsAwarded: number

    @CreateDateColumn()
    createdAt: Date
}
