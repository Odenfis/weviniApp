import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { poolPromise } from './db';
import sql from 'mssql';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// Middleware para validar licencia
const checkLicense = async (req, res, next) => {
    // No bloquear rutas de salud o login
    if (req.path === '/health' || req.path === '/api/login') {
        return next();
    }

    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT TOP 1 fecha_caducidad, activo FROM licencia ORDER BY id DESC');
        const license = result.recordset[0];

        if (!license || !license.activo) {
            return res.status(403).json({ message: 'LICENSE_EXPIRED', detail: 'La licencia del sistema no está activa.' });
        }

        const expirationDate = new Date(license.fecha_caducidad);
        const today = new Date();

        if (today > expirationDate) {
            return res.status(403).json({ message: 'LICENSE_EXPIRED', detail: 'La licencia del sistema ha caducado.' });
        }

        next();
    } catch (err) {
        console.error('Error validating license:', err);
        // En caso de error de DB, permitimos el paso para no bloquear la app por fallos técnicos, 
        // pero podrías cambiarlo a res.status(500) si prefieres seguridad total.
        next();
    }
};

app.use(checkLicense);

app.get('/health', (req, res) => {
    res.json({ status: 'OK' });
});

// --- CATÁLOGOS ---

app.get('/api/unidades', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().execute('usp_Unidades_Get');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ message: 'Error al obtener unidades', detail: err.message });
    }
});

app.get('/api/almacenes', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().execute('usp_Almacenes_Get');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ message: 'Error al obtener almacenes', detail: err.message });
    }
});

app.get('/api/clases', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().execute('usp_Clases_Get');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ message: 'Error al obtener clases', detail: err.message });
    }
});

app.get('/api/tablas/:codtabla', async (req, res) => {
    const { codtabla } = req.params;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('codtabla', sql.Int, codtabla)
            .query('SELECT n_numero, c_describe FROM Tablas WHERE n_codtabla = @codtabla ORDER BY n_numero');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ message: 'Error al obtener datos de tabla', detail: err.message });
    }
});

app.get('/api/saldos', async (req, res) => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().execute('usp_Saldos_Get');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ message: 'Error al obtener saldos de inventario', detail: err.message });
    }
});

app.put('/api/saldos/:id', async (req, res) => {
    const { id } = req.params;
    const { ajuste_stock } = req.body;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.Int, id)
            .input('ajuste_stock', sql.Decimal(12, 4), ajuste_stock)
            .execute('usp_Saldos_UpdateStock');
        res.json({ message: 'Stock ajustado exitosamente' });
    } catch (err) {
        res.status(500).json({ message: 'Error al ajustar el stock', detail: err.message });
    }
});


// --- CLIENTES ---

app.get('/api/clientes', async (req, res) => {
    const { all } = req.query;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('all', sql.Bit, all === 'true')
            .execute('usp_Clientes_Get');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ message: 'Error al obtener clientes', detail: err.message });
    }
});

app.post('/api/clientes', async (req, res) => {
    const c = req.body;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('codigo', sql.VarChar, c.codigo)
            .input('tipo_cliente', sql.VarChar, c.tipo_cliente || 'MINORISTA')
            .input('razon_social', sql.VarChar, c.razon_social)
            .input('nombre_comercial', sql.VarChar, c.nombre_comercial)
            .input('ruc_dni', sql.VarChar, c.ruc_dni)
            .input('telefono', sql.VarChar, c.telefono)
            .input('celular', sql.VarChar, c.celular)
            .input('email', sql.VarChar, c.email)
            .input('direccion', sql.Text, c.direccion)
            .input('distrito', sql.VarChar, c.distrito)
            .input('ciudad', sql.VarChar, c.ciudad)
            .input('limite_credito', sql.Decimal(12, 2), c.limite_credito || 0)
            .input('dias_credito', sql.Int, c.dias_credito || 0)
            .input('activo', sql.Int, c.activo ?? 1)
            .execute('usp_Clientes_Insert');
        res.status(201).json({ message: 'Cliente creado exitosamente' });
    } catch (err) {
        res.status(500).json({ message: 'Error al crear cliente', detail: err.message });
    }
});

