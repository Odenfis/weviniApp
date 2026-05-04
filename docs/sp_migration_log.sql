-- -----------------------------------------------------------------------------------
-- SECCIÓN: CATÁLOGOS E INVENTARIO
-- -----------------------------------------------------------------------------------

-- Descripción: Obtener todas las unidades de medida
CREATE PROCEDURE usp_Unidades_Get
AS
BEGIN
    SELECT * FROM dim_unidades_medida;
END;
GO

-- Descripción: Obtener clases de productos activas
CREATE PROCEDURE usp_Clases_Get
AS
BEGIN
    SELECT * FROM dim_clases WHERE activo = 1;
END;
GO

-- Descripción: Obtener saldos de inventario con nombres de producto y almacén
CREATE PROCEDURE usp_Saldos_Get
AS
BEGIN
    SELECT s.id_saldo, s.id_producto, s.id_almacen, s.lote, s.fecha_vencimiento, s.Unidad as unidad, 
           s.stock_actual, s.stock_reservado, s.costo_promedio, s.ultima_actualizacion, 
           p.nombre as producto_nombre, a.nombre as almacen_nombre 
    FROM dim_saldos s 
    JOIN dim_productos p ON s.id_producto = p.id_producto 
    JOIN dim_almacenes a ON s.id_almacen = a.id_almacen;
END;
GO

-- Descripción: Actualizar stock actual de un saldo específico (Suma/Resta)
CREATE PROCEDURE usp_Saldos_UpdateStock
    @id INT,
    @ajuste_stock DECIMAL(12, 4)
AS
BEGIN
    UPDATE dim_saldos 
    SET stock_actual = stock_actual + @ajuste_stock,
        ultima_actualizacion = GETDATE()
    WHERE id_saldo = @id;
END;
GO



-- -----------------------------------------------------------------------------------
-- SECCIÓN: CLIENTES
-- -----------------------------------------------------------------------------------

-- Descripción: Obtener clientes (con opción de traer todos o solo activos)
CREATE PROCEDURE usp_Clientes_Get
    @all BIT = 0
AS
BEGIN
    IF @all = 1
        SELECT * FROM dim_clientes;
    ELSE
        SELECT * FROM dim_clientes WHERE activo = 1;
END;
GO

-- Descripción: Insertar nuevo cliente
CREATE PROCEDURE usp_Clientes_Insert
    @codigo VARCHAR(20),
    @tipo_cliente VARCHAR(20),
    @razon_social VARCHAR(200),
    @nombre_comercial VARCHAR(200),
    @ruc_dni VARCHAR(20),
    @telefono VARCHAR(20),
    @celular VARCHAR(20),
    @email VARCHAR(100),
    @direccion TEXT,
    @distrito VARCHAR(100),
    @ciudad VARCHAR(100),
    @limite_credito DECIMAL(12, 2),
    @dias_credito INT,
    @activo INT
AS
BEGIN
    INSERT INTO dim_clientes 
    (codigo, tipo_cliente, razon_social, nombre_comercial, ruc_dni, telefono, celular, email, direccion, distrito, ciudad, limite_credito, dias_credito, activo)
    VALUES 
    (@codigo, @tipo_cliente, @razon_social, @nombre_comercial, @ruc_dni, @telefono, @celular, @email, @direccion, @distrito, @ciudad, @limite_credito, @dias_credito, @activo);
END;
GO

-- Descripción: Actualizar datos de cliente
CREATE PROCEDURE usp_Clientes_Update
    @id INT,
    @codigo VARCHAR(20),
    @tipo_cliente VARCHAR(20),
    @razon_social VARCHAR(200),
    @nombre_comercial VARCHAR(200),
    @ruc_dni VARCHAR(20),
    @telefono VARCHAR(20),
    @celular VARCHAR(20),
    @email VARCHAR(100),
    @direccion TEXT,
    @distrito VARCHAR(100),
    @ciudad VARCHAR(100),
    @limite_credito DECIMAL(12, 2),
    @dias_credito INT,
    @activo INT
