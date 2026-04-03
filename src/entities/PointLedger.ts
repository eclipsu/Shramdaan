import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn
} from 'typeorm'
import { User } from './User.js'

export enum LedgerRefType {
    CHORE_COMPLETION = 'chore_completion',
    COVER = 'cover',
    PENALTY = 'penalty',
    REDEMPTION = 'redemption',
    REDEMPTION_REFUND = 'redemption_refund',
    ADMIN_GRANT = 'admin_grant',
    ADMIN_DEDUCT = 'admin_deduct',
    ROTATION_PENALTY = 'rotation_penalty'
}

@Entity('point_ledger')
export class PointLedger {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column()
    userId: string

    // Positive = earned, Negative = deducted
    @Column()
    amount: number

    @Column()
    reason: string

    @Column({ type: 'enum', enum: LedgerRefType })
    refType: LedgerRefType

    // UUID of the related row (completion id, redemption id, etc)
    @Column({ nullable: true })
    refId: string

    @CreateDateColumn()
    createdAt: Date

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User
}