app.put('/api/clientes/:id', async (req, res) => {
    const { id } = req.params;
    const c = req.body;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.Int, id)
            .input('codigo', sql.VarChar, c.codigo)
            .input('tipo_cliente', sql.VarChar, c.tipo_cliente)
            .input('razon_social', sql.VarChar, c.razon_social)
            .input('nombre_comercial', sql.VarChar, c.nombre_comercial)
            .input('ruc_dni', sql.VarChar, c.ruc_dni)
            .input('telefono', sql.VarChar, c.telefono)
            .input('celular', sql.VarChar, c.celular)
            .input('email', sql.VarChar, c.email)
            .input('direccion', sql.Text, c.direccion)
            .input('distrito', sql.VarChar, c.distrito)
            .input('ciudad', sql.VarChar, c.ciudad)
            .input('limite_credito', sql.Decimal(12, 2), c.limite_credito)
            .input('dias_credito', sql.Int, c.dias_credito)
            .input('activo', sql.Int, c.activo)
            .execute('usp_Clientes_Update');
        res.json({ message: 'Cliente actualizado exitosamente' });
    } catch (err) {
        res.status(500).json({ message: 'Error al actualizar cliente', detail: err.message });
    }
});

app.delete('/api/clientes/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.Int, id)
            .execute('usp_Clientes_Delete');
        res.json({ message: 'Cliente desactivado exitosamente' });
    } catch (err) {
        res.status(500).json({ message: 'Error al desactivar cliente', detail: err.message });
    }
});

// --- PROVEEDORES ---

app.get('/api/suppliers', async (req, res) => {
    const { all } = req.query;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('all', sql.Bit, all === 'true')
            .execute('usp_Proveedores_Get');
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching suppliers:', err);
        res.status(500).json({ message: 'Error al obtener proveedores', detail: err.message });
    }
});

app.post('/api/suppliers', async (req, res) => {
    const s = req.body;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('codigo', sql.VarChar, s.codigo)
            .input('razon_social', sql.VarChar, s.razon_social)
            .input('nombre_comercial', sql.VarChar, s.nombre_comercial)
            .input('ruc', sql.VarChar, s.ruc)
            .input('telefono', sql.VarChar, s.telefono)
            .input('celular', sql.VarChar, s.celular)
            .input('email', sql.VarChar, s.email)
            .input('contacto', sql.VarChar, s.contacto)
            .input('direccion', sql.Text, s.direccion)
            .input('ciudad', sql.VarChar, s.ciudad)
            .input('dias_pago', sql.Int, s.dias_pago || 0)
            .input('saldo_acreedor', sql.Decimal(12, 2), s.saldo_acreedor || 0)
            .input('activo', sql.Int, s.activo ?? 1)
            .execute('usp_Proveedores_Insert');
        res.status(201).json({ message: 'Proveedor creado exitosamente' });
    } catch (err) {
        res.status(500).json({ message: 'Error al crear proveedor', detail: err.message });
    }
});

app.put('/api/suppliers/:id', async (req, res) => {
    const { id } = req.params;
    const s = req.body;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.Int, id)
            .input('codigo', sql.VarChar, s.codigo)
            .input('razon_social', sql.VarChar, s.razon_social)
            .input('nombre_comercial', sql.VarChar, s.nombre_comercial)
            .input('ruc', sql.VarChar, s.ruc)
            .input('telefono', sql.VarChar, s.telefono)
            .input('celular', sql.VarChar, s.celular)
            .input('email', sql.VarChar, s.email)
            .input('contacto', sql.VarChar, s.contacto)
            .input('direccion', sql.Text, s.direccion)
            .input('ciudad', sql.VarChar, s.ciudad)
            .input('dias_pago', sql.Int, s.dias_pago)
            .input('saldo_acreedor', sql.Decimal(12, 2), s.saldo_acreedor)
            .input('activo', sql.Int, s.activo)
            .execute('usp_Proveedores_Update');
        res.json({ message: 'Proveedor actualizado exitosamente' });
    } catch (err) {
        res.status(500).json({ message: 'Error al actualizar proveedor', detail: err.message });
    }
});

app.delete('/api/suppliers/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.Int, id)
            .execute('usp_Proveedores_Delete');
        res.json({ message: 'Proveedor desactivado exitosamente' });
    } catch (err) {
        res.status(500).json({ message: 'Error al desactivar proveedor', detail: err.message });
    }
});