AS
BEGIN
    UPDATE dim_clientes SET 
    codigo = @codigo, tipo_cliente = @tipo_cliente, razon_social = @razon_social, nombre_comercial = @nombre_comercial, 
    ruc_dni = @ruc_dni, telefono = @telefono, celular = @celular, email = @email, 
    direccion = @direccion, distrito = @distrito, ciudad = @ciudad, 
    limite_credito = @limite_credito, dias_credito = @dias_credito, activo = @activo
    WHERE id_cliente = @id;
END;
GO

-- Descripción: Desactivar cliente
CREATE PROCEDURE usp_Clientes_Delete
    @id INT
AS
BEGIN
    UPDATE dim_clientes SET activo = 0 WHERE id_cliente = @id;
END;
GO

-- -----------------------------------------------------------------------------------
-- SECCIÓN: PROVEEDORES
-- -----------------------------------------------------------------------------------

-- Descripción: Obtener proveedores (con opción de traer todos o solo activos)
CREATE PROCEDURE usp_Proveedores_Get
    @all BIT = 0
AS
BEGIN
    IF @all = 1
        SELECT * FROM dbo.dim_proveedores;
    ELSE
        SELECT * FROM dbo.dim_proveedores WHERE activo = 1;
END;
GO

-- Descripción: Insertar nuevo proveedor
CREATE PROCEDURE usp_Proveedores_Insert
    @codigo VARCHAR(20),
    @razon_social VARCHAR(200),
    @nombre_comercial VARCHAR(200),
    @ruc VARCHAR(20),
    @telefono VARCHAR(20),
    @celular VARCHAR(20),
    @email VARCHAR(100),
    @contacto VARCHAR(100),
    @direccion TEXT,
    @ciudad VARCHAR(100),
    @dias_pago INT,
    @saldo_acreedor DECIMAL(12, 2),
    @activo INT
AS
BEGIN
    INSERT INTO dim_proveedores 
    (codigo, razon_social, nombre_comercial, ruc, telefono, celular, email, contacto, direccion, ciudad, dias_pago, saldo_acreedor, activo)
    VALUES 
    (@codigo, @razon_social, @nombre_comercial, @ruc, @telefono, @celular, @email, @contacto, @direccion, @ciudad, @dias_pago, @saldo_acreedor, @activo);
END;
GO

-- Descripción: Actualizar datos de proveedor
CREATE PROCEDURE usp_Proveedores_Update
    @id INT,
    @codigo VARCHAR(20),
    @razon_social VARCHAR(200),
    @nombre_comercial VARCHAR(200),
    @ruc VARCHAR(20),
    @telefono VARCHAR(20),
    @celular VARCHAR(20),
    @email VARCHAR(100),
    @contacto VARCHAR(100),
    @direccion TEXT,
    @ciudad VARCHAR(100),
    @dias_pago INT,
    @saldo_acreedor DECIMAL(12, 2),
    @activo INT
AS
BEGIN
    UPDATE dim_proveedores SET 
    codigo = @codigo, razon_social = @razon_social, nombre_comercial = @nombre_comercial, 
    ruc = @ruc, telefono = @telefono, celular = @celular, email = @email, 
    contacto = @contacto, direccion = @direccion, ciudad = @ciudad, 
    dias_pago = @dias_pago, saldo_acreedor = @saldo_acreedor, activo = @activo
    WHERE id_proveedor = @id;
END;
GO

-- Descripción: Desactivar proveedor
CREATE PROCEDURE usp_Proveedores_Delete
    @id INT
AS
BEGIN
    UPDATE dim_proveedores SET activo = 0 WHERE id_proveedor = @id;
END;
GO

-- -----------------------------------------------------------------------------------
-- SECCIÓN: PRODUCTOS
-- -----------------------------------------------------------------------------------

