import pg from 'pg'
import 'dotenv/config'

const { Pool } = pg

const db = new Pool({
    connectionString: process.env.DATABASE_URL,
  
    ssl: {
        rejectUnauthorized: false
    },
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    family: 4
})


  console.log("qweqwe" , process.env.DATABASE_URL)

db.on('connect', () => {
    console.log('PostgreSQL connected')
})

db.on('error', (err) => {
    console.error('PostgreSQL error:', err)
})

export default db