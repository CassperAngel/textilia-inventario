import { useState, useRef, useEffect } from "react";
import axios from "axios";

const N8N_CHAT_URL = "http://localhost:5678/webhook/inventario-chat";
const N8N_DB_URL = "http://localhost:5678/webhook/inventario-db";

const SUGERENCIAS = [
  "Informe general del inventario",
  "Productos más vendidos",
  "Productos menos vendidos",
  "Stock por debajo del mínimo",
  "Materias primas por agotarse",
  "Resumen de ventas por cliente",
  "Producto más rentable",
  "Compras de materias primas por proveedor",
  "Clientes que más compran",
  "Valor total del inventario",
];

const TABS = [
  { icon: "💬", label: "Chat IA" },
  { icon: "📦", label: "Productos" },
  { icon: "🧵", label: "Materias Primas" },
  { icon: "💰", label: "Ventas" },
  { icon: "📋", label: "Detalle Venta" },
  { icon: "👥", label: "Clientes" },
  { icon: "🏭", label: "Proveedores" },
  { icon: "🛒", label: "Compras MP" },
];

const emptyProducto = { nombre: "", codigo_sku: "", categoria: "", talla: "", color: "", stock_actual: "", stock_minimo: "", precio_costo: "", precio_venta: "", estado: "activo" };
const emptyMateria = { nombre: "", categoria: "", unidad: "", stock_actual: "", stock_minimo: "", costo_unitario: "", proveedor_id: "" };
const emptyVenta = { cliente_id: "", fecha: new Date().toISOString().split("T")[0], total: "", estado: "pagado", canal: "tienda" };
const emptyDetalle = { venta_id: "", producto_id: "", cantidad: "", precio_unitario: "", subtotal: "" };
const emptyCliente = { nombre: "", tipo: "minorista", dni_ruc: "", telefono: "", direccion: "" };
const emptyProveedor = { nombre: "", ruc: "", contacto: "", telefono: "", direccion: "", activo: 1 };
const emptyCompra = { materia_prima_id: "", proveedor_id: "", cantidad: "", costo_total: "", fecha: new Date().toISOString().split("T")[0] };