-- Descripción: Obtener productos con sus relaciones (Clase, Unidades)
CREATE PROCEDURE usp_Productos_Get
    @all BIT = 0
AS
BEGIN
    SELECT p.*, c.nombre as clase_nombre, uc.nombre as unidad_compra_nombre, uv.nombre as unidad_venta_nombre
    FROM dim_productos p
    JOIN dim_clases c ON p.id_clase = c.id_clase
    JOIN dim_unidades_medida uc ON p.id_unidad_compra = uc.id_unidad
    JOIN dim_unidades_medida uv ON p.id_unidad_venta = uv.id_unidad
    WHERE (@all = 1 OR p.activo = 1);
END;
GO

-- Descripción: Insertar nuevo producto
CREATE PROCEDURE usp_Productos_Insert
    @id_clase INT,
    @codigo VARCHAR(20),
    @nombre VARCHAR(200),
    @descripcion TEXT,
    @id_unidad_compra INT,
    @id_unidad_venta INT,
    @factor_conversion DECIMAL(10, 4),
    @unidades_por_plancha INT,
    @planchas_por_jaba INT,
    @precio_costo DECIMAL(10, 4),
    @precio_venta_base DECIMAL(10, 4),
    @stock_minimo DECIMAL(12, 4),
    @activo INT
AS
BEGIN
    INSERT INTO dim_productos 
    (id_clase, codigo, nombre, descripcion, id_unidad_compra, id_unidad_venta, factor_conversion, unidades_por_plancha, planchas_por_jaba, precio_costo, precio_venta_base, stock_minimo, activo)
    VALUES 
    (@id_clase, @codigo, @nombre, @descripcion, @id_unidad_compra, @id_unidad_venta, @factor_conversion, @unidades_por_plancha, @planchas_por_jaba, @precio_costo, @precio_venta_base, @stock_minimo, @activo);
END;
GO

-- Descripción: Actualizar producto
CREATE PROCEDURE usp_Productos_Update
    @id INT,
    @id_clase INT,
    @codigo VARCHAR(20),
    @nombre VARCHAR(200),
    @descripcion TEXT,
    @id_unidad_compra INT,
    @id_unidad_venta INT,
    @factor_conversion DECIMAL(10, 4),
    @unidades_por_plancha INT,
    @planchas_por_jaba INT,
    @precio_costo DECIMAL(10, 4),
    @precio_venta_base DECIMAL(10, 4),
    @stock_minimo DECIMAL(12, 4),
    @activo INT
AS
BEGIN
    UPDATE dim_productos SET 
    id_clase = @id_clase, codigo = @codigo, nombre = @nombre, descripcion = @descripcion, 
    id_unidad_compra = @id_unidad_compra, id_unidad_venta = @id_unidad_venta, 
    factor_conversion = @factor_conversion, unidades_por_plancha = @unidades_por_plancha, 
    planchas_por_jaba = @planchas_por_jaba, precio_costo = @precio_costo, 
    precio_venta_base = @precio_venta_base, stock_minimo = @stock_minimo, activo = @activo
    WHERE id_producto = @id;
END;
GO

-- Descripción: Desactivar producto
CREATE PROCEDURE usp_Productos_Delete
    @id INT
AS
BEGIN
    UPDATE dim_productos SET activo = 0 WHERE id_producto = @id;
END;
GO

-- -----------------------------------------------------------------------------------
-- SECCIÓN: PRECIOS DEL PRODUCTO
-- -----------------------------------------------------------------------------------

-- Descripción: Obtener precios de un producto específico
CREATE PROCEDURE usp_Precios_GetByProd
    @id_prod INT
AS
BEGIN
    SELECT * FROM dim_producto_precios WHERE id_producto = @id_prod;
END;
GO

-- Descripción: Insertar nueva presentación de precio
CREATE PROCEDURE usp_Precios_Insert
    @id_prod INT,
    @pres VARCHAR(100),
    @cant DECIMAL(10, 4),
    @precio DECIMAL(10, 4)
