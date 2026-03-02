document.addEventListener("DOMContentLoaded", () => {
    cargarOrdenes();
});


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

    lista.forEach(o => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${o.id}</td>
            <td>${o.estado}</td>
            <td>${o.fecha_creacion}</td>
            <td>${o.descripcion || "—"}</td>
            <td>
                <button class="btn-ver" onclick="verDetalle(${o.id})">Ver</button>
            </td>
        `;

        tbody.appendChild(tr);
    });
}

async function verDetalle(id) {
    try {
        const res = await fetch(`http://localhost:3000/ordenes/detalle/${id}`);
        const data = await res.json();

        if (!data) {
            alert("No se encontró la orden.");
            return;
        }

        const notas = data.notas_produccion || {
            materiales: [],
            subtotal: 0,
            iva: 0,
            total: 0,
            notas_extra: ""
        };

        let html = `
            <p><strong>ID:</strong> ${data.id}</p>
            <p><strong>Estado:</strong> ${data.estado}</p>
            <p><strong>Descripción / Nota del trabajo:</strong> ${data.descripcion || "—"}</p>
            <p><strong>Notas extra:</strong> ${notas.notas_extra || "—"}</p>

            <hr>
            <h3>Materiales:</h3>
        `;

        if (notas.materiales.length > 0) {
            notas.materiales.forEach(m => {
                html += `<p>• ${m.nombre} — Cant: ${m.cantidad} — $${m.total}</p>`;
            });
        } else {
            html += `<p>Sin detalle de materiales.</p>`;
        }

        html += `
            <hr>
            <p><strong>Subtotal:</strong> $${notas.subtotal}</p>
            <p><strong>IVA:</strong> $${notas.iva}</p>
            <p><strong>Total:</strong> $${notas.total}</p>
        `;

        document.getElementById("detalle-contenido").innerHTML = html;
        document.getElementById("modal-detalle").classList.add("show");

    } catch (err) {
        console.error("Error viendo detalle:", err);
        alert("No se pudo cargar el detalle.");
    }
}


function cerrarModal() {
    document.getElementById("modal-detalle").classList.remove("show");
}
