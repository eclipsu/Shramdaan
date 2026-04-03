import 'reflect-metadata'
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Relation
} from 'typeorm'

import { Chore } from './Chore.js'
import { User } from './User.js'

@Entity('chore_completions')
export class ChoreCompletion {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column()
    choreId: string

    @Column()
    completedById: string

    @Column()
    inchargeId: string

    @Column({ default: false })
    isCover: boolean

    @Column()
    pointsAwarded: number

    @Column({ default: false })
    penalized: boolean

    @CreateDateColumn()
    completedAt: Date

    @ManyToOne(() => Chore, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'choreId' })
    chore: Relation<Chore>

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'completedById' })
    completedBy: Relation<User>

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'inchargeId' })
    incharge: Relation<User>
}