AS
BEGIN
    INSERT INTO dim_producto_precios (id_producto, presentacion, cantidad_base, precio_venta) 
    VALUES (@id_prod, @pres, @cant, @precio);
END;
GO

-- Descripción: Actualizar presentación de precio
CREATE PROCEDURE usp_Precios_Update
    @id INT,
    @pres VARCHAR(100),
    @cant DECIMAL(10, 4),
    @precio DECIMAL(10, 4)
AS
BEGIN
    UPDATE dim_producto_precios SET presentacion = @pres, cantidad_base = @cant, precio_venta = @precio 
    WHERE id_precio = @id;
END;
GO

-- Descripción: Eliminar presentación de precio
CREATE PROCEDURE usp_Precios_Delete
    @id INT
AS
BEGIN
    DELETE FROM dim_producto_precios WHERE id_precio = @id;
END;
GO

-- -----------------------------------------------------------------------------------
-- SECCIÓN: SEGURIDAD Y UTILIDADES
-- -----------------------------------------------------------------------------------

-- Descripción: Obtener usuario por nombre de cuenta para login
CREATE PROCEDURE usp_Usuarios_GetByAcc
    @user VARCHAR(100)
AS
BEGIN
    SELECT * FROM dim_usuarios WHERE nombre_cuenta = @user;
END;
GO

-- Descripción: Generar el último código registrado para una tabla/columna (para cálculo de correlativo)
CREATE PROCEDURE usp_Utils_GetNextCode
    @tableName NVARCHAR(128),
    @columnName NVARCHAR(128)
AS
BEGIN
    DECLARE @sql NVARCHAR(MAX);
    -- Usamos SQL dinámico para obtener el último valor de la columna especificada
    SET @sql = N'SELECT TOP 1 ' + QUOTENAME(@columnName) + ' AS NextCode FROM ' + QUOTENAME(@tableName) + ' ORDER BY ' + QUOTENAME(@columnName) + ' DESC';
    EXEC sp_executesql @sql;
END;
GO

-- -----------------------------------------------------------------------------------
-- SECCIÓN: POS (POINT OF SALE)
-- -----------------------------------------------------------------------------------

-- Descripción: Obtener presentaciones activas para un producto (optimizado para POS)
CREATE OR ALTER PROCEDURE [dbo].[usp_Precios_GetByProd_POS]
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

-- Descripción: Insertar Venta (Cabecera y Detalle) usando JSON para los detalles
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
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    BEGIN TRY
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
        
        INSERT INTO [dbo].[fact_ventas_detalle] (
            id_venta, id_producto, Unidad, cantidad, precio_unitario, descuento, subtotal, costo_unitario
        )
        SELECT 
            @id_venta, 
            JSON_VALUE(value, '$.id_producto'), 
            JSON_VALUE(value, '$.unidad'), 
            CAST(JSON_VALUE(value, '$.cantidad') AS DECIMAL(12,4)), 
            CAST(JSON_VALUE(value, '$.precio_unitario') AS DECIMAL(10,4)), 
            CAST(JSON_VALUE(value, '$.descuento') AS DECIMAL(10,4)), 
            CAST(JSON_VALUE(value, '$.subtotal') AS DECIMAL(12,2)), 
            CAST(JSON_VALUE(value, '$.costo_unitario') AS DECIMAL(10,4))
        FROM OPENJSON(@detalles_json);
 
        COMMIT TRANSACTION;
        SELECT @id_venta AS id_venta;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

-- Descripción: Obtener Almacenes activos para el POS
CREATE OR ALTER PROCEDURE [dbo].[usp_Almacenes_Get]
AS
BEGIN
    SET NOCOUNT ON;
    SELECT id_almacen, nombre FROM [dbo].[dim_almacenes] WHERE activo = 1;
END
GO
