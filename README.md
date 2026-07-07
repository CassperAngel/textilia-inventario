# TextilIA — Asistente de Inventario para MYPE Textil

Sistema de gestión de inventario inteligente con chat en lenguaje natural, informes automáticos a Google Sheets y formularios de registro de datos.

---

## 🧩 Tecnologías utilizadas

| Capa | Tecnología |
|------|-----------|
| Frontend | React (Vite) + JavaScript |
| Orquestación | n8n (automatización de flujos) |
| Base de datos | MySQL 8+ |
| Inteligencia artificial | Google Gemini 2.5 Flash |
| Exportación de informes | Google Sheets API |
| Despliegue | Vercel (frontend) / Railway (n8n) |

---

## 📁 Estructura del repositorio

```
inventario-textil/
├── src/
│   └── App.js              # Frontend principal (React)
├── flujo-n8n.json          # Flujo exportado de n8n
├── database.sql            # Script de creación de tablas y datos de ejemplo
├── .env.example            # Variables de entorno necesarias
└── README.md
```

---

## ⚙️ Instalación y configuración

### 1. Base de datos MySQL

```bash
mysql -u root -p < database.sql
```

Esto crea la base de datos `inventario_textil` con todas las tablas y datos de ejemplo.

### 2. Frontend React

```bash
npm install
npm run dev
```

Abre `http://localhost:5173` en tu navegador.

### 3. n8n

1. Instala n8n: `npm install -g n8n`
2. Inicia n8n: `n8n start`
3. Abre `http://localhost:5678`
4. Importa el archivo `flujo-n8n.json` (menú → Import workflow)
5. Configura las credenciales de MySQL y Google Sheets dentro de n8n

---

## 🔑 Variables de entorno

Crea un archivo `.env` en la raíz del proyecto basándote en `.env.example`:

```env
VITE_N8N_CHAT_URL=http://localhost:5678/webhook/TU_WEBHOOK_ID/chat
VITE_N8N_DB_URL=http://localhost:5678/webhook/inventario-db
```

---

## 💬 Funcionalidades del chat

El asistente responde preguntas en lenguaje natural como:

- *"¿Qué productos tienen stock bajo?"*
- *"¿Cuáles son los productos más vendidos?"*
- *"Dame un informe general del inventario"*
- *"¿Qué materia prima está por agotarse?"*
- *"¿Cuál es el producto más rentable?"*

Cada consulta genera automáticamente un informe en Google Sheets.

---

## 📋 Módulos de registro

| Pestaña | Descripción |
|---------|-------------|
| 📦 Productos | Registrar productos terminados |
| 🧵 Materias Primas | Registrar insumos |
| 💰 Ventas | Registrar cabecera de venta |
| 🧾 Detalle Venta | Registrar productos por venta |
| 👥 Clientes | Registrar clientes |
| 🏭 Proveedores | Registrar proveedores |
| 🛒 Compras MP | Registrar reposición de materias primas |

---

## 🗄️ Modelo de base de datos

```
clientes ──< ventas ──< detalle_ventas >── productos
proveedores ──< materias_primas
proveedores ──< compras_materia_prima >── materias_primas
```

---

## 👤 Autor

Proyecto desarrollado como parte de trabajo de investigación para la gestión de inventarios en MYPE textil peruana.
