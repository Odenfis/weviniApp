-- Last Updated: 2026-05-06
-- Project: Wevini App - POS Implementation

-- 1. Get all active presentations for a product
-- UPDATED 2026-05-10: Changed to LEFT JOIN to ensure presentations without units are still visible in POS
-- Expected columns: id_precio, id_producto, presentacion, cantidad_base, precio_venta, precio_compra, id_unidad, codigo_unidad
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
    LEFT JOIN [dbo].[dim_unidades_medida] u ON p.id_unidad = u.id_unidad
    WHERE p.id_producto = @id_prod AND p.activo = 1;
END
GO

-- 1.1. Insert price presentation
-- UPDATED 2026-05-10: Added @id_unidad support
CREATE OR ALTER PROCEDURE [dbo].[usp_Precios_Insert]
    @id_prod INT,
    @nombre VARCHAR(100),
    @pres VARCHAR(100),
    @cant DECIMAL(10, 4),
    @precio DECIMAL(10, 4),
    @id_unidad INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @new_id INT;
    SELECT @new_id = ISNULL(MAX(id_precio), 0) + 1 FROM [dbo].[dim_producto_precios];

    INSERT INTO [dbo].[dim_producto_precios] (id_precio, id_producto, Nombre, presentacion, cantidad_base, precio_venta, id_unidad) 
    VALUES (@new_id, @id_prod, @nombre, @pres, @cant, @precio, @id_unidad);
END
GO

-- 1.2. Update price presentation
-- UPDATED 2026-05-10: Added @id_unidad support
CREATE OR ALTER PROCEDURE [dbo].[usp_Precios_Update]
    @id INT,
    @nombre VARCHAR(100),
    @pres VARCHAR(100),
    @cant DECIMAL(10, 4),
    @precio DECIMAL(10, 4),
    @id_unidad INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE [dbo].[dim_producto_precios] 
    SET Nombre = @nombre, presentacion = @pres, cantidad_base = @cant, precio_venta = @precio, id_unidad = @id_unidad
    WHERE id_precio = @id;
END
GO


-- 2. Insert Sale (Header and Details)
-- IMPLEMENTATION: Decouples Financial Transaction from Inventory Movement
-- UPDATED 2026-05-07: Transitioned to UNIT-only stock management. uses 'unidades_vendidas' for inventory deduction.
-- UPDATED 2026-05-10: Added ISNULL for costo_unitario to prevent NULL insert errors
CREATE OR ALTER PROCEDURE [dbo].[usp_Ventas_Insert]
    @id_cliente INT,
    @id_almacen INT,
    @numero_doc CHAR(20),
    @tipo_doc INT,
    @tipo_venta INT,
    @subtotal DECIMAL(12,2),
    @descuento DECIMAL(12,2),
    @igv DECIMAL(12,2),
    @total DECIMAL(12,2),
    @monto_pagado DECIMAL(12,2),
    @saldo DECIMAL(12,2),
    @estado CHAR(20),
    @observaciones TEXT,
    @detalles_json NVARCHAR(MAX) 
    -- JSON format: [{"id_producto": 1, "unidad_factura": "UND       ", "cantidad_venta": 1, "unidades_vendidas": 5, "precio_unitario": 10.0, "descuento": 0, "subtotal": 10.0, "costo_unitario": 8.0}, ...]
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
        -- 1. Insert Header
        DECLARE @id_venta INT;
        
        INSERT INTO [dbo].[fact_ventas] (
            id_cliente, id_almacen, numero_doc, tipo_doc, tipo_venta, 
            fecha_venta, subtotal, descuento, igv, total, 
            monto_pagado, saldo, estado, observaciones
        )
        VALUES (
            @id_cliente, @id_almacen, @numero_doc, @tipo_doc, @tipo_venta, 
            GETUTCDATE(), @subtotal, @descuento, @igv, @total, 
            @monto_pagado, @saldo, @estado, @observaciones
        );
        
        SET @id_venta = SCOPE_IDENTITY();
        
        -- 2. Insert Details (Financial)
        INSERT INTO [dbo].[fact_ventas_detalle] (
            id_venta, id_producto, Unidad, cantidad, precio_unitario, descuento, subtotal, costo_unitario, unidades_vendidas
        )
        SELECT 
            @id_venta, 
            TRY_CAST(JSON_VALUE(value, '$.id_producto') AS INT), 
            CAST(JSON_VALUE(value, '$.unidad_factura') AS VARCHAR(10)), 
            TRY_CAST(JSON_VALUE(value, '$.cantidad_venta') AS DECIMAL(12,4)), 
            TRY_CAST(JSON_VALUE(value, '$.precio_unitario') AS DECIMAL(10,4)), 
            TRY_CAST(JSON_VALUE(value, '$.descuento') AS DECIMAL(10,4)), 
            TRY_CAST(JSON_VALUE(value, '$.subtotal') AS DECIMAL(12,2)), 
            ISNULL(TRY_CAST(JSON_VALUE(value, '$.costo_unitario') AS DECIMAL(10,4)), 0),
            TRY_CAST(JSON_VALUE(value, '$.unidades_vendidas') AS DECIMAL(10,4))
        FROM OPENJSON(@detalles_json);

        -- 3. Update Inventory (Logistical)
        -- Deduct total units from dim_saldos where Unidad = 'UNIDADES'
        ;WITH SaleDemand AS (
            SELECT 
                TRY_CAST(JSON_VALUE(value, '$.id_producto') AS INT) as id_producto,
                TRY_CAST(JSON_VALUE(value, '$.unidades_vendidas') AS DECIMAL(12,4)) as qty
            FROM OPENJSON(@detalles_json)
        ),
        AggregatedDemand AS (
            SELECT 
                id_producto,
                SUM(qty) as TotalDeduct
            FROM SaleDemand
            GROUP BY id_producto
        )
        UPDATE s
        SET s.stock_actual = ISNULL(s.stock_actual, 0) - ad.TotalDeduct
        FROM [dbo].[dim_saldos] s
        INNER JOIN AggregatedDemand ad ON s.id_producto = ad.id_producto 
        WHERE s.id_almacen = @id_almacen 
          AND RTRIM(LTRIM(s.Unidad)) = 'UNIDADES';
        
        COMMIT TRANSACTION;
        SELECT @id_venta AS id_venta;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

