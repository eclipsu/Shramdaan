import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn
} from 'typeorm'
import { Area } from './Area.js'
import { User } from './User.js'

export enum RotationStatus {
    UPCOMING = 'upcoming',
    CURRENT = 'current',
    PAST = 'past'
}

@Entity('area_rotations')
export class AreaRotation {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column()
    areaId: string

    @Column()
    userId: string

    @Column({ type: 'timestamptz' })
    startsAt: Date

    @Column({ type: 'timestamptz' })
    endsAt: Date

    @Column({ default: false })
    isCurrent: boolean

    @ManyToOne(() => Area, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'areaId' })
    area: Area

    @ManyToOne(() => User, {
        onDelete: 'CASCADE'
    })
    @JoinColumn({ name: 'userId' })
    roomates: User
}
