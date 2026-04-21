import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn
} from 'typeorm'
import { User } from './User.js'

@Entity('weekly_reports')
export class WeeklyReport {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({ type: 'timestamptz' })
    weekStart: Date

    @Column({ type: 'timestamptz' })
    weekEnd: Date

    @Column({ type: 'jsonb' })
    snapshot: WeeklySnapshot

    @Column({ type: 'varchar', nullable: true })
    bestInchargeId: string | null

    @Column({ type: 'varchar', nullable: true })
    rotationSuggestion: string | null

    @CreateDateColumn()
    createdAt: Date

    @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'bestInchargeId' })
    bestIncharge: User | null
}

export interface UserWeeklyStat {
    discordUserId: string
    displayName: string
    totalPoints: number
    choresCompleted: number
    coverChores: number
    praiseGiven: number
    praiseReceived: number
    redemptions: number
    isCurrentIncharge: boolean
    areaName: string | null
}

export interface WeeklySnapshot {
    users: UserWeeklyStat[]
    totalChoresCompleted: number
    totalPointsAwarded: number
}
