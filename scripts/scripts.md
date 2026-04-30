# SQL Database Scripts

## Initial Database Setup

```sql
-- 1. Tabla de Roles (Simplificada en la tabla usuarios, pero definimos los valores)
-- Roles: 'Administrador', 'Operador'

-- 2. Tabla de Usuarios
CREATE TABLE usuarios (
    id INT PRIMARY KEY IDENTITY(1,1),
    nombre_cuenta VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    rol VARCHAR(20) NOT NULL CHECK (rol IN ('Administrador', 'Operador')),
    activo BIT DEFAULT 1,
    fecha_creacion DATETIME DEFAULT GETDATE()
);

-- 3. Tabla de Categorías
CREATE TABLE categorias (
    id INT PRIMARY KEY IDENTITY(1,1),
    nombre VARCHAR(100) NOT NULL,
    descripcion VARCHAR(255)
);

-- 4. Tabla de Productos
CREATE TABLE productos (
    id INT PRIMARY KEY IDENTITY(1,1),
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    descripcion VARCHAR(MAX),
    precio DECIMAL(18, 2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    categoria_id INT,
    fecha_creacion DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (categoria_id) REFERENCES categorias(id)
);

-- 5. Tabla de Ventas
CREATE TABLE ventas (
    id INT PRIMARY KEY IDENTITY(1,1),
    fecha DATETIME DEFAULT GETDATE(),
    usuario_id INT,
    total DECIMAL(18, 2) NOT NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- 6. Detalle de Ventas
CREATE TABLE detalle_ventas (
    id INT PRIMARY KEY IDENTITY(1,1),
    venta_id INT,
    producto_id INT,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(18, 2) NOT NULL,
    subtotal DECIMAL(18, 2) NOT NULL,
    FOREIGN KEY (venta_id) REFERENCES ventas(id),
    FOREIGN KEY (producto_id) REFERENCES productos(id)
);

-- Insertar un usuario administrador por defecto (Password: admin123 - Deberás encriptarlo luego)
INSERT INTO usuarios (nombre_cuenta, password, rol) 
VALUES ('admin', 'admin123', 'Administrador');
```
