import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn
} from 'typeorm'

@Entity('roomates')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column()
    discordUserId: string

    @Column({ default: false })
    isAdmin: boolean

    @Column({ default: 0 })
    points: number

    @Column({ default: true })
    notifyReminders: boolean

    @Column({ default: true })
    notifyDigest: boolean

    @Column({ default: true })
    notifyCoverRequests: boolean

    @Column({ default: true })
    notifyOnPenalty: boolean

    @CreateDateColumn()
    joinedAt: Date
}
