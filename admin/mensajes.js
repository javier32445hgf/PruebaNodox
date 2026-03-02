let miId = null;
let miRol = null;
let usuarioActualChatId = null;
let usuarioActualChatNombre = null;
let usuariosChat = [];

document.addEventListener("DOMContentLoaded", () => {
    miId = Number(localStorage.getItem("usuarioId"));
    miRol = localStorage.getItem("usuarioRol");

    if (!miId || !miRol) {
        alert("Sesión no válida. Vuelve a iniciar sesión.");
        window.location.href = "../login/login.html";
        return;
    }

    cargarUsuariosParaChat();

    document.getElementById("btn-enviar-mensaje")
        .addEventListener("click", enviarMensaje);

    document.getElementById("chat-texto")
        .addEventListener("keydown", (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                enviarMensaje();
            }
        });
});

// =================== CARGAR LISTA DE USUARIOS ===================
async function cargarUsuariosParaChat() {
    try {
        const res = await fetch(`http://localhost:3000/mensajes/conversaciones/${miId}`);
        const lista = await res.json();

        usuariosChat = lista; // ahora trae: último mensaje, fecha, no leídos, online

        pintarListaUsuariosChat();

    } catch (err) {
        console.error("Error obteniendo conversaciones:", err);
        alert("No se pudieron cargar las conversaciones.");
    }
}



function pintarListaUsuariosChat() {
    const ul = document.getElementById("lista-usuarios-chat");
    ul.innerHTML = "";

    usuariosChat.forEach(u => {

        const li = document.createElement("li");
        li.classList.add("item-usuario-chat");

        let onlineDot = u.online ? "🟢" : "⚫";
        let preview = u.ultimo_mensaje ? u.ultimo_mensaje.slice(0, 20) + "..." : "Sin mensajes";
        let badge = u.no_leidos > 0 ? `<span class="badge">${u.no_leidos}</span>` : "";

        li.innerHTML = `
            ${onlineDot} ${u.nombre} 
            <br><small>${preview}</small>
            ${badge}
        `;

        li.onclick = () => abrirConversacion(u.id, u.nombre);

        if (u.id === usuarioActualChatId) {
            li.classList.add("activo");
        }

        ul.appendChild(li);
    });
}



// =================== ABRIR CONVERSACIÓN ===================
async function abrirConversacion(idContra, nombreContra) {
    usuarioActualChatId = idContra;
    usuarioActualChatNombre = nombreContra;

    document.getElementById("chat-contra-nombre").textContent = nombreContra;

    // marcar activo
    pintarListaUsuariosChat();

    try {
        const res = await fetch(`http://localhost:3000/mensajes/conversacion/${miId}/${idContra}`);
        const mensajes = await res.json();

        pintarMensajes(mensajes);
        await fetch("http://localhost:3000/mensajes/marcar-leidos", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mi_id: miId, contra_id: idContra })
        });

    } catch (err) {
        console.error("Error obteniendo conversación:", err);
        alert("No se pudo cargar la conversación.");
    }
}

function pintarMensajes(mensajes) {
    const cont = document.getElementById("chat-mensajes");
    cont.innerHTML = "";

    mensajes.forEach(msg => {
        const div = document.createElement("div");
        const esMio = msg.remitente_id === miId;

        div.classList.add("mensaje-burbuja");
        div.classList.add(esMio ? "mio" : "otro");

        const hora = new Date(msg.fecha).toLocaleTimeString('es-MX', {
            hour: '2-digit',
            minute: '2-digit'
        });

        div.innerHTML = `
            <div class="texto">${msg.mensaje}</div>
            <div class="hora">${hora}</div>
        `;

        cont.appendChild(div);
    });

    // scroll al final
    cont.scrollTop = cont.scrollHeight;
}

// =================== ENVIAR MENSAJE ===================
async function enviarMensaje() {
    if (!usuarioActualChatId) {
        alert("Selecciona un usuario para chatear.");
        return;
    }

    const textarea = document.getElementById("chat-texto");
    const texto = textarea.value.trim();
    if (!texto) return;

    try {
        const res = await fetch("http://localhost:3000/mensajes/enviar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                remitente_id: miId,
                destinatario_id: usuarioActualChatId,
                mensaje: texto
            })
        });

        const data = await res.json();
        if (data.msg === "ok") {
            textarea.value = "";
            // después de enviar, recargamos la conversación
            abrirConversacion(usuarioActualChatId, usuarioActualChatNombre);
        } else {
            alert("No se pudo enviar el mensaje.");
        }
    } catch (err) {
        console.error("Error enviando mensaje:", err);
        alert("No se pudo enviar el mensaje.");
    }
}

async function actualizarNotificaciones() {
    const res = await fetch(`http://localhost:3000/mensajes/conversaciones/${miId}`);
    const conv = await res.json();

    const tieneSinLeer = conv.some(c => c.no_leidos > 0);

    document.getElementById("notif-mensajes").classList.toggle(
        "notif-hidden",
        !tieneSinLeer
    );
}
setInterval(actualizarNotificaciones, 3000);
