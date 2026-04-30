-- 1. Get all active presentations for a product
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
    JOIN [dbo].[dim_unidades_medida] u ON p.id_unidad = u.id_unidad
    WHERE p.id_producto = @id_prod AND p.activo = 1;
END
GO

-- 2. Insert Sale (Header and Details)
-- IMPLEMENTATION: Decouples Financial Transaction from Inventory Movement
-- This handles the conflict between short codes (FK in fact_ventas_detalle) and descriptive names (dim_saldos)
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
    -- JSON format: [{"id_producto": 1, "unidad_factura": "UND       ", "unidad_saldos": "UNIDADES", "cantidad_venta": 1, "cantidad_stock": 5, "precio_unitario": 10.0, "descuento": 0, "subtotal": 10.0, "costo_unitario": 8.0}, ...]
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
            GETDATE(), @subtotal, @descuento, @igv, @total, 
            @monto_pagado, @saldo, @estado, @observaciones
        );
        
        SET @id_venta = SCOPE_IDENTITY();
        
        -- 2. Insert Details (Financial)
        -- Uses 'unidad_factura' for Foreign Key compatibility and 'cantidad_venta' for billing
        INSERT INTO [dbo].[fact_ventas_detalle] (
            id_venta, id_producto, Unidad, cantidad, precio_unitario, descuento, subtotal, costo_unitario
        )
        SELECT 
            @id_venta, 
            JSON_VALUE(value, '$.id_producto'), 
            JSON_VALUE(value, '$.unidad_factura'), 
            CAST(JSON_VALUE(value, '$.cantidad_venta') AS DECIMAL(12,4)), 
            CAST(JSON_VALUE(value, '$.precio_unitario') AS DECIMAL(10,4)), 
            CAST(JSON_VALUE(value, '$.descuento') AS DECIMAL(10,4)), 
            CAST(JSON_VALUE(value, '$.subtotal') AS DECIMAL(12,2)), 
            CAST(JSON_VALUE(value, '$.costo_unitario') AS DECIMAL(10,4))
        FROM OPENJSON(@detalles_json);

        -- 3. Update Inventory (Logistical)
        -- Uses 'unidad_saldos' for descriptive match and 'cantidad_stock' for actual deduction
        UPDATE s
        SET s.stock_actual = s.stock_actual - CAST(JSON_VALUE(j.value, '$.cantidad_stock') AS DECIMAL(12,4))
        FROM [dbo].[dim_saldos] s
        CROSS JOIN OPENJSON(@detalles_json) j
        WHERE s.id_producto = CAST(JSON_VALUE(j.value, '$.id_producto') AS INT)
          AND s.id_almacen = @id_almacen
          AND s.Unidad = JSON_VALUE(j.value, '$.unidad_saldos');
        
        COMMIT TRANSACTION;
        SELECT @id_venta AS id_venta;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
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
