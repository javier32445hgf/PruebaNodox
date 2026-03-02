let usuarios = [];
let modoEdicion = false;
let usuarioEditandoId = null;

document.addEventListener("DOMContentLoaded", () => {
    cargarUsuarios();

    // Botones del modal
    document.getElementById("btn-nuevo-usuario")
        .addEventListener("click", abrirModalNuevo);

    document.getElementById("btn-cerrar-modal-usuario")
        .addEventListener("click", cerrarModal);

    document.getElementById("btn-guardar-usuario")
        .addEventListener("click", guardarUsuario);

    // ====== Toggle del ojo de contraseña ======
    const passInput = document.getElementById("inp-pass-usu");
    const toggle = document.getElementById("toggle-pass");

    if (passInput && toggle) {
        toggle.addEventListener("click", () => {
            if (passInput.type === "password") {
                passInput.type = "text";
                toggle.textContent = "🙈";
            } else {
                passInput.type = "password";
                toggle.textContent = "👁️";
            }
        });
    }
});

// =================== CARGAR LISTA ===================
async function cargarUsuarios() {
    try {
        const res = await fetch("http://localhost:3000/usuarios/listar");
        usuarios = await res.json();
        pintarTablaUsuarios();
    } catch (err) {
        console.error("Error cargando usuarios:", err);
        alert("No se pudieron cargar los usuarios.");
    }
}

function pintarTablaUsuarios() {
    const tbody = document.getElementById("tbody-usuarios");
    tbody.innerHTML = "";

    usuarios.forEach(u => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${u.id}</td>
            <td>${u.nombre}</td>
            <td>${u.usuario}</td>
            <td><span class="tag-rol rol-${u.rol.toLowerCase()}">${u.rol}</span></td>
            <td>
                <span class="tag-estado estado-${u.estado === 'Activo' ? 'activo' : 'bloqueado'}">
                    ${u.estado}
                </span>
            </td>
            <td class="acciones-usuarios">
                <button class="btn-mini" onclick="abrirModalEditar(${u.id})">Editar</button>

                <button class="btn-mini btn-danger" onclick="bloquearUsuario(${u.id})">
                    ${u.estado === 'Activo' ? 'Bloquear' : 'Desbloquear'}
                </button>

                <button class="btn-mini btn-danger" onclick="eliminarUsuario(${u.id})">
                    Eliminar
                </button>
            </td>

        `;

        tbody.appendChild(tr);
    });
}

// =================== MODAL NUEVO ===================
function abrirModalNuevo() {
    modoEdicion = false;
    usuarioEditandoId = null;

    document.getElementById("modal-titulo").textContent = "Nuevo usuario";
    document.getElementById("inp-nombre-usu").value = "";
    document.getElementById("inp-usuario-usu").value = "";

    const passInput = document.getElementById("inp-pass-usu");
    passInput.value = "";
    passInput.type = "password";
    passInput.placeholder = "Contraseña nueva";

    document.getElementById("inp-rol-usu").value = "Empleado";

    document.getElementById("modal-usuario").classList.add("show");
}

// =================== MODAL EDITAR ===================
function abrirModalEditar(id) {
    modoEdicion = true;
    usuarioEditandoId = id;

    const u = usuarios.find(x => x.id === id);
    if (!u) return;

    document.getElementById("modal-titulo").textContent = "Editar usuario";
    document.getElementById("inp-nombre-usu").value = u.nombre;
    document.getElementById("inp-usuario-usu").value = u.usuario;

    const passInput = document.getElementById("inp-pass-usu");

    // 👉 AQUÍ ES DONDE AHORA SÍ PONEMOS LA CONTRASEÑA ACTUAL
    passInput.value = u.contrasena || "";
    passInput.type = "password";
    passInput.placeholder = "";   // sin texto gris encima

    document.getElementById("inp-rol-usu").value = u.rol;

    document.getElementById("modal-usuario").classList.add("show");
}

function cerrarModal() {
    document.getElementById("modal-usuario").classList.remove("show");
}

// =================== GUARDAR ===================
async function guardarUsuario() {
    const nombre = document.getElementById("inp-nombre-usu").value.trim();
    const usuario = document.getElementById("inp-usuario-usu").value.trim();
    const contrasena = document.getElementById("inp-pass-usu").value;
    const rol = document.getElementById("inp-rol-usu").value;

    if (!nombre || !usuario || (!modoEdicion && !contrasena)) {
        alert("Nombre, usuario y contraseña (en nuevo) son obligatorios.");
        return;
    }

    try {
        if (modoEdicion) {
            const body = { nombre, usuario, rol };
            if (contrasena) body.contrasena = contrasena;

            const res = await fetch(`http://localhost:3000/usuarios/editar/${usuarioEditandoId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });

            const data = await res.json();
            if (data.msg === "ok") {
                alert("Usuario actualizado.");
            } else {
                alert("No se pudo actualizar el usuario.");
            }

        } else {
            const res = await fetch("http://localhost:3000/usuarios/crear", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nombre, usuario, contrasena, rol })
            });

            const data = await res.json();
            if (data.msg === "ok") {
                alert("Usuario creado correctamente.");
            } else {
                alert("No se pudo crear el usuario.");
            }
        }

        cerrarModal();
        await cargarUsuarios();
    } catch (err) {
        console.error(err);
        alert("Error al guardar usuario.");
    }
}

// =================== BLOQUEAR / DESBLOQUEAR ===================
async function bloquearUsuario(id) {
    const u = usuarios.find(x => x.id === id);
    if (!u) return;

    const accion = u.estado === "Activo" ? "bloquear" : "desbloquear";

    if (!confirm(`¿Seguro que deseas ${accion} a ${u.nombre}?`)) return;

    const admin = localStorage.getItem("usuarioNombre"); // nombre del admin logueado

    try {
        const res = await fetch(`http://localhost:3000/usuarios/bloquear/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ admin })
        });

        const data = await res.json();

        if (data.msg === "ok") {
            await cargarUsuarios();
        } else {
            alert("No se pudo actualizar el estado.");
        }

    } catch (err) {
        console.error(err);
        alert("Error al actualizar estado.");
    }
}


async function eliminarUsuario(id) {
    if (!confirm("¿Seguro que deseas eliminar esta cuenta?")) return;

    const res = await fetch(`http://localhost:3000/usuarios/eliminar/${id}`, {
        method: "DELETE"
    });

    const data = await res.json();
    if (data.msg === "ok") {
        alert("Usuario eliminado.");
        cargarUsuarios();
    } else {
        alert("No se pudo eliminar.");
    }
}
