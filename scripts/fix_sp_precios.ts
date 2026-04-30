import sql from 'mssql';
import dotenv from 'dotenv';

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
        await pool.request().query(`
            CREATE OR ALTER PROCEDURE [dbo].[usp_Precios_GetByProd]
                @id_prod INT
            AS
            BEGIN
                SET NOCOUNT ON;
                SELECT 
                    p.id_precio, 
                    p.id_producto, 
                    p.Nombre,
                    p.presentacion, 
                    p.cantidad_base, 
                    p.precio_venta, 
                    p.precio_compra, 
                    p.id_unidad,
                    u.codigo AS codigo_unidad
                FROM [dbo].[dim_producto_precios] p
                JOIN [dbo].[dim_unidades_medida] u ON p.id_unidad = u.id_unidad
                WHERE p.id_producto = @id_prod AND p.activo = 1;
            END
        `);
        console.log('SP usp_Precios_GetByProd updated successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

run();
