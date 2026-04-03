import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn
} from 'typeorm'

export enum RewardType {
    COOK = 'cook',
    THERMOSTAT = 'thermostat',
    LAUNDRY = 'laundry'
}

@Entity('rewards')
export class Reward {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column()
    name: string

    @Column({ type: 'enum', enum: RewardType })
    type: RewardType

    @Column()
    pointsCost: number

    @Column({ default: true })
    isActive: boolean

    @CreateDateColumn()
    createdAt: Date
}
