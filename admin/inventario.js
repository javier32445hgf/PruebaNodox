let inventarioData = []; // Guardará todo el inventario original

document.addEventListener("DOMContentLoaded", cargarInventario);

function cargarInventario() {
    const btn = document.querySelector(".btn-actualizar");
    if (btn) {
        btn.disabled = true;
        btn.textContent = "Actualizando...";
    }

    fetch("http://localhost:3000/inventario/listar")
        .then(res => res.json())
        .then(data => {
            inventarioData = data; // Guardamos la data original
            mostrarInventario(data);

            if (btn) {
                btn.disabled = false;
                btn.textContent = "🔄 Actualizar";
            }
        })
        .catch(err => {
            console.error("Error en inventario.js:", err);

            if (btn) {
                btn.disabled = false;
                btn.textContent = "🔄 Actualizar";
            }
        });
}

function mostrarInventario(lista) {
    const tbody = document.getElementById("tablaInventario");
    tbody.innerHTML = "";

    lista.forEach(item => {
        tbody.innerHTML += `
            <tr>
                <td>${item.id}</td>
                <td>${item.nombre}</td>
                <td>${item.descripcion}</td>
                <td>${item.unidad}</td>
                <td>$${Number(item.precio).toFixed(2)}</td>
                <td>${item.cantidad}</td>
                <td>
                    <button class="btn-edit">Editar</button>
                    <button class="btn-delete">Eliminar</button>
                </td>
            </tr>
        `;
    });
}

/* ====== FILTRO DE INVENTARIO ====== */
function filtrarInventario() {
    const texto = document.getElementById("buscador").value.toLowerCase();

    const filtrado = inventarioData.filter(item =>
        (item.nombre || "").toLowerCase().includes(texto) ||
        (item.descripcion || "").toLowerCase().includes(texto) ||
        (item.unidad || "").toLowerCase().includes(texto)
    );

    mostrarInventario(filtrado);
}

function irCrearProducto() {
    window.location.href = "crear_producto.html";
}

/* =====================================
   ✅ PDF - Exportar inventario completo
   ===================================== */
function generarPDFInventario() {
    if (!inventarioData || inventarioData.length === 0) {
        alert("No hay inventario para exportar.");
        return;
    }

    // Si hay filtro en buscador, exporta el filtrado; si no, exporta todo
    const texto = (document.getElementById("buscador")?.value || "").toLowerCase().trim();

    const listaExportar = texto.length
        ? inventarioData.filter(item =>
            (item.nombre || "").toLowerCase().includes(texto) ||
            (item.descripcion || "").toLowerCase().includes(texto) ||
            (item.unidad || "").toLowerCase().includes(texto)
        )
        : inventarioData;

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF("p", "mm", "letter");

    const marginX = 15;
    let y = 15;

    // Título
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("NODOX - Inventario", marginX, y);

    // Fecha
    y += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const fecha = new Date().toLocaleString("es-MX");
    doc.text(`Fecha de exportación: ${fecha}`, marginX, y);

    y += 8;

    // Tabla
    const head = [["ID", "Nombre", "Descripción", "Unidad", "Precio", "Cantidad"]];

    const body = listaExportar.map(item => ([
        String(item.id ?? ""),
        String(item.nombre ?? ""),
        String(item.descripcion ?? ""),
        String(item.unidad ?? ""),
        `$${Number(item.precio ?? 0).toFixed(2)}`,
        String(item.cantidad ?? "")
    ]));

    doc.autoTable({
        startY: y,
        head,
        body,
        styles: { font: "helvetica", fontSize: 9 },
        headStyles: { fillColor: [30, 30, 30] },
        margin: { left: marginX, right: marginX },
        columnStyles: {
            0: { cellWidth: 12 }, // ID
            1: { cellWidth: 35 }, // Nombre
            2: { cellWidth: 60 }, // Descripción
            3: { cellWidth: 18 }, // Unidad
            4: { cellWidth: 20 }, // Precio
            5: { cellWidth: 18 }  // Cantidad
        }
    });

    doc.save("Inventario_NODOX.pdf");
}
