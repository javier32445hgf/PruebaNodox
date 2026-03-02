let ordenActual = null;
let inventario = [];
let materialSeleccionadoEdit = null;
let materialesEdit = [];

document.addEventListener("DOMContentLoaded", () => {
  cargarOrdenes();
  cargarInventario();

  // cerrar con ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      cerrarModal();
      cerrarModalEditar();
    }
  });

  document.getElementById("edit-buscar-material")?.addEventListener("input", mostrarSugerenciasEdit);
  document.getElementById("btn-edit-agregar")?.addEventListener("click", agregarMaterialEdit);
  document.getElementById("edit-iva-tipo")?.addEventListener("change", recalcularTotalesEdit);

  // Pago
  document.getElementById("edit-anticipo")?.addEventListener("input", recalcularTotalesEdit);
  document.getElementById("edit-metodo-pago")?.addEventListener("change", recalcularTotalesEdit);
});

// ---------- helpers ----------
const v = (x) => (x && String(x).trim().length ? String(x) : "—");
const clean = (t) => String(t ?? "—").replace(/\s+/g, " ").trim();
const toNum = (x, def = 0) => {
  const n = Number(x);
  return Number.isFinite(n) ? n : def;
};
const toMoney = (n) => toNum(n, 0).toFixed(2);

// -----------------------------
// 1) LISTAR ORDENES
// -----------------------------
async function cargarOrdenes() {
  try {
    const res = await fetch("http://localhost:3000/ordenes/listar");
    const ordenes = await res.json();
    pintarTabla(ordenes);
  } catch (err) {
    console.error("Error cargando órdenes:", err);
  }
}

