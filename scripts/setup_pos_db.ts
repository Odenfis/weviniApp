import sql from 'mssql';
import dotenv from 'dotenv';
import fs from 'fs';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_DATABASE,
    port: parseInt(process.env.DB_PORT || '1434'),
    options: {
        encrypt: false,
        trustServerCertificate: true,
    },
};

async function run() {
    try {
        const pool = await sql.connect(dbConfig);
        console.log('Connected to SQL Server');
        
        const sqlFile = path.join(__dirname, '../docs/pos_implementation.sql');
        const sqlScript = fs.readFileSync(sqlFile, 'utf8');
        
        // MSSQL doesn't support 'GO' in a single request. 
        // We need to split by 'GO' and execute each part.
        const parts = sqlScript.split(/\s*GO\s*/i).filter(p => p.trim().length > 0);
        
        for (const part of parts) {
            await pool.request().query(part);
            console.log('Executed segment...');
        }
        
        console.log('SQL Implementation completed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Error executing SQL:', err);
        process.exit(1);
    }
}

run();
