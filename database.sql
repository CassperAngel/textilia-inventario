-- ============================================================
--  TextilIA — Script de Base de Datos
--  Motor: MySQL 8+
--  Descripción: Sistema de gestión de inventario para MYPE textil
-- ============================================================

CREATE DATABASE IF NOT EXISTS inventario_textil
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE inventario_textil;

-- ── 1. CLIENTES ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS clientes (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  nombre       VARCHAR(150) NOT NULL,
  tipo         ENUM('minorista','mayorista','frecuente') DEFAULT 'minorista',
  telefono     VARCHAR(20),
  direccion    VARCHAR(255),
  email        VARCHAR(120),
  creado_en    DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ── 2. PROVEEDORES ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS proveedores (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  nombre       VARCHAR(150) NOT NULL,
  ruc          VARCHAR(11),
  contacto     VARCHAR(100),
  telefono     VARCHAR(20),
  email        VARCHAR(120),
  creado_en    DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ── 3. PRODUCTOS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS productos (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  nombre        VARCHAR(150) NOT NULL,
  codigo_sku    VARCHAR(50) UNIQUE,
  categoria     VARCHAR(80),
  talla         VARCHAR(10),
  color         VARCHAR(50),
  stock_actual  INT DEFAULT 0,
  stock_minimo  INT DEFAULT 0,
  precio_costo  DECIMAL(10,2) DEFAULT 0.00,
  precio_venta  DECIMAL(10,2) DEFAULT 0.00,
  estado        ENUM('activo','descontinuado') DEFAULT 'activo',
  creado_en     DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ── 4. MATERIAS PRIMAS ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS materias_primas (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  nombre         VARCHAR(150) NOT NULL,
  categoria      VARCHAR(80),
  unidad         VARCHAR(30),
  stock_actual   DECIMAL(10,2) DEFAULT 0,
  stock_minimo   DECIMAL(10,2) DEFAULT 0,
  costo_unitario DECIMAL(10,2) DEFAULT 0.00,
  proveedor_id   INT,
  creado_en      DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (proveedor_id) REFERENCES proveedores(id)
);

-- ── 5. VENTAS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ventas (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  cliente_id   INT NOT NULL,
  fecha        DATE NOT NULL,
  total        DECIMAL(10,2) DEFAULT 0.00,
  estado       ENUM('pagado','pendiente','anulado') DEFAULT 'pagado',
  canal        ENUM('tienda','mayorista','delivery') DEFAULT 'tienda',
  creado_en    DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cliente_id) REFERENCES clientes(id)
);

-- ── 6. DETALLE DE VENTAS ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS detalle_ventas (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  venta_id         INT NOT NULL,
  producto_id      INT NOT NULL,
  cantidad         INT NOT NULL,
  precio_unitario  DECIMAL(10,2) NOT NULL,
  subtotal         DECIMAL(10,2) GENERATED ALWAYS AS (cantidad * precio_unitario) STORED,
  FOREIGN KEY (venta_id)    REFERENCES ventas(id),
  FOREIGN KEY (producto_id) REFERENCES productos(id)
);

-- ── 7. COMPRAS DE MATERIA PRIMA ──────────────────────────────
CREATE TABLE IF NOT EXISTS compras_materia_prima (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  materia_prima_id INT NOT NULL,
  proveedor_id     INT NOT NULL,
  cantidad         DECIMAL(10,2) NOT NULL,
  costo_total      DECIMAL(10,2) NOT NULL,
  fecha            DATE NOT NULL,
  creado_en        DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (materia_prima_id) REFERENCES materias_primas(id),
  FOREIGN KEY (proveedor_id)     REFERENCES proveedores(id)
);

-- ============================================================
--  DATOS DE EJEMPLO
-- ============================================================

INSERT INTO clientes (nombre, tipo, telefono, email) VALUES
  ('Juan Pérez', 'minorista', '987654321', 'juan@email.com'),
  ('Distribuidora Norte SAC', 'mayorista', '01-4561234', 'norte@empresa.com'),
  ('María Quispe', 'frecuente', '976543210', 'maria@email.com');

INSERT INTO proveedores (nombre, ruc, contacto, telefono) VALUES
  ('Textiles del Norte SAC', '20123456789', 'Carlos López', '01-3456789'),
  ('Insumos Gamarra EIRL', '20987654321', 'Rosa Flores', '01-2345678');

INSERT INTO productos (nombre, codigo_sku, categoria, talla, color, stock_actual, stock_minimo, precio_costo, precio_venta) VALUES
  ('Polo básico algodón', 'POL-BAS-M-BL', 'Polo', 'M', 'Blanco', 50, 10, 18.00, 35.00),
  ('Polo básico algodón', 'POL-BAS-L-NG', 'Polo', 'L', 'Negro',  30, 10, 18.00, 35.00),
  ('Pantalón drill',      'PAN-DRI-32-AZ','Pantalón','32','Azul', 20,  5, 45.00, 85.00),
  ('Casaca deportiva',    'CAS-DEP-M-RJ', 'Casaca',  'M', 'Rojo',  8,  5, 60.00,120.00),
  ('Short deportivo',     'SHO-DEP-S-GR', 'Short',   'S', 'Gris',  3,  8, 20.00, 40.00);

INSERT INTO materias_primas (nombre, categoria, unidad, stock_actual, stock_minimo, costo_unitario, proveedor_id) VALUES
  ('Tela drill azul',    'Tela',      'metros',   150, 30, 8.50, 1),
  ('Tela algodón blanco','Tela',      'metros',   200, 50, 6.00, 1),
  ('Hilo blanco 40/2',   'Hilo',      'conos',     40, 10, 3.50, 2),
  ('Cierre YKK 20cm',    'Accesorio', 'unidades',  80, 20, 0.80, 2),
  ('Elástico 2cm',       'Accesorio', 'metros',    15, 25, 0.50, 2);

INSERT INTO ventas (cliente_id, fecha, total, estado, canal) VALUES
  (1, CURDATE(),                          105.00, 'pagado',   'tienda'),
  (2, CURDATE(),                          510.00, 'pagado',   'mayorista'),
  (3, DATE_SUB(CURDATE(), INTERVAL 2 DAY), 35.00, 'pagado',  'tienda');

INSERT INTO detalle_ventas (venta_id, producto_id, cantidad, precio_unitario) VALUES
  (1, 1, 2, 35.00),
  (1, 5, 1, 40.00),
  (2, 3, 6, 85.00),
  (3, 1, 1, 35.00);

INSERT INTO compras_materia_prima (materia_prima_id, proveedor_id, cantidad, costo_total, fecha) VALUES
  (1, 1, 100, 850.00, CURDATE()),
  (2, 1, 150, 900.00, DATE_SUB(CURDATE(), INTERVAL 5 DAY)),
  (3, 2,  20,  70.00, DATE_SUB(CURDATE(), INTERVAL 3 DAY));
