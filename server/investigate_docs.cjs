const sql = require('mssql');
const dotenv = require('dotenv');

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

async function investigate() {
    try {
        const pool = await sql.connect(dbConfig);
        
        console.log('--- Investigating max numero_doc in fact_ventas ---');
        const maxDocRes = await pool.request().query('SELECT MAX(numero_doc) as maxDoc FROM fact_ventas');
        console.log('Max numero_doc:', maxDocRes.recordset[0].maxDoc);

        console.log('\n--- Investigating usp_Utils_GetNextCode definition ---');
        const spDefRes = await pool.request().query(`
            SELECT definition 
            FROM sys.sql_modules 
            WHERE object_id = OBJECT_ID('usp_Utils_GetNextCode')
        `);
        
        if (spDefRes.recordset.length > 0) {
            console.log('SP Definition:\n', spDefRes.recordset[0].definition);
        } else {
            console.log('SP usp_Utils_GetNextCode not found in sys.sql_modules');
        }

        await pool.close();
    } catch (err) {
        console.error('Error during investigation:', err);
    }
}

investigate();