function pintarTabla(lista) {
  const tbody = document.getElementById("tabla-ordenes");
  tbody.innerHTML = "";

  lista.forEach((o) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${o.id}</td>
      <td>${o.estado}</td>
      <td>${o.fecha_creacion}</td>
      <td>${o.descripcion || "—"}</td>
      <td>
        <button class="btn-ver" onclick="verDetalle(${o.id})">Ver</button>
        <button class="btn-eliminar" onclick="eliminarOrden(${o.id})">Eliminar</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// -----------------------------
// 2) VER DETALLE
// -----------------------------
async function verDetalle(id) {
  try {
    const res = await fetch(`http://localhost:3000/ordenes/detalle/${id}`);
    const data = await res.json();

    if (!data || data.error) {
      alert("No se encontró la orden.");
      return;
    }

    const notas = data.notas_produccion || {};
    const info = notas.cliente_info || {};

    // ✅ ordenActual completo
    ordenActual = {
      id: data.id,
      estado: data.estado,
      fecha_creacion: data.fecha_creacion || "",

      fecha_entrada: info.fecha_entrada || "",
      tiempo_entrega: info.tiempo_entrega || "",
      cliente: info.cliente || "",
      contacto: info.contacto || "",
      mail: info.mail || "",
      direccion: info.direccion || "",
      rfc: info.rfc || "",
      tel: info.tel || "",

      descripcion: data.descripcion || "",
      notas_extra: notas.notas_extra || "",

      materiales: Array.isArray(notas.materiales) ? notas.materiales : [],
      subtotal: toNum(notas.subtotal, 0),
      iva: toNum(notas.iva, 0),
      total: toNum(notas.total, 0),
      iva_porcentaje: toNum(notas.iva_porcentaje, 8),

      metodo_pago: notas.metodo_pago || "Efectivo",
      anticipo: toNum(notas.anticipo, 0),
      saldo: (notas.saldo !== undefined && notas.saldo !== null)
        ? toNum(notas.saldo, Math.max(toNum(notas.total, 0) - toNum(notas.anticipo, 0), 0))
        : Math.max(toNum(notas.total, 0) - toNum(notas.anticipo, 0), 0),
    };

    // Render modal
    let html = `
      <p><strong>ID:</strong> ${ordenActual.id}</p>
      <p><strong>Estado:</strong> ${ordenActual.estado}</p>
      <p><strong>Descripción / Nota del trabajo:</strong> ${v(ordenActual.descripcion)}</p>

      <div class="ot-sep"></div>

      <h3>Datos para entrega / cliente</h3>
      <div class="ot-grid">
        <p><strong>Fecha de entrada:</strong> ${v(ordenActual.fecha_entrada)}</p>
        <p><strong>Tiempo estimado:</strong> ${v(ordenActual.tiempo_entrega)}</p>

        <p><strong>Cliente:</strong> ${v(ordenActual.cliente)}</p>
        <p><strong>Contacto:</strong> ${v(ordenActual.contacto)}</p>

        <p><strong>Mail:</strong> ${v(ordenActual.mail)}</p>
        <p><strong>Tel:</strong> ${v(ordenActual.tel)}</p>

        <p><strong>RFC:</strong> ${v(ordenActual.rfc)}</p>
        <p><strong>Dirección:</strong> ${v(ordenActual.direccion)}</p>
      </div>

      <div class="ot-sep"></div>
      <h3>Materiales / Artículos</h3>
    `;

    if (!ordenActual.materiales.length) {
      html += `<p>—</p>`;
    } else {
      ordenActual.materiales.forEach((m) => {
        const unidadLabel =
          m.unidad === "m2" ? "m²" :
          m.unidad === "hora" ? "Hora" :
          (m.unidad || "Pieza");

        const medidaLabel =
          (m.unidad === "m2" && m.ancho && m.alto)
            ? `${toNum(m.ancho).toFixed(2)} x ${toNum(m.alto).toFixed(2)}`
            : "—";

        html += `
          <p>• <strong>${v(m.nombre)}</strong>
          — Cant: ${v(m.cantidad)}
          — Unidad: ${unidadLabel}
          — Medida: ${medidaLabel}
          — P.Unit: $${toMoney(m.precio)}
          — Importe: $${toMoney(m.total)}</p>
        `;
      });
    }

    html += `
      <div class="ot-sep"></div>
      <p><strong>Notas extra:</strong> ${v(ordenActual.notas_extra)}</p>

      <div class="ot-sep"></div>
      <p><strong>Subtotal:</strong> $${toMoney(ordenActual.subtotal)}</p>
      <p><strong>IVA (${ordenActual.iva_porcentaje}%):</strong> $${toMoney(ordenActual.iva)}</p>
      <p><strong>Total:</strong> $${toMoney(ordenActual.total)}</p>

      <div class="ot-sep"></div>
      <p><strong>Método de pago:</strong> ${v(ordenActual.metodo_pago)}</p>
      <p><strong>Anticipo:</strong> $${toMoney(ordenActual.anticipo)}</p>
      <p><strong>Saldo pendiente:</strong> $${toMoney(ordenActual.saldo)}</p>
    `;

    document.getElementById("detalle-contenido").innerHTML = html;
    document.getElementById("modal-detalle").classList.add("show");
  } catch (err) {
    console.error("Error detalle:", err);
    alert("No se pudo cargar el detalle.");
  }
}

function cerrarModal() {
  document.getElementById("modal-detalle").classList.remove("show");
}

// -----------------------------
// 3) ABRIR EDITAR
// -----------------------------
function abrirEditarDesdeDetalle() {
  if (!ordenActual) return alert("Abre una orden primero.");
  cerrarModal();
  abrirModalEditar();
}

function abrirModalEditar() {
  // Cliente
  document.getElementById("edit-fecha-entrada").value = ordenActual.fecha_entrada || "";
  document.getElementById("edit-tiempo-entrega").value = ordenActual.tiempo_entrega || "";
  document.getElementById("edit-cliente").value = ordenActual.cliente || "";
  document.getElementById("edit-contacto").value = ordenActual.contacto || "";
  document.getElementById("edit-mail").value = ordenActual.mail || "";
  document.getElementById("edit-direccion").value = ordenActual.direccion || "";
  document.getElementById("edit-rfc").value = ordenActual.rfc || "";
  document.getElementById("edit-tel").value = ordenActual.tel || "";

  document.getElementById("edit-descripcion").value = ordenActual.descripcion || "";
  document.getElementById("edit-notas-extra").value = ordenActual.notas_extra || "";

  // IVA
  const ivaDec = (toNum(ordenActual.iva_porcentaje) >= 15) ? 0.15 : 0.08;
  document.getElementById("edit-iva-tipo").value = String(ivaDec);

  // Pago (si existen en tu HTML)
  if (document.getElementById("edit-metodo-pago")) {
    document.getElementById("edit-metodo-pago").value = ordenActual.metodo_pago || "Efectivo";
  }
  if (document.getElementById("edit-anticipo")) {
    document.getElementById("edit-anticipo").value = String(ordenActual.anticipo || 0);
  }

  // Materiales
  materialesEdit = JSON.parse(JSON.stringify(ordenActual.materiales || []));
  pintarTablaEdit();
  recalcularTotalesEdit();

  document.getElementById("modal-editar").classList.add("show");
}

function cerrarModalEditar() {
  document.getElementById("modal-editar").classList.remove("show");
  materialSeleccionadoEdit = null;
  document.getElementById("edit-lista-materiales")?.replaceChildren();
}

// -----------------------------
// 4) INVENTARIO PARA EDITAR
// -----------------------------
async function cargarInventario() {
  try {
    const res = await fetch("http://localhost:3000/inventario/listar");
    inventario = await res.json();
  } catch (e) {
    console.error("No se pudo cargar inventario:", e);
  }
}

function mostrarSugerenciasEdit() {
  const texto = document.getElementById("edit-buscar-material").value.toLowerCase();
  const cont = document.getElementById("edit-lista-materiales");
  cont.innerHTML = "";
  if (!texto) return;

  inventario
    .filter((m) => (m.nombre || "").toLowerCase().includes(texto))
    .slice(0, 8)
    .forEach((mat) => {
      const div = document.createElement("div");
      div.classList.add("sugerencia-item");
      div.textContent = `${mat.nombre} - $${mat.precio}`;
      div.onclick = () => {
        materialSeleccionadoEdit = mat;
        document.getElementById("edit-buscar-material").value = mat.nombre;
        cont.innerHTML = "";
      };
      cont.appendChild(div);
    });
}

// -----------------------------
// 5) TABLA EDIT
// -----------------------------
function pintarTablaEdit() {
  const tbody = document.getElementById("edit-tabla-materiales");
  tbody.innerHTML = "";

  materialesEdit.forEach((m, i) => {
    const unidadLabel =
      m.unidad === "m2" ? "m²" :
      m.unidad === "hora" ? "Hora" :
      (m.unidad || "Pieza");

    const medidaLabel =
      (m.unidad === "m2" && m.ancho && m.alto)
        ? `${toNum(m.ancho).toFixed(2)} x ${toNum(m.alto).toFixed(2)}`
        : "—";

    tbody.innerHTML += `
      <tr>
        <td>${v(m.nombre)}</td>
        <td>${unidadLabel}</td>
        <td>
          <input type="number" min="1" value="${toNum(m.cantidad, 1)}"
            style="width:80px;"
            onchange="cambiarCantidadEdit(${i}, this.value)">
        </td>
        <td>${medidaLabel}</td>
        <td>$${toMoney(m.precio)}</td>
        <td>$${toMoney(m.total)}</td>
        <td><button type="button" onclick="eliminarLineaEdit(${i})">Eliminar</button></td>
      </tr>
    `;
  });
}

function cambiarCantidadEdit(index, nuevaCantidad) {
  const cant = toNum(nuevaCantidad, 0);
  if (!cant || cant <= 0) return;
  materialesEdit[index].cantidad = cant;
  materialesEdit[index].total = calcularTotalLinea(materialesEdit[index]);
  pintarTablaEdit();
  recalcularTotalesEdit();
}

function eliminarLineaEdit(index) {
  materialesEdit.splice(index, 1);
  pintarTablaEdit();
  recalcularTotalesEdit();
}

function agregarMaterialEdit() {
  const cant = toNum(document.getElementById("edit-cantidad").value, 0);
  const unidad = document.getElementById("edit-unidad").value;
  const ancho = toNum(document.getElementById("edit-ancho").value, 0);
  const alto = toNum(document.getElementById("edit-alto").value, 0);

  if (!materialSeleccionadoEdit) return alert("Selecciona un material.");
  if (!cant || cant <= 0) return alert("Cantidad inválida.");
  if (unidad === "m2" && (!ancho || !alto)) return alert("Para m² necesitas ancho y alto.");

  const precioUnit = toNum(materialSeleccionadoEdit.precio, 0);

  const linea = {
    id: materialSeleccionadoEdit.id,
    nombre: materialSeleccionadoEdit.nombre,
    unidad,
    cantidad: cant,
    precio: precioUnit,
    ancho: unidad === "m2" ? ancho : undefined,
    alto: unidad === "m2" ? alto : undefined,
  };

  linea.total = calcularTotalLinea(linea);

  materialesEdit.push(linea);

  materialSeleccionadoEdit = null;
  document.getElementById("edit-buscar-material").value = "";
  document.getElementById("edit-ancho").value = "";
  document.getElementById("edit-alto").value = "";
  document.getElementById("edit-cantidad").value = "1";

  pintarTablaEdit();
  recalcularTotalesEdit();
}

function calcularTotalLinea(linea) {
  const precio = toNum(linea.precio, 0);
  const cant = toNum(linea.cantidad, 0);

  if (linea.unidad === "m2") {
    const a = toNum(linea.ancho, 0);
    const h = toNum(linea.alto, 0);
    const m2 = a * h;
    return precio * cant * m2;
  }
  return precio * cant;
}

function recalcularTotalesEdit() {
  const subtotal = materialesEdit.reduce((acc, m) => acc + toNum(m.total, 0), 0);
  const ivaPctDec = toNum(document.getElementById("edit-iva-tipo").value, 0.08);
  const iva = subtotal * ivaPctDec;
  const total = subtotal + iva;

  document.getElementById("edit-subtotal").textContent = subtotal.toFixed(2);
  document.getElementById("edit-iva").textContent = iva.toFixed(2);
  document.getElementById("edit-total").textContent = total.toFixed(2);

  // saldo (si existe span)
  const anticipoEl = document.getElementById("edit-anticipo");
  const saldoSpan = document.getElementById("edit-saldo");
  if (anticipoEl && saldoSpan) {
    const anticipo = toNum(String(anticipoEl.value || "0").replace(",", "."), 0);
    saldoSpan.textContent = Math.max(total - anticipo, 0).toFixed(2);
  }
}

// -----------------------------
// 6) GUARDAR EDICION
// -----------------------------
async function guardarEdicion() {
  if (!ordenActual?.id) return alert("No hay orden cargada.");

  const ivaPctDec = toNum(document.getElementById("edit-iva-tipo").value, 0.08);
  const ivaPorcentaje = Math.round(ivaPctDec * 100);

  const subtotal = toNum(document.getElementById("edit-subtotal").textContent, 0);
  const iva = toNum(document.getElementById("edit-iva").textContent, 0);
  const total = toNum(document.getElementById("edit-total").textContent, 0);

  const metodoPago = document.getElementById("edit-metodo-pago")
    ? document.getElementById("edit-metodo-pago").value
    : (ordenActual.metodo_pago || "Efectivo");

  const anticipo = document.getElementById("edit-anticipo")
    ? toNum(String(document.getElementById("edit-anticipo").value || "0").replace(",", "."), 0)
    : toNum(ordenActual.anticipo, 0);

  const saldo = Math.max(total - anticipo, 0);

  const body = {
    descripcion: document.getElementById("edit-descripcion").value.trim(),
    notas_produccion: {
      cliente_info: {
        fecha_entrada: document.getElementById("edit-fecha-entrada").value || "",
        tiempo_entrega: document.getElementById("edit-tiempo-entrega").value.trim() || "",
        cliente: document.getElementById("edit-cliente").value.trim() || "",
        contacto: document.getElementById("edit-contacto").value.trim() || "",
        mail: document.getElementById("edit-mail").value.trim() || "",
        direccion: document.getElementById("edit-direccion").value.trim() || "",
        rfc: document.getElementById("edit-rfc").value.trim() || "",
        tel: document.getElementById("edit-tel").value.trim() || "",
      },
      materiales: materialesEdit,
      notas_extra: document.getElementById("edit-notas-extra").value.trim() || "",
      subtotal,
      iva,
      total,
      iva_porcentaje: ivaPorcentaje,
      metodo_pago: metodoPago,
      anticipo,
      saldo,
    },
  };

  try {
    const res = await fetch(`http://localhost:3000/ordenes/actualizar/${ordenActual.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error("Error guardando:", data);
      alert("No se pudo guardar. Revisa backend /ordenes/actualizar/:id");
      return;
    }

    cerrarModalEditar();
    await cargarOrdenes();
    await verDetalle(ordenActual.id);
  } catch (e) {
    console.error("Error guardando:", e);
    alert("No se pudo conectar con el servidor.");
  }
}

// -----------------------------
// 7) ELIMINAR ORDEN
// -----------------------------
async function eliminarOrden(id) {
  if (!confirm("¿Seguro que deseas eliminar esta orden?")) return;
  try {
    const res = await fetch(`http://localhost:3000/ordenes/eliminar/${id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    alert(data.mensaje || "Orden eliminada.");
    await cargarOrdenes();
  } catch (err) {
    console.error("Error eliminando:", err);
    alert("No se pudo eliminar la orden.");
  }
}

// -----------------------------
// 8) PDF
// -----------------------------
function generarPDF() {
  if (!ordenActual) return alert("Primero abre una orden.");
  if (!window.jspdf?.jsPDF) return alert("jsPDF no está cargado.");

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("p", "mm", "letter");

  const left = 15;
  const right = 200;
  let y = 15;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("NODOX - ORDEN DE TRABAJO", left, y);

  y += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Orden ID: ${v(ordenActual.id)}    Estado: ${v(ordenActual.estado)}`, left, y);

  y += 8;
  doc.setDrawColor(200);
  doc.line(left, y, right, y);
  y += 6;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);

  doc.text("Fecha de entrada:", left, y);
  doc.setFont("helvetica", "normal");
  doc.text(v(ordenActual.fecha_entrada), left + 35, y);

  doc.setFont("helvetica", "bold");
  doc.text("Tiempo estimado:", left + 95, y);
  doc.setFont("helvetica", "normal");
  doc.text(v(ordenActual.tiempo_entrega), left + 130, y);

  y += 7;

  doc.setFont("helvetica", "bold");
  doc.text("Cliente:", left, y);
  doc.setFont("helvetica", "normal");
  doc.text(v(ordenActual.cliente), left + 18, y);

  doc.setFont("helvetica", "bold");
  doc.text("Tel:", left + 110, y);
  doc.setFont("helvetica", "normal");
  doc.text(v(ordenActual.tel), left + 122, y);

  y += 7;

  doc.setFont("helvetica", "bold");
  doc.text("Mail:", left, y);
  doc.setFont("helvetica", "normal");
  doc.text(v(ordenActual.mail), left + 12, y);

  y += 7;

  doc.setFont("helvetica", "bold");
  doc.text("Dirección:", left, y);
  doc.setFont("helvetica", "normal");
  const dirLines = doc.splitTextToSize(v(ordenActual.direccion), 165);
  doc.text(dirLines, left + 22, y);
  y += dirLines.length * 5 + 2;

  doc.setFont("helvetica", "bold");
  doc.text("RFC:", left, y);
  doc.setFont("helvetica", "normal");
  doc.text(v(ordenActual.rfc), left + 12, y);

  y += 8;
  doc.setDrawColor(200);
  doc.line(left, y, right, y);
  y += 6;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Descripción / Detalles del trabajo:", left, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const descLines = doc.splitTextToSize(v(ordenActual.descripcion), 185);
  doc.text(descLines, left, y);
  y += descLines.length * 5 + 4;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Artículos / Materiales:", left, y);

  const rows = (ordenActual.materiales || []).map((m) => {
    const unidad = m.unidad === "m2" ? "m²" : (m.unidad === "hora" ? "Hora" : (m.unidad || "Pieza"));
    const medida = (m.unidad === "m2" && m.ancho && m.alto)
      ? `${toNum(m.ancho).toFixed(2)} x ${toNum(m.alto).toFixed(2)}`
      : "—";
    const desc = clean(m.descripcion || m.nombre || "—");
    return [
      String(m.cantidad ?? "—"),
      desc,
      String(unidad),
      String(medida),
      `$${toMoney(m.precio)}`,
      `$${toMoney(m.total)}`,
    ];
  });

  doc.autoTable({
    startY: y + 4,
    head: [["Cant.", "Descripción", "Unidad", "Medida", "P. Unit.", "Importe"]],
    body: rows.length ? rows : [["—", "—", "—", "—", "—", "—"]],
    theme: "grid",
    margin: { left: 15, right: 15 },
    styles: { font: "helvetica", fontSize: 9, cellPadding: 2, overflow: "linebreak", valign: "top" },
    headStyles: { fillColor: [30, 30, 30], textColor: 255, fontStyle: "bold", halign: "center" },
    columnStyles: {
      0: { cellWidth: 14, halign: "center" },
      1: { cellWidth: 78 },
      2: { cellWidth: 18, halign: "center" },
      3: { cellWidth: 28, halign: "center" },
      4: { cellWidth: 22, halign: "right" },
      5: { cellWidth: 25, halign: "right" },
    },
    rowPageBreak: "auto",
  });

  y = doc.lastAutoTable.finalY + 8;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(`Subtotal: $${toMoney(ordenActual.subtotal)}`, left, y); y += 6;
  doc.text(`IVA (${ordenActual.iva_porcentaje}%): $${toMoney(ordenActual.iva)}`, left, y); y += 6;
  doc.setFontSize(12);
  doc.text(`Total: $${toMoney(ordenActual.total)}`, left, y); y += 7;

  doc.setFontSize(11);
  doc.text(`Método de pago: ${v(ordenActual.metodo_pago)}`, left, y); y += 6;
  doc.text(`Anticipo: $${toMoney(ordenActual.anticipo)}`, left, y); y += 6;
  doc.text(`Saldo pendiente: $${toMoney(ordenActual.saldo)}`, left, y); y += 8;

  doc.save(`OT_${ordenActual.id}.pdf`);
}

// -----------------------------
// 9) ENVIAR POR CORREO (si ya tienes ruta backend)
// -----------------------------
async function enviarCorreo() {
  if (!ordenActual) return alert("Abre una orden primero.");
  const email = (ordenActual.mail || "").trim();
  if (!email) return alert("El cliente no tiene correo registrado.");

  if (!confirm(`¿Enviar la orden #${ordenActual.id} al correo: ${email}?`)) return;

  try {
    const res = await fetch("http://localhost:3000/email/enviar-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: ordenActual.id }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error(data);
      alert("Error enviando correo");
      return;
    }
    alert("Correo enviado correctamente ✅");
  } catch (e) {
    console.error(e);
    alert("Error de conexión con el servidor");
  }
}