// --- PRODUCTOS ---

app.get('/api/productos', async (req, res) => {
    const { all } = req.query;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('all', sql.Bit, all === 'true')
            .execute('usp_Productos_Get');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ message: 'Error al obtener productos', detail: err.message });
    }
});

app.post('/api/productos', async (req, res) => {
    const p = req.body;
    try {
        const pool = await poolPromise;
        
        // 1. Insertar producto
        const result = await pool.request()
            .input('id_clase', sql.Int, p.id_clase)
            .input('codigo', sql.VarChar, p.codigo)
            .input('nombre', sql.VarChar, p.nombre)
            .input('descripcion', sql.Text, p.descripcion)
            .input('id_unidad_compra', sql.Int, p.id_unidad_compra)
            .input('id_unidad_venta', sql.Int, p.id_unidad_venta)
            .input('factor_conversion', sql.Decimal(10, 4), p.factor_conversion)
            .input('unidades_por_plancha', sql.Int, p.unidades_por_plancha)
            .input('planchas_por_jaba', sql.Int, p.planchas_por_jaba)
            .input('precio_costo', sql.Decimal(10, 4), p.precio_costo)
            .input('precio_venta_base', sql.Decimal(10, 4), p.precio_venta_base)
            .input('stock_minimo', sql.Decimal(12, 4), p.stock_minimo)
            .input('activo', sql.Int, p.activo ?? 1)
            .execute('usp_Productos_Insert');

        // Nota: Asumimos que usp_Productos_Insert no devuelve el ID, 
        // pero necesitamos el ID del producto recién creado para los precios.
        // Intentamos obtener el ID del producto recién creado por código (ya que es único).
        const prodRes = await pool.request()
            .input('codigo', sql.VarChar, p.codigo)
            .query('SELECT id_producto FROM dim_productos WHERE codigo = @codigo');
        
        const id_producto = prodRes.recordset[0]?.id_producto;

        if (id_producto && p.prices && Array.isArray(p.prices)) {
            for (const pr of p.prices) {
                await pool.request()
                    .input('id_prod', sql.Int, id_producto)
                    .input('pres', sql.VarChar, pr.presentacion)
                    .input('cant', sql.Decimal(10, 4), pr.cantidad_base)
                    .input('precio', sql.Decimal(10, 4), pr.precio_venta)
                    .execute('usp_Precios_Insert');
            }
        }

        res.status(201).json({ message: 'Producto creado exitosamente' });
    } catch (err) {
        res.status(500).json({ message: 'Error al crear producto', detail: err.message });
    }
});

app.put('/api/productos/:id', async (req, res) => {
    const { id } = req.params;
    const p = req.body;
    try {
        const pool = await poolPromise;
        
        // 1. Actualizar datos básicos del producto
        await pool.request()
            .input('id', sql.Int, id)
            .input('id_clase', sql.Int, p.id_clase)
            .input('codigo', sql.VarChar, p.codigo)
            .input('nombre', sql.VarChar, p.nombre)
            .input('descripcion', sql.Text, p.descripcion)
            .input('id_unidad_compra', sql.Int, p.id_unidad_compra)
            .input('id_unidad_venta', sql.Int, p.id_unidad_venta)
            .input('factor_conversion', sql.Decimal(10, 4), p.factor_conversion)
            .input('unidades_por_plancha', sql.Int, p.unidades_por_plancha)
            .input('planchas_por_jaba', sql.Int, p.planchas_por_jaba)
            .input('precio_costo', sql.Decimal(10, 4), p.precio_costo)
            .input('precio_venta_base', sql.Decimal(10, 4), p.precio_venta_base)
            .input('stock_minimo', sql.Decimal(12, 4), p.stock_minimo)
            .input('activo', sql.Int, p.activo)
            .execute('usp_Productos_Update');

        // 2. Sincronizar Presentaciones de Precio
        if (p.prices && Array.isArray(p.prices)) {
            // Obtener precios actuales para saber cuáles eliminar
            const currentPricesRes = await pool.request()
                .input('id_prod', sql.Int, id)
                .execute('usp_Precios_GetByProd');
            
            const currentPrices = currentPricesRes.recordset;
            const incomingPrices = p.prices;

            // Eliminar los que ya no vienen en la request
            for (const cp of currentPrices) {
                if (!incomingPrices.find(ip => ip.id_precio === cp.id_precio)) {
                    await pool.request()
                        .input('id', sql.Int, cp.id_precio)
                        .execute('usp_Precios_Delete');
                }
            }

            // Insertar o Actualizar
            for (const pr of incomingPrices) {
                if (pr.id_precio && pr.id_precio !== 0) {
                    // Actualizar
                    await pool.request()
                        .input('id', sql.Int, pr.id_precio)
                        .input('pres', sql.VarChar, pr.presentacion)
                        .input('cant', sql.Decimal(10, 4), pr.cantidad_base)
                        .input('precio', sql.Decimal(10, 4), pr.precio_venta)
                        .execute('usp_Precios_Update');
                } else {
                    // Insertar
                    await pool.request()
                        .input('id_prod', sql.Int, id)
                        .input('pres', sql.VarChar, pr.presentacion)
                        .input('cant', sql.Decimal(10, 4), pr.cantidad_base)
                        .input('precio', sql.Decimal(10, 4), pr.precio_venta)
                        .execute('usp_Precios_Insert');
                }
            }
        }

        res.json({ message: 'Producto y sus presentaciones actualizados exitosamente' });
    } catch (err) {
        res.status(500).json({ message: 'Error al actualizar producto', detail: err.message });
    }
});

