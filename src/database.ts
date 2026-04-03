import 'reflect-metadata'
import 'dotenv/config'
import { DataSource } from 'typeorm'
import { User } from './entities/User.js'
import { Chore } from './entities/Chore.js'
import { Area } from './entities/Area.js'
import { AreaRotation } from './entities/AreaRotations.js'
import { ChoreCompletion } from './entities/ChoresCompletion.js'
import { Reward } from './entities/Reward.js'
import { Redemption } from './entities/Redemption.js'
import { PointLedger } from './entities/PointLedger.js'


export const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    synchronize: true, // REMINDER: turn off in production
    logging: false,
    entities: [User, Chore, Area, AreaRotation, ChoreCompletion, Reward, Redemption, PointLedger],
})
