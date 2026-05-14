-- Project: Wevini App - POS Implementation
-- Final Stored Procedures Version

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
    @detalles_json NVARCHAR(MAX),
    @pagos_json NVARCHAR(MAX) = NULL
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
        
        -- 2. Register Cash Movement and Update Balances
        IF @tipo_venta = 5 -- MIXTO
        BEGIN
            IF @pagos_json IS NOT NULL
            BEGIN
                DECLARE @PaymentQueue TABLE (
                    PaymentID INT IDENTITY(1,1),
                    FormaPago INT,
                    Monto DECIMAL(12,2)
                );

                INSERT INTO @PaymentQueue (FormaPago, Monto)
                SELECT forma_pago, monto
                FROM OPENJSON(@pagos_json)
                WITH (
                    forma_pago INT '$.forma_pago',
                    monto DECIMAL(12,2) '$.monto'
                );

                DECLARE @q_id INT = 1;
                DECLARE @q_max INT = (SELECT MAX(PaymentID) FROM @PaymentQueue);
                DECLARE @q_forma INT;
                DECLARE @q_monto DECIMAL(12,2);
                DECLARE @q_caja INT;
                DECLARE @q_cat INT;

                WHILE @q_id <= @q_max
                BEGIN
                    SELECT @q_forma = FormaPago, @q_monto = Monto 
                    FROM @PaymentQueue WHERE PaymentID = @q_id;

                    IF @q_forma = 1
                    BEGIN
                        SET @q_caja = 1;
                        SET @q_cat = 1;
                    END
                    ELSE IF @q_forma IN (2, 3)
                    BEGIN
                        SET @q_caja = 2;
                        SET @q_cat = 3;
                    END
                    ELSE
                    BEGIN
                        SET @q_id = @q_id + 1;
                        CONTINUE;
                    END

                    INSERT INTO [dbo].[fact_movimientos_caja] (
                        id_caja, fecha, tipo_mov, concepto, categoria, 
                        referencia_id, monto, saldo, forma_pago, observaciones, fecha_creacion
                    )
                    VALUES (
                        @q_caja, GETUTCDATE(), 2, 'VENTA', @q_cat, 
                        @id_venta, @q_monto, 0, @q_forma, NULL, GETUTCDATE()
                    );

                    UPDATE [dbo].[dim_cajas_bancos] 
                    SET saldo_actual = saldo_actual + @q_monto 
                    WHERE id_caja = @q_caja;

                    SET @q_id = @q_id + 1;
                END
            END
            ELSE
            BEGIN
                INSERT INTO [dbo].[fact_movimientos_caja] (
                    id_caja, fecha, tipo_mov, concepto, categoria, 
                    referencia_id, monto, saldo, forma_pago, observaciones, fecha_creacion
                )
                VALUES (1, GETUTCDATE(), 2, 'VENTA (MIXTO-FALLBACK)', 1, @id_venta, @total, 0, 1, 'No pagos_json provided', GETUTCDATE());

                UPDATE [dbo].[dim_cajas_bancos] SET saldo_actual = saldo_actual + @total WHERE id_caja = 1;
            END
        END
        ELSE IF @tipo_venta IN (1, 2, 3) -- CONTADO, YAPE, TRANSFERENCIA
        BEGIN
            DECLARE @target_caja INT = CASE WHEN @tipo_venta = 1 THEN 1 ELSE 2 END;
            DECLARE @target_cat INT = CASE WHEN @tipo_venta = 1 THEN 1 ELSE 3 END;

            INSERT INTO [dbo].[fact_movimientos_caja] (
                id_caja, fecha, tipo_mov, concepto, categoria, 
                referencia_id, monto, saldo, forma_pago, observaciones, fecha_creacion
            )
            VALUES (
                @target_caja, GETUTCDATE(), 2, 'VENTA', @target_cat, 
                @id_venta, @total, 0, @tipo_venta, NULL, GETUTCDATE()
            );

            UPDATE [dbo].[dim_cajas_bancos] 
            SET saldo_actual = saldo_actual + @total 
            WHERE id_caja = @target_caja;
        END
        
        -- 3. Insert Details (Financial)
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

        -- 4. Update Inventory (Logistical)
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

CREATE OR ALTER PROCEDURE [dbo].[usp_Almacenes_Get]
AS
BEGIN
    SET NOCOUNT ON;
    SELECT id_almacen, nombre FROM [dbo].[dim_almacenes] WHERE activo = 1;
END
GO

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

CREATE OR ALTER PROCEDURE [dbo].[usp_Utils_GetNextCode]
    @tableName NVARCHAR(128),
    @columnName NVARCHAR(128)
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @sql NVARCHAR(MAX);
    SET @sql = N'SELECT TOP 1 ' + QUOTENAME(@columnName) + ' AS NextCode 
                 FROM ' + QUOTENAME(@tableName) + ' 
                 ORDER BY LEN(' + QUOTENAME(@columnName) + ') DESC, ' + QUOTENAME(@columnName) + ' DESC';
    EXEC sp_executesql @sql;
END
GO

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

-- Implementation Date: 2026-05-12 10:00 AM
CREATE OR ALTER PROCEDURE [dbo].[usp_Dashboard_GetKPIs]
AS
BEGIN
    SET NOCOUNT ON;

    -- 1. Ventas Mensuales (Current Month)
    DECLARE @ventas_mensuales DECIMAL(12,2);
    SELECT @ventas_mensuales = ISNULL(SUM(total), 0) 
    FROM [dbo].[fact_ventas] 
    WHERE MONTH(fecha_venta) = MONTH(GETDATE()) 
      AND YEAR(fecha_venta) = YEAR(GETDATE());

    -- 2. Saldo Caja (id_caja = 1)
    DECLARE @saldo_caja DECIMAL(12,2);
    SELECT @saldo_caja = ISNULL(saldo_actual, 0) 
    FROM [dbo].[dim_cajas_bancos] 
    WHERE id_caja = 1;

    -- 3. Saldo Banco (id_caja = 2)
    DECLARE @saldo_banco DECIMAL(12,2);
    SELECT @saldo_banco = ISNULL(saldo_actual, 0) 
    FROM [dbo].[dim_cajas_bancos] 
    WHERE id_caja = 2;

    -- 4. Stock Huevo Quiñado (id_producto = 4)
    DECLARE @stock_quinado DECIMAL(12,4);
    SELECT @stock_quinado = ISNULL(stock_actual, 0) 
    FROM [dbo].[dim_saldos] 
    WHERE id_producto = 4;

    -- Return as a single row
    SELECT 
        @ventas_mensuales AS ventas_mensuales,
        @saldo_caja AS saldo_caja,
        @saldo_banco AS saldo_banco,
        @stock_quinado AS stock_quinado;
END
GO