export default function App() {
  const [tab, setTab] = useState(0);
  const [messages, setMessages] = useState([
    { role: "assistant", text: "¡Hola! Soy tu asistente de inventario textil 🧵\n\nPuedo analizar todos tus datos y generar informes en Google Sheets. Usa los formularios del menú para registrar productos, ventas, clientes y más.\n\n¿En qué te ayudo hoy?" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => `session-${Date.now()}`);
  const messagesEndRef = useRef(null);

  const [producto, setProducto] = useState(emptyProducto);
  const [materia, setMateria] = useState(emptyMateria);
  const [venta, setVenta] = useState(emptyVenta);
  const [detalle, setDetalle] = useState(emptyDetalle);
  const [cliente, setCliente] = useState(emptyCliente);
  const [proveedor, setProveedor] = useState(emptyProveedor);
  const [compra, setCompra] = useState(emptyCompra);
  const [formStatus, setFormStatus] = useState({ msg: "", ok: true });

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    if (detalle.cantidad && detalle.precio_unitario) {
      const sub = (parseFloat(detalle.cantidad) * parseFloat(detalle.precio_unitario)).toFixed(2);
      setDetalle(d => ({ ...d, subtotal: sub }));
    }
  }, [detalle.cantidad, detalle.precio_unitario]);

  const sendMessage = async (texto) => {
    const msg = texto || input.trim();
    if (!msg) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: msg }]);
    setLoading(true);
    try {
      const res = await axios.post(N8N_CHAT_URL, { chatInput: msg, sessionId });
      const respuesta = res.data?.output || res.data?.text || res.data?.message || (typeof res.data === "string" ? res.data : "✅ Informe generado y enviado a Google Sheets");
      setMessages(prev => [...prev, { role: "assistant", text: respuesta }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", text: "⚠️ Error conectando con n8n. Verifica que esté corriendo en localhost:5678." }]);
    }
    setLoading(false);
  };

  const submitForm = async (tabla, datos, reset) => {
    setFormStatus({ msg: "Guardando...", ok: true });
    try {
      await axios.post(N8N_DB_URL, { tabla, datos });
      setFormStatus({ msg: "✅ Guardado correctamente en la base de datos", ok: true });
      reset();
    } catch {
      setFormStatus({ msg: "⚠️ Error al guardar. Verifica que n8n esté activo.", ok: false });
    }
    setTimeout(() => setFormStatus({ msg: "", ok: true }), 4000);
  };

  const Field = ({ label, value, onChange, type = "text", placeholder = "", options = null, span = false }) => (
    <div style={{ ...s.field, ...(span ? { gridColumn: "span 2" } : {}) }}>
      <label style={s.label}>{label}</label>
      {options ? (
        <select style={s.inputForm} value={value} onChange={e => onChange(e.target.value)}>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : (
        <input style={s.inputForm} type={type} placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} />
      )}
    </div>
  );

  const FormWrapper = ({ title, icon, children, onSubmit }) => (
    <div style={s.formWrap}>
      <div style={s.formHeader}>
        <span style={{ fontSize: 24 }}>{icon}</span>
        <h2 style={s.formTitle}>{title}</h2>
      </div>
      <div style={s.grid2}>{children}</div>
      <button style={s.submitBtn} onClick={onSubmit}>Guardar registro</button>
      {formStatus.msg && <div style={{ ...s.formStatus, color: formStatus.ok ? "#6ee7b7" : "#f87171" }}>{formStatus.msg}</div>}
    </div>
  );

  return (
    <div style={s.root}>
      <aside style={s.sidebar}>
        <div style={s.logo}>
          <span style={{ fontSize: 28 }}>🧵</span>
          <div>
            <div style={s.logoTitle}>TextilIA</div>
            <div style={s.logoSub}>Gestión Inteligente</div>
          </div>
        </div>
        <nav style={s.nav}>
          {TABS.map((t, i) => (
            <button key={i} style={{ ...s.navBtn, ...(tab === i ? s.navBtnActive : {}) }} onClick={() => setTab(i)}>
              <span style={{ fontSize: 15 }}>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </nav>
        <div style={s.sidebarFooter}>
          <div style={s.statusDot} />
          <span style={{ fontSize: 11, color: "#6ee7b7" }}>Sistema activo</span>
        </div>
      </aside>

      <main style={s.main}>

        {tab === 0 && (
          <div style={s.chatWrap}>
            <div style={s.chatHeader}>
              <div style={s.chatTitle}>Asistente de Inventario</div>
              <div style={s.chatSub}>Google Gemini · Informes automáticos a Google Sheets</div>
            </div>
            <div style={s.chips}>
              {SUGERENCIAS.map((sg, i) => (
                <button key={i} style={s.chip} onClick={() => sendMessage(sg)}>{sg}</button>
              ))}
            </div>
            <div style={s.messages}>
              {messages.map((m, i) => (
                <div key={i} style={{ ...s.msgRow, justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                  {m.role === "assistant" && <div style={s.avatar}>🤖</div>}
                  <div style={{ ...s.bubble, ...(m.role === "user" ? s.bubbleUser : s.bubbleAI) }}>{m.text}</div>
                </div>
              ))}
              {loading && (
                <div style={{ ...s.msgRow, justifyContent: "flex-start" }}>
                  <div style={s.avatar}>🤖</div>
                  <div style={{ ...s.bubble, ...s.bubbleAI }}>
                    <span style={{ color: "#94a3b8", fontSize: 13 }}>Analizando datos y generando informe</span>
                    <span style={{ color: "#38bdf8" }}> ...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <div style={s.inputRow}>
              <input style={s.input} placeholder="Pregunta algo sobre tu inventario..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()} />
              <button style={s.sendBtn} onClick={() => sendMessage()} disabled={loading}>{loading ? "⏳" : "➤"}</button>
            </div>
          </div>
        )}

        {tab === 1 && (
          <FormWrapper title="Registrar Producto Terminado" icon="📦" onSubmit={() => submitForm("productos", producto, () => setProducto(emptyProducto))}>
            <Field label="Nombre del producto" value={producto.nombre} onChange={v => setProducto({ ...producto, nombre: v })} placeholder="Polo básico algodón" />
            <Field label="Código SKU" value={producto.codigo_sku} onChange={v => setProducto({ ...producto, codigo_sku: v })} placeholder="POL-BAS-M-BL" />
            <Field label="Categoría" value={producto.categoria} onChange={v => setProducto({ ...producto, categoria: v })} options={[{value:"Polo",label:"Polo"},{value:"Pantalón",label:"Pantalón"},{value:"Casaca",label:"Casaca"},{value:"Camisa",label:"Camisa"},{value:"Vestido",label:"Vestido"},{value:"Accesorio",label:"Accesorio"},{value:"Otro",label:"Otro"}]} />
            <Field label="Talla" value={producto.talla} onChange={v => setProducto({ ...producto, talla: v })} options={[{value:"XS",label:"XS"},{value:"S",label:"S"},{value:"M",label:"M"},{value:"L",label:"L"},{value:"XL",label:"XL"},{value:"XXL",label:"XXL"},{value:"Único",label:"Único"}]} />
            <Field label="Color" value={producto.color} onChange={v => setProducto({ ...producto, color: v })} placeholder="Blanco" />
            <Field label="Estado" value={producto.estado} onChange={v => setProducto({ ...producto, estado: v })} options={[{value:"activo",label:"Activo"},{value:"descontinuado",label:"Descontinuado"}]} />
            <Field label="Stock actual (unidades)" value={producto.stock_actual} onChange={v => setProducto({ ...producto, stock_actual: v })} type="number" placeholder="50" />
            <Field label="Stock mínimo (unidades)" value={producto.stock_minimo} onChange={v => setProducto({ ...producto, stock_minimo: v })} type="number" placeholder="10" />
            <Field label="Precio costo (S/)" value={producto.precio_costo} onChange={v => setProducto({ ...producto, precio_costo: v })} type="number" placeholder="18.00" />
            <Field label="Precio venta (S/)" value={producto.precio_venta} onChange={v => setProducto({ ...producto, precio_venta: v })} type="number" placeholder="35.00" />
          </FormWrapper>
        )}

        {tab === 2 && (
          <FormWrapper title="Registrar Materia Prima" icon="🧵" onSubmit={() => submitForm("materias_primas", materia, () => setMateria(emptyMateria))}>
            <Field label="Nombre" value={materia.nombre} onChange={v => setMateria({ ...materia, nombre: v })} placeholder="Tela drill" />
            <Field label="Categoría" value={materia.categoria} onChange={v => setMateria({ ...materia, categoria: v })} options={[{value:"Tela",label:"Tela"},{value:"Hilo",label:"Hilo"},{value:"Accesorio",label:"Accesorio"},{value:"Insumo",label:"Insumo"},{value:"Empaque",label:"Empaque"},{value:"Otro",label:"Otro"}]} />
            <Field label="Unidad de medida" value={materia.unidad} onChange={v => setMateria({ ...materia, unidad: v })} options={[{value:"metros",label:"Metros"},{value:"kg",label:"Kilogramos"},{value:"cono",label:"Conos"},{value:"unidad",label:"Unidades"},{value:"rollo",label:"Rollos"},{value:"litros",label:"Litros"}]} />
            <Field label="ID Proveedor" value={materia.proveedor_id} onChange={v => setMateria({ ...materia, proveedor_id: v })} type="number" placeholder="1" />
            <Field label="Stock actual" value={materia.stock_actual} onChange={v => setMateria({ ...materia, stock_actual: v })} type="number" placeholder="150" />
            <Field label="Stock mínimo" value={materia.stock_minimo} onChange={v => setMateria({ ...materia, stock_minimo: v })} type="number" placeholder="30" />
            <Field label="Costo unitario (S/)" value={materia.costo_unitario} onChange={v => setMateria({ ...materia, costo_unitario: v })} type="number" placeholder="8.50" />
          </FormWrapper>
        )}

        {tab === 3 && (
          <FormWrapper title="Registrar Venta" icon="💰" onSubmit={() => submitForm("ventas", venta, () => setVenta(emptyVenta))}>
            <Field label="ID Cliente" value={venta.cliente_id} onChange={v => setVenta({ ...venta, cliente_id: v })} type="number" placeholder="1" />
            <Field label="Fecha" value={venta.fecha} onChange={v => setVenta({ ...venta, fecha: v })} type="date" />
            <Field label="Total (S/)" value={venta.total} onChange={v => setVenta({ ...venta, total: v })} type="number" placeholder="350.00" />
            <Field label="Estado" value={venta.estado} onChange={v => setVenta({ ...venta, estado: v })} options={[{value:"pagado",label:"Pagado"},{value:"pendiente",label:"Pendiente"},{value:"anulado",label:"Anulado"}]} />
            <Field label="Canal de venta" value={venta.canal} onChange={v => setVenta({ ...venta, canal: v })} options={[{value:"tienda",label:"Tienda física"},{value:"mayorista",label:"Mayorista"},{value:"delivery",label:"Delivery"},{value:"online",label:"Online"},{value:"feria",label:"Feria"}]} />
            <div style={{ gridColumn: "span 2", background: "#1e2736", borderRadius: 8, padding: "10px 14px" }}>
              <span style={{ fontSize: 12, color: "#6b7280" }}>💡 Después de guardar la venta, registra el detalle de productos en la pestaña <b style={{color:"#94a3b8"}}>Detalle Venta</b> usando el ID de esta venta.</span>
            </div>
          </FormWrapper>
        )}

        {tab === 4 && (
          <FormWrapper title="Registrar Detalle de Venta" icon="📋" onSubmit={() => submitForm("detalle_ventas", detalle, () => setDetalle(emptyDetalle))}>
            <Field label="ID Venta" value={detalle.venta_id} onChange={v => setDetalle({ ...detalle, venta_id: v })} type="number" placeholder="1" />
            <Field label="ID Producto" value={detalle.producto_id} onChange={v => setDetalle({ ...detalle, producto_id: v })} type="number" placeholder="1" />
            <Field label="Cantidad vendida" value={detalle.cantidad} onChange={v => setDetalle({ ...detalle, cantidad: v })} type="number" placeholder="10" />
            <Field label="Precio unitario (S/)" value={detalle.precio_unitario} onChange={v => setDetalle({ ...detalle, precio_unitario: v })} type="number" placeholder="35.00" />
            <div style={s.field}>
              <label style={s.label}>Subtotal (S/) — calculado automático</label>
              <input style={{ ...s.inputForm, background: "#0f1117", color: "#6b7280" }} value={detalle.subtotal} readOnly />
            </div>
            <div style={{ background: "#1e2736", borderRadius: 8, padding: "10px 14px" }}>
              <span style={{ fontSize: 12, color: "#6b7280" }}>💡 Puedes agregar varios productos a la misma venta con el mismo ID de venta.</span>
            </div>
          </FormWrapper>
        )}

        {tab === 5 && (
          <FormWrapper title="Registrar Cliente" icon="👥" onSubmit={() => submitForm("clientes", cliente, () => setCliente(emptyCliente))}>
            <Field label="Nombre o razón social" value={cliente.nombre} onChange={v => setCliente({ ...cliente, nombre: v })} placeholder="Tienda Moda Express" span />
            <Field label="Tipo de cliente" value={cliente.tipo} onChange={v => setCliente({ ...cliente, tipo: v })} options={[{value:"minorista",label:"Minorista"},{value:"mayorista",label:"Mayorista"},{value:"tienda",label:"Tienda"},{value:"exportacion",label:"Exportación"}]} />
            <Field label="DNI o RUC" value={cliente.dni_ruc} onChange={v => setCliente({ ...cliente, dni_ruc: v })} placeholder="20456789012" />
            <Field label="Teléfono" value={cliente.telefono} onChange={v => setCliente({ ...cliente, telefono: v })} placeholder="945678901" />
            <Field label="Dirección" value={cliente.direccion} onChange={v => setCliente({ ...cliente, direccion: v })} placeholder="Av. Gamarra 123, La Victoria" span />
          </FormWrapper>
        )}

        {tab === 6 && (
          <FormWrapper title="Registrar Proveedor" icon="🏭" onSubmit={() => submitForm("proveedores", proveedor, () => setProveedor(emptyProveedor))}>
            <Field label="Nombre o razón social" value={proveedor.nombre} onChange={v => setProveedor({ ...proveedor, nombre: v })} placeholder="Textiles Lima SAC" span />
            <Field label="RUC" value={proveedor.ruc} onChange={v => setProveedor({ ...proveedor, ruc: v })} placeholder="20123456789" />
            <Field label="Nombre del contacto" value={proveedor.contacto} onChange={v => setProveedor({ ...proveedor, contacto: v })} placeholder="Carlos Ríos" />
            <Field label="Teléfono" value={proveedor.telefono} onChange={v => setProveedor({ ...proveedor, telefono: v })} placeholder="987654321" />
            <Field label="Dirección" value={proveedor.direccion} onChange={v => setProveedor({ ...proveedor, direccion: v })} placeholder="Jr. Prolongación Huánuco 234" span />
            <Field label="Estado" value={proveedor.activo} onChange={v => setProveedor({ ...proveedor, activo: v })} options={[{value:1,label:"Activo"},{value:0,label:"Inactivo"}]} />
          </FormWrapper>
        )}

        {tab === 7 && (
          <FormWrapper title="Registrar Compra de Materia Prima" icon="🛒" onSubmit={() => submitForm("compras_materia_prima", compra, () => setCompra(emptyCompra))}>
            <Field label="ID Materia Prima" value={compra.materia_prima_id} onChange={v => setCompra({ ...compra, materia_prima_id: v })} type="number" placeholder="1" />
            <Field label="ID Proveedor" value={compra.proveedor_id} onChange={v => setCompra({ ...compra, proveedor_id: v })} type="number" placeholder="1" />
            <Field label="Cantidad comprada" value={compra.cantidad} onChange={v => setCompra({ ...compra, cantidad: v })} type="number" placeholder="100" />
            <Field label="Costo total (S/)" value={compra.costo_total} onChange={v => setCompra({ ...compra, costo_total: v })} type="number" placeholder="850.00" />
            <Field label="Fecha de compra" value={compra.fecha} onChange={v => setCompra({ ...compra, fecha: v })} type="date" />
            <div style={{ background: "#1e2736", borderRadius: 8, padding: "10px 14px" }}>
              <span style={{ fontSize: 12, color: "#6b7280" }}>💡 Registrar compras permite a Gemini analizar gasto en insumos y frecuencia de reposición.</span>
            </div>
          </FormWrapper>
        )}

      </main>
    </div>
  );
}

const s = {
  root: { display: "flex", height: "100vh", fontFamily: "'DM Sans','Segoe UI',sans-serif", background: "#0f1117", color: "#f1f5f9" },
  sidebar: { width: 200, background: "#161b27", borderRight: "1px solid #1e2736", display: "flex", flexDirection: "column", padding: "20px 12px", gap: 4, overflowY: "auto" },
  logo: { display: "flex", alignItems: "center", gap: 10, marginBottom: 24, paddingLeft: 4 },
  logoTitle: { fontSize: 15, fontWeight: 700, color: "#f1f5f9" },
  logoSub: { fontSize: 10, color: "#4b5563" },
  nav: { display: "flex", flexDirection: "column", gap: 2 },
  navBtn: { background: "transparent", border: "none", color: "#6b7280", padding: "9px 10px", borderRadius: 8, textAlign: "left", cursor: "pointer", fontSize: 12, fontWeight: 500, display: "flex", alignItems: "center", gap: 8 },
  navBtnActive: { background: "#1e2d40", color: "#38bdf8" },
  sidebarFooter: { marginTop: "auto", display: "flex", alignItems: "center", gap: 6, paddingLeft: 4, paddingTop: 12 },
  statusDot: { width: 7, height: 7, borderRadius: "50%", background: "#6ee7b7", boxShadow: "0 0 6px #6ee7b7" },
  main: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" },
  chatWrap: { display: "flex", flexDirection: "column", height: "100%", padding: "20px 28px" },
  chatHeader: { marginBottom: 14, paddingBottom: 14, borderBottom: "1px solid #1e2736" },
  chatTitle: { fontSize: 18, fontWeight: 700, color: "#f1f5f9" },
  chatSub: { fontSize: 11, color: "#4b5563", marginTop: 2 },
  chips: { display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 },
  chip: { background: "#1e2736", border: "1px solid #2d3748", color: "#94a3b8", padding: "4px 11px", borderRadius: 20, fontSize: 11, cursor: "pointer" },
  messages: { flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12, paddingRight: 4 },
  msgRow: { display: "flex", alignItems: "flex-end", gap: 8 },
  avatar: { fontSize: 18, flexShrink: 0 },
  bubble: { maxWidth: "72%", padding: "10px 14px", borderRadius: 12, fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-wrap" },
  bubbleAI: { background: "#1e2736", color: "#cbd5e1", borderBottomLeftRadius: 4 },
  bubbleUser: { background: "#0369a1", color: "#f0f9ff", borderBottomRightRadius: 4 },
  inputRow: { display: "flex", gap: 8, marginTop: 14, paddingTop: 14, borderTop: "1px solid #1e2736" },
  input: { flex: 1, background: "#1e2736", border: "1px solid #2d3748", borderRadius: 10, padding: "11px 15px", color: "#f1f5f9", fontSize: 13, outline: "none" },
  sendBtn: { background: "#0369a1", border: "none", borderRadius: 10, padding: "0 18px", color: "#fff", fontSize: 18, cursor: "pointer" },
  formWrap: { padding: "28px 36px", overflowY: "auto", flex: 1 },
  formHeader: { display: "flex", alignItems: "center", gap: 10, marginBottom: 24, paddingBottom: 16, borderBottom: "1px solid #1e2736" },
  formTitle: { fontSize: 18, fontWeight: 700, color: "#f1f5f9", margin: 0 },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, maxWidth: 680 },
  field: { display: "flex", flexDirection: "column", gap: 5 },
  label: { fontSize: 11, color: "#6b7280", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.4px" },
  inputForm: { background: "#1e2736", border: "1px solid #2d3748", borderRadius: 8, padding: "10px 12px", color: "#f1f5f9", fontSize: 13, outline: "none" },
  submitBtn: { marginTop: 20, background: "#0369a1", border: "none", borderRadius: 10, padding: "11px 26px", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" },
  formStatus: { marginTop: 10, fontSize: 13 },
};