-- 3. Get Warehouses for POS
CREATE OR ALTER PROCEDURE [dbo].[usp_Almacenes_Get]
AS
BEGIN
    SET NOCOUNT ON;
    SELECT id_almacen, nombre FROM [dbo].[dim_almacenes] WHERE activo = 1;
END
GO

-- 4. Manual Stock Adjustment (Incremental)
CREATE OR ALTER PROCEDURE [dbo].[usp_Saldos_UpdateStock]
    @id INT,
    @ajuste_stock DECIMAL(12, 4)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE [dbo].[dim_saldos]
    SET stock_actual = stock_actual + @ajuste_stock,
        ultima_actualizacion = GETDATE()
    WHERE id_saldo = @id;
END
GO

-- 5. Utility for Next Document Code Generation
-- UPDATED 2026-05-06: Fixed sorting for CHAR columns to prevent duplicate document numbers
CREATE OR ALTER PROCEDURE [dbo].[usp_Utils_GetNextCode]
    @tableName NVARCHAR(128),
    @columnName NVARCHAR(128)
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @sql NVARCHAR(MAX);
    
    -- Sort by length first, then by value, to ensure correct numeric sequence in CHAR columns
    SET @sql = N'SELECT TOP 1 ' + QUOTENAME(@columnName) + ' AS NextCode 
                 FROM ' + QUOTENAME(@tableName) + ' 
                 ORDER BY LEN(' + QUOTENAME(@columnName) + ') DESC, ' + QUOTENAME(@columnName) + ' DESC';
    
    EXEC sp_executesql @sql;
END
GO

-- 6. Get Recent Sales for Dashboard
-- Expected columns: id_venta, razon_social, fecha_venta, total, estado
CREATE OR ALTER PROCEDURE [dbo].[usp_Ventas_GetRecent]
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP 5 
        v.id_venta, 
        c.razon_social, 
        v.fecha_venta, 
        v.total, 
        v.estado
    FROM [dbo].[fact_ventas] v
    JOIN [dbo].[dim_clientes] c ON v.id_cliente = c.id_cliente
    ORDER BY v.fecha_venta DESC;
END
GO

-- 7. POS Configuration
-- Table to store global POS settings for automatic selection
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[pos_config]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[pos_config] (
        id INT PRIMARY KEY CHECK (id = 1), -- Ensure only one row exists
        id_cliente INT NULL,
        id_almacen INT NULL,
        automatico BIT DEFAULT 0,
        ultima_actualizacion DATETIME DEFAULT GETUTCDATE()
    );

    -- Initial configuration row
    INSERT INTO [dbo].[pos_config] (id, id_cliente, id_almacen, automatico)
    VALUES (1, NULL, NULL, 0);
END
GO


