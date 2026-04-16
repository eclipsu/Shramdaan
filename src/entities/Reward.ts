import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne
} from 'typeorm'
import { User } from './User.js'

@Entity('rewards')
export class Reward {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({ type: 'varchar' })
    name: string

    @Column({ type: 'varchar', nullable: true })
    description: string

    @ManyToOne(() => User, { eager: true })
    createdBy: User

    @Column()
    pointsCost: number

    @Column({ default: true })
    isActive: boolean

    @CreateDateColumn()
    createdAt: Date
}
