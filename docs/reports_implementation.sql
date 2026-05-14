-- Project: Wevini App - Reports Implementation
-- Version 1.0

CREATE OR ALTER PROCEDURE [dbo].[usp_Reportes_Ventas]
    @fecha_inicio DATETIME = NULL,
    @fecha_fin DATETIME = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        v.id_venta,
        c.razon_social AS nombre_cliente,
        ISNULL(t.c_describe, 'OTRO') AS tipo_venta_nombre,
        v.fecha_venta,
        v.total,
        v.monto_pagado,
        v.estado
    FROM [dbo].[fact_ventas] v
    JOIN [dbo].[dim_clientes] c ON v.id_cliente = c.id_cliente
    LEFT JOIN [dbo].[Tablas] t ON v.tipo_venta = t.n_numero AND t.n_codtabla = 5
    WHERE (@fecha_inicio IS NULL OR v.fecha_venta >= @fecha_inicio)
      AND (@fecha_fin IS NULL OR v.fecha_venta <= @fecha_fin)
    ORDER BY v.fecha_venta DESC;
END
GO
