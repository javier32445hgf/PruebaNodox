let materiales = [];
let materialSeleccionado = null;
let detalleCotizacion = [];

document.addEventListener("DOMContentLoaded", () => {
  cargarMateriales();

  document.getElementById("buscar-material").addEventListener("input", mostrarSugerencias);
  document.getElementById("btn-agregar").addEventListener("click", agregarLinea);
  document.getElementById("btn-confirmar").addEventListener("click", confirmarCotizacion);

  document.getElementById("iva-tipo").addEventListener("change", () => {
    const pct = Math.round(Number(document.getElementById("iva-tipo").value) * 100);
    document.getElementById("iva-porcentaje").textContent = String(pct);
    recalcularTotales();
  });

  document.getElementById("anticipo").addEventListener("input", recalcularTotales);
});

async function cargarMateriales() {
  try {
    const res = await fetch("http://localhost:3000/inventario/listar");
    materiales = await res.json();
  } catch (err) {
    console.error("Error cargando materiales:", err);
  }
}

function mostrarSugerencias() {
  const texto = document.getElementById("buscar-material").value.toLowerCase();
  const cont = document.getElementById("lista-materiales");
  cont.innerHTML = "";
  if (!texto) return;

  const filtrados = materiales
    .filter(m => (m.nombre || "").toLowerCase().includes(texto))
    .slice(0, 10);

  filtrados.forEach(mat => {
    const div = document.createElement("div");
    div.classList.add("sugerencia-item");
    div.textContent = `${mat.nombre} - $${Number(mat.precio || 0).toFixed(2)}`;
    div.onclick = () => seleccionarMaterial(mat);
    cont.appendChild(div);
  });
}

function seleccionarMaterial(mat) {
  materialSeleccionado = mat;
  document.getElementById("buscar-material").value = mat.nombre;
  document.getElementById("lista-materiales").innerHTML = "";
}

function agregarLinea() {
  const unidad = document.getElementById("unidad").value; // pieza|m2|hora
  const cantidad = Number(document.getElementById("cantidad").value);
  const ancho = Number(document.getElementById("ancho").value);
  const alto = Number(document.getElementById("alto").value);

  if (!materialSeleccionado) return alert("Selecciona un material.");
  if (!cantidad || cantidad <= 0) return alert("Cantidad inválida.");
  if (unidad === "m2" && (!ancho || !alto)) return alert("Para m² necesitas ancho y alto.");

  const precio = Number(materialSeleccionado.precio || 0);

  const linea = {
    id: materialSeleccionado.id,
    nombre: materialSeleccionado.nombre,
    unidad,
    cantidad,
    precio,
    ancho: unidad === "m2" ? ancho : undefined,
    alto: unidad === "m2" ? alto : undefined
  };

  linea.total = calcularTotalLinea(linea);

  detalleCotizacion.push(linea);

  // limpiar
  materialSeleccionado = null;
  document.getElementById("buscar-material").value = "";
  document.getElementById("cantidad").value = "1";
  document.getElementById("ancho").value = "";
  document.getElementById("alto").value = "";

  pintarTabla();
  recalcularTotales();
}

function calcularTotalLinea(linea) {
  const precio = Number(linea.precio || 0);
  const cant = Number(linea.cantidad || 0);

  if (linea.unidad === "m2") {
    const a = Number(linea.ancho || 0);
    const h = Number(linea.alto || 0);
    const area = a * h;
    return precio * cant * area;
  }

  return precio * cant;
}

function pintarTabla() {
  const tbody = document.getElementById("tabla-detalle");
  tbody.innerHTML = "";

  detalleCotizacion.forEach((m, i) => {
    const unidadLabel = m.unidad === "m2" ? "m²" : (m.unidad === "hora" ? "Hora" : "Pieza");
    const medidaLabel = (m.unidad === "m2" && m.ancho && m.alto)
      ? `${Number(m.ancho).toFixed(2)} x ${Number(m.alto).toFixed(2)}`
      : "—";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${m.nombre}</td>
      <td>${unidadLabel}</td>
      <td>${m.cantidad}</td>
      <td>${medidaLabel}</td>
      <td>$${Number(m.precio).toFixed(2)}</td>
      <td>$${Number(m.total).toFixed(2)}</td>
      <td><button type="button" onclick="eliminarLinea(${i})">Eliminar</button></td>
    `;
    tbody.appendChild(tr);
  });
}

window.eliminarLinea = function (index) {
  detalleCotizacion.splice(index, 1);
  pintarTabla();
  recalcularTotales();
};

function recalcularTotales() {
  const subtotal = detalleCotizacion.reduce((acc, m) => acc + Number(m.total || 0), 0);
  const ivaPct = Number(document.getElementById("iva-tipo").value || 0.08);
  const iva = subtotal * ivaPct;
  const total = subtotal + iva;

  const anticipo = Number(document.getElementById("anticipo").value || 0);
  const saldo = Math.max(total - anticipo, 0);

  document.getElementById("subtotal-span").textContent = subtotal.toFixed(2);
  document.getElementById("iva-span").textContent = iva.toFixed(2);
  document.getElementById("total-span").textContent = total.toFixed(2);
  document.getElementById("saldo-span").textContent = saldo.toFixed(2);
}

async function confirmarCotizacion() {
  if (detalleCotizacion.length === 0) return alert("Debe agregar materiales.");

  const cliente_info = {
    fecha_entrada: document.getElementById("fecha-entrada").value || "",
    tiempo_entrega: document.getElementById("tiempo-entrega").value.trim() || "",
    cliente: document.getElementById("cliente").value.trim() || "",
    contacto: document.getElementById("contacto").value.trim() || "",
    mail: document.getElementById("mail").value.trim() || "",
    tel: document.getElementById("tel").value.trim() || "",
    rfc: document.getElementById("rfc").value.trim() || "",
    direccion: document.getElementById("direccion").value.trim() || ""
  };

  if (!cliente_info.cliente) return alert("Escribe el nombre del cliente.");

  const descripcion = document.getElementById("descripcion-trabajo").value.trim();
  const notas_extra = document.getElementById("nota-extra").value.trim();

  const ivaPctDec = Number(document.getElementById("iva-tipo").value || 0.08);
  const iva_porcentaje = Math.round(ivaPctDec * 100);

  const metodo_pago = document.getElementById("metodo-pago").value;
  const anticipoRaw = document.getElementById("anticipo").value;
  const anticipo = Number(String(anticipoRaw || "0").replace(",", ".")) || 0;

  const body = {
    descripcion,
    notas_extra,
    cliente_info,
    materiales: detalleCotizacion,
    subtotal: Number(document.getElementById("subtotal-span").textContent),
    iva: Number(document.getElementById("iva-span").textContent),
    total: Number(document.getElementById("total-span").textContent),
    iva_porcentaje,
    metodo_pago,
    anticipo,
    saldo: Number(document.getElementById("saldo-span").textContent)
  };

  try {
    const res = await fetch("http://localhost:3000/ordenes/crear", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) return alert(data.error || "Error creando la orden.");

    alert("Orden creada con ID: " + data.id);
    window.location.href = "ordenes.html";
  } catch (err) {
    console.error(err);
    alert("No se pudo conectar con el servidor.");
  }
}