document.addEventListener("DOMContentLoaded", () => {
    cargarInventario();
});

async function cargarInventario() {
    try {
        const res = await fetch("http://localhost:3000/inventario/listar");
        const data = await res.json();
        pintarTabla(data);
    } catch (err) {
        console.error("Error cargando inventario:", err);
    }
}

function pintarTabla(lista) {
    const tbody = document.getElementById("tabla-inventario");
    tbody.innerHTML = "";

    lista.forEach(item => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${item.id}</td>
            <td>${item.nombre}</td>
            <td>$${Number(item.precio).toFixed(2)}</td>
            <td>${item.cantidad ?? 0}</td>
        `;
        tbody.appendChild(tr);
    });
}

function generarPDFInventario() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("p", "mm", "letter");

  const rows = Array.from(document.querySelectorAll("#tabla-inventario tr")).map(tr => {
    const tds = tr.querySelectorAll("td");
    return [
      tds[0]?.innerText || "—",
      tds[1]?.innerText || "—",
      tds[2]?.innerText || "—",
      tds[3]?.innerText || "—"
    ];
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("NODOX - Reporte de Inventario", 15, 15);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Fecha: ${new Date().toLocaleString()}`, 15, 22);

  doc.autoTable({
    startY: 28,
    head: [["ID", "Material", "Precio", "Cantidad"]],
    body: rows.length ? rows : [["—", "—", "—", "—"]],
    styles: { font: "helvetica", fontSize: 10 },
    headStyles: { fillColor: [30, 30, 30] },
    margin: { left: 15, right: 15 }
  });

  doc.save("Inventario_NODOX.pdf");
}