app.delete('/api/productos/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.Int, id)
            .execute('usp_Productos_Delete');
        res.json({ message: 'Producto desactivado exitosamente' });
    } catch (err) {
        res.status(500).json({ message: 'Error al desactivar producto', detail: err.message });
    }
});

// --- PRECIOS DEL PRODUCTO ---

app.get('/api/productos/:id/precios', async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id_prod', sql.Int, id)
            .execute('usp_Precios_GetByProd');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ message: 'Error al obtener precios', detail: err.message });
    }
});

app.get('/api/productos/:id/presentaciones', async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('id_prod', sql.Int, id)
            .execute('usp_Precios_GetByProd');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ message: 'Error al obtener presentaciones', detail: err.message });
    }
});

app.post('/api/precios', async (req, res) => {

    const pr = req.body;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('id_prod', sql.Int, pr.id_producto)
            .input('pres', sql.VarChar, pr.presentacion)
            .input('cant', sql.Decimal(10, 4), pr.cantidad_base)
            .input('precio', sql.Decimal(10, 4), pr.precio_venta)
            .execute('usp_Precios_Insert');
        res.status(201).json({ message: 'Precio creado exitosamente' });
    } catch (err) {
        res.status(500).json({ message: 'Error al crear precio', detail: err.message });
    }
});

app.put('/api/precios/:id', async (req, res) => {
    const { id } = req.params;
    const pr = req.body;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.Int, id)
            .input('pres', sql.VarChar, pr.presentacion)
            .input('cant', sql.Decimal(10, 4), pr.cantidad_base)
            .input('precio', sql.Decimal(10, 4), pr.precio_venta)
            .execute('usp_Precios_Update');
        res.json({ message: 'Precio actualizado exitosamente' });
    } catch (err) {
        res.status(500).json({ message: 'Error al actualizar precio', detail: err.message });
    }
});

app.delete('/api/precios/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await poolPromise;
        await pool.request()
            .input('id', sql.Int, id)
            .execute('usp_Precios_Delete');
        res.json({ message: 'Precio eliminado exitosamente' });
    } catch (err) {
        res.status(500).json({ message: 'Error al eliminar precio', detail: err.message });
    }
});

// --- VENTAS ---

app.get('/api/ventas/next-doc', async (req, res) => {
    try {
        const nextCode = await getNextCode('fact_ventas', 'numero_doc');
        res.json({ nextCode });
    } catch (err) {
        res.status(500).json({ message: 'Error al generar número de documento', detail: err.message });
    }
});

