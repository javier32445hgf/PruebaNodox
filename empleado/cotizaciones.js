
let materiales = [];
let materialSeleccionado = null;
let detalleCotizacion = [];

document.addEventListener("DOMContentLoaded", () => {
    cargarMateriales();

    document.getElementById("buscar-material")
        .addEventListener("input", mostrarSugerencias);

    document.getElementById("btn-agregar")
        .addEventListener("click", agregarLinea);

    document.getElementById("btn-confirmar")
        .addEventListener("click", confirmarCotizacion);
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
    const contenedor = document.getElementById("lista-materiales");

    contenedor.innerHTML = "";
    if (texto.length === 0) return;

    const filtrados = materiales.filter(m =>
        m.nombre.toLowerCase().includes(texto)
    );

    filtrados.forEach(mat => {
        const div = document.createElement("div");
        div.classList.add("sugerencia-item");
        div.textContent = `${mat.nombre} - $${mat.precio}`;
        div.onclick = () => seleccionarMaterial(mat);
        contenedor.appendChild(div);
    });
}

function seleccionarMaterial(mat) {
    materialSeleccionado = mat;
    document.getElementById("buscar-material").value = mat.nombre;
    document.getElementById("lista-materiales").innerHTML = "";
}

function agregarLinea() {
    const cantidad = parseInt(document.getElementById("cantidad").value, 10);

    if (!materialSeleccionado) {
        alert("Selecciona un material.");
        return;
    }
    if (isNaN(cantidad) || cantidad <= 0) {
        alert("Cantidad inválida.");
        return;
    }

    const precioUnit = Number(materialSeleccionado.precio);
    const totalLinea = precioUnit * cantidad;

    detalleCotizacion.push({
        id: materialSeleccionado.id,
        nombre: materialSeleccionado.nombre,
        precio: precioUnit,
        cantidad,
        total: totalLinea
    });

    pintarTabla();
    recalcularTotales();
}


function pintarTabla() {
    const tbody = document.getElementById("tabla-detalle");
    tbody.innerHTML = "";

    detalleCotizacion.forEach((item, index) => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${item.nombre}</td>
            <td>${item.cantidad}</td>
            <td>$${item.precio.toFixed(2)}</td>
            <td>$${item.total.toFixed(2)}</td>
            <td><button onclick="eliminarLinea(${index})">Eliminar</button></td>
        `;

        tbody.appendChild(tr);
    });
}

function eliminarLinea(index) {
    detalleCotizacion.splice(index, 1);
    pintarTabla();
    recalcularTotales();
}


function recalcularTotales() {
    let subtotal = detalleCotizacion.reduce((acc, item) => acc + item.total, 0);
    const iva = subtotal * 0.08;
    const total = subtotal + iva;

    document.getElementById("subtotal-span").textContent = subtotal.toFixed(2);
    document.getElementById("iva-span").textContent = iva.toFixed(2);
    document.getElementById("total-span").textContent = total.toFixed(2);
}

async function confirmarCotizacion() {

    if (detalleCotizacion.length === 0) {
        alert("Debe agregar materiales.");
        return;
    }

    const descripcion = document.getElementById("descripcion-trabajo").value.trim();
    const notasExtra = document.getElementById("nota-extra").value.trim();

    const body = {
        descripcion,
        notas_extra: notasExtra,
        materiales: detalleCotizacion,
        subtotal: Number(document.getElementById("subtotal-span").textContent),
        iva: Number(document.getElementById("iva-span").textContent),
        total: Number(document.getElementById("total-span").textContent)
    };

    console.log("ENVIANDO:", body);

    try {
        const res = await fetch("http://localhost:3000/ordenes/crear", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        const data = await res.json();

        if (data.id) {
            alert("Orden creada con ID: " + data.id);
            window.location.href = "./ordenes.html";
        } else {
            alert("Error creando la orden.");
        }

    } catch (error) {
        console.error("Error en fetch:", error);
        alert("No se pudo conectar con el servidor.");
    }
}
