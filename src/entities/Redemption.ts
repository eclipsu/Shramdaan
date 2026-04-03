import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn
} from 'typeorm'
import { User } from './User.js'
import { Reward } from './Reward.js'

export enum RedemptionStatus {
    PENDING = 'pending',
    FULFILLED = 'fulfilled',
    REJECTED = 'rejected'
}

@Entity('redemptions')
export class Redemption {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column()
    userId: string

    @Column()
    rewardId: string

    @Column({
        type: 'enum',
        enum: RedemptionStatus,
        default: RedemptionStatus.PENDING
    })
    status: RedemptionStatus

    @Column({ nullable: true })
    rejectionReason: string

    @CreateDateColumn()
    redeemedAt: Date

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User

    @ManyToOne(() => Reward, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'rewardId' })
    reward: Reward
}