app.post('/api/ventas', async (req, res) => {
    const v = req.body;
    try {
        const pool = await poolPromise;
        console.log('Processing sale for client:', v.id_cliente, 'Warehouse:', v.id_almacen);
        console.log('Details JSON being sent to SP:', JSON.stringify(v.detalles));
        
        const result = await pool.request()
            .input('id_cliente', sql.Int, v.id_cliente)
            .input('id_almacen', sql.Int, v.id_almacen)
            .input('numero_doc', sql.VarChar, v.numero_doc)
            .input('tipo_doc', sql.Int, v.tipo_doc)
            .input('tipo_venta', sql.Int, v.tipo_venta)
            .input('subtotal', sql.Decimal(12, 2), v.subtotal)
            .input('descuento', sql.Decimal(12, 2), v.descuento)
            .input('igv', sql.Decimal(12, 2), v.igv)
            .input('total', sql.Decimal(12, 2), v.total)
            .input('monto_pagado', sql.Decimal(12, 2), v.monto_pagado)
            .input('saldo', sql.Decimal(12, 2), v.saldo)
            .input('estado', sql.VarChar, v.estado || 'PAGADO')
            .input('observaciones', sql.Text, v.observaciones)
            .input('detalles_json', sql.NVarChar, JSON.stringify(v.detalles))
            .execute('usp_Ventas_Insert');
        
        res.status(201).json({ message: 'Venta registrada exitosamente', id_venta: result.recordset[0].id_venta });
    } catch (err) {
        console.error('FULL SALE ERROR:', err);
        res.status(500).json({ 
            message: 'Error al registrar la venta', 
            detail: err.message,
            sqlError: err.originalError || 'No original error'
        });
    }
});

app.post('/api/login', async (req, res) => {

    const { nombre_cuenta, password } = req.body;
    if (!nombre_cuenta || !password) {
        return res.status(400).json({ message: 'Nombre de cuenta y password son requeridos' });
    }
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('user', sql.VarChar, nombre_cuenta)
            .execute('usp_Usuarios_GetByAcc');
        const user = result.recordset[0];
        if (!user) {
            return res.status(401).json({ message: 'Usuario no encontrado' });
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid && password !== user.password) {
            return res.status(401).json({ message: 'Contraseña incorrecta' });
        }
        const token = jwt.sign(
            { id: user.id, nombre_cuenta: user.nombre_cuenta, rol: user.rol },
            JWT_SECRET,
            { expiresIn: '8h' }
        );
        res.json({
            token,
            user: { id: user.id, nombre_cuenta: user.nombre_cuenta, rol: user.rol }
        });
    } catch (err) {
        res.status(500).json({ message: 'Error interno del servidor', detail: err.message });
    }
});

// --- NEXT CODE GENERATOR ---

async function getNextCode(tableName: string, columnName: string) {
    try {
        const pool = await poolPromise;
        const result = await pool.request()
            .input('tableName', sql.NVarChar, tableName)
            .input('columnName', sql.NVarChar, columnName)
            .execute('usp_Utils_GetNextCode');
        
        const lastCode = result.recordset[0]?.NextCode;

        if (!lastCode) return "1";

        // Mantenemos la lógica de incremento en JS para manejar prefijos complejos
        if (/^\d+$/.test(lastCode)) {
            return (parseInt(lastCode) + 1).toString();
        }

        const match = lastCode.match(/^([a-zA-Z-]+)(\d+)$/);
        if (match) {
            const prefix = match[1];
            const numberPart = match[2];
            const nextNumber = parseInt(numberPart) + 1;
            return `${prefix}${nextNumber.toString().padStart(numberPart.length, '0')}`;
        }

        return (parseInt(lastCode.replace(/\D/g, '')) + 1).toString();
    } catch (err) {
        console.error('Error generating next code:', err);
        return "1";
    }
}

app.get('/api/clientes/next-code', async (req, res) => {
    try {
        const nextCode = await getNextCode('dim_clientes', 'codigo');
        res.json({ nextCode });
    } catch (err) {
        res.status(500).json({ message: 'Error al generar código de cliente', detail: err.message });
    }
});

app.get('/api/suppliers/next-code', async (req, res) => {
    try {
        const nextCode = await getNextCode('dim_proveedores', 'codigo');
        res.json({ nextCode });
    } catch (err) {
        res.status(500).json({ message: 'Error al generar código de proveedor', detail: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
