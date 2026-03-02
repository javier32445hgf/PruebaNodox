document.addEventListener("DOMContentLoaded", () => {
    cargarServicios();

    const inputBusqueda = document.getElementById("buscador");
    inputBusqueda.addEventListener("input", filtrarServicios);
});

let servicios = []; // se usa también para PDF

async function cargarServicios() {
    try {
        const res = await fetch("http://localhost:3000/servicios/listar");
        servicios = await res.json();

        console.log("Servicios cargados:", servicios);

        pintarTabla(servicios);
    } catch (err) {
        console.error("Error cargando servicios:", err);
    }
}

function pintarTabla(lista) {
    const tbody = document.getElementById("tablaServicios");
    tbody.innerHTML = "";

    lista.forEach(s => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${s.id}</td>
            <td>${s.nombre}</td>
            <td>${s.descripcion}</td>
            <td>${s.unidad}</td>
            <td>${s.precio_base !== null ? "$" + Number(s.precio_base).toFixed(2) : "—"}</td>
            <td>
                <button class="btn-editar" onclick="editarServicio(${s.id})">Editar</button>
                <button class="btn-eliminar" onclick="eliminarServicio(${s.id})">Eliminar</button>
                <button class="btn-rangos" onclick="verRangos(${s.id})">Rangos</button>
            </td>
        `;

        tbody.appendChild(tr);
    });
}

function filtrarServicios() {
    const texto = document.getElementById("buscador").value.toLowerCase();

    const filtrados = servicios.filter(s =>
        (s.nombre || "").toLowerCase().includes(texto) ||
        (s.descripcion || "").toLowerCase().includes(texto)
    );

    pintarTabla(filtrados);
}

function editarServicio(id) {
    window.location.href = `editar_servicio.html?id=${id}`;
}

function eliminarServicio(id) {
    if (!confirm("¿Seguro que deseas eliminar este servicio?")) return;

    fetch(`http://localhost:3000/servicios/eliminar/${id}`, {
        method: "DELETE"
    })
    .then(r => r.json())
    .then(data => {
        alert(data.mensaje);
        cargarServicios();
    })
    .catch(err => {
        console.error("Error eliminando servicio:", err);
        alert("No se pudo eliminar el servicio.");
    });
}

function verRangos(id) {
    window.location.href = `rangos_servicio.html?id=${id}`;
}

/* ======================================================
   ✅ PDF: Generar PDF con TODOS los servicios
   Requiere:
   - jsPDF: window.jspdf.jsPDF
   - autoTable: doc.autoTable(...)
====================================================== */
function generarPDFServicios() {
    if (!window.jspdf?.jsPDF) {
        alert("jsPDF no está cargado. Revisa que pusiste los scripts en servicios.html");
        return;
    }

    if (!Array.isArray(servicios) || servicios.length === 0) {
        alert("No hay servicios para generar el PDF.");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF("p", "mm", "letter");

    const left = 15;
    const right = 200;
    let y = 15;

    // Título
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("NODOX - LISTA DE SERVICIOS", left, y);

    y += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Generado: ${new Date().toLocaleString()}`, left, y);

    y += 6;
    doc.setDrawColor(200);
    doc.line(left, y, right, y);
    y += 6;

    const rows = servicios.map(s => {
        const precio = (s.precio_base !== null && s.precio_base !== undefined)
            ? `$${Number(s.precio_base).toFixed(2)}`
            : "—";

        return [
            String(s.id ?? "—"),
            String(s.nombre ?? "—"),
            String(s.descripcion ?? "—"),
            String(s.unidad ?? "—"),
            precio
        ];
    });

    doc.autoTable({
        startY: y,
        head: [["ID", "Servicio", "Descripción", "Unidad", "Precio Base"]],
        body: rows,
        theme: "grid",
        margin: { left: 15, right: 15 },
        styles: {
            font: "helvetica",
            fontSize: 9,
            cellPadding: 2,
            overflow: "linebreak",
            valign: "top"
        },
        headStyles: {
            fillColor: [30, 30, 30],
            textColor: 255,
            fontStyle: "bold",
            halign: "center"
        },
        columnStyles: {
            0: { cellWidth: 12, halign: "center" },
            1: { cellWidth: 45 },
            2: { cellWidth: 85 },
            3: { cellWidth: 20, halign: "center" },
            4: { cellWidth: 25, halign: "right" }
        },
        rowPageBreak: "auto"
    });

    doc.save("Servicios_NODOX.pdf");
}