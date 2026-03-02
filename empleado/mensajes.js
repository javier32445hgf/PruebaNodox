let miId = null;
let miRol = null;

let usuarioActualChatId = null;
let usuarioActualChatNombre = null;
let conversacionesCache = [];

document.addEventListener("DOMContentLoaded", () => {
    miId = Number(localStorage.getItem("usuarioId"));
    miRol = localStorage.getItem("usuarioRol");

    if (!miId || !miRol) {
        alert("Sesión no válida. Vuelve a iniciar sesión.");
        window.location.href = "../login/login.html";
        return;
    }

    cargarConversaciones();

    document.getElementById("btn-enviar-mensaje")
        .addEventListener("click", enviarMensaje);

    document.getElementById("chat-texto")
        .addEventListener("keydown", (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                enviarMensaje();
            }
        });

    setInterval(() => {
        cargarConversaciones(false);
        if (usuarioActualChatId) {
            abrirConversacion(usuarioActualChatId, usuarioActualChatNombre, false);
        }
    }, 5000);
});


async function cargarConversaciones(mostrarError = true) {
    try {
        const res = await fetch(`http://localhost:3000/mensajes/conversaciones/${miId}`);
        const convs = await res.json();
        conversacionesCache = convs;
        pintarListaUsuariosChat(convs);
    } catch (err) {
        console.error("Error obteniendo conversaciones:", err);
        if (mostrarError) {
            alert("No se pudieron cargar las conversaciones.");
        }
    }
}

function pintarListaUsuariosChat(lista) {
    const ul = document.getElementById("lista-usuarios-chat");
    ul.innerHTML = "";

    if (!lista || lista.length === 0) {
        const li = document.createElement("li");
        li.textContent = "Sin conversaciones todavía.";
        li.style.fontSize = "14px";
        li.style.color = "#6b7280";
        ul.appendChild(li);
        return;
    }

    lista.forEach(u => {
        const li = document.createElement("li");
        li.classList.add("item-usuario-chat");

        if (u.id === usuarioActualChatId) {
            li.classList.add("activo");
        }

        const onlineDot = u.online ? "●" : "○";
        const onlineColor = u.online ? "#22c55e" : "#9ca3af";

        const preview = u.ultimo_mensaje ? u.ultimo_mensaje.substring(0, 30) + (u.ultimo_mensaje.length > 30 ? "..." : "") : "Sin mensajes";

        li.innerHTML = `
            <span style="color:${onlineColor}; margin-right:6px;">${onlineDot}</span>
            <strong>${u.nombre}</strong> <span style="font-size:11px; color:#6b7280;">(${u.rol})</span>
            <div style="font-size:12px; color:#6b7280;">${preview}</div>
        `;

        if (u.no_leidos && u.no_leidos > 0) {
            const badge = document.createElement("span");
            badge.textContent = u.no_leidos;
            badge.style.background = "#f97316";
            badge.style.color = "#fff";
            badge.style.borderRadius = "999px";
            badge.style.padding = "2px 6px";
            badge.style.fontSize = "11px";
            badge.style.marginLeft = "6px";
            li.appendChild(badge);
        }

        li.onclick = () => abrirConversacion(u.id, u.nombre);
        ul.appendChild(li);
    });
}

async function abrirConversacion(idContra, nombreContra, marcarLeidos = true) {
    usuarioActualChatId = idContra;
    usuarioActualChatNombre = nombreContra;

    document.getElementById("chat-contra-nombre").textContent = nombreContra;

   
    pintarListaUsuariosChat(conversacionesCache);

    try {
        const res = await fetch(`http://localhost:3000/mensajes/conversacion/${miId}/${idContra}`);
        const mensajes = await res.json();
        pintarMensajes(mensajes);

        if (marcarLeidos) {
            await fetch("http://localhost:3000/mensajes/marcar-leidos", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mi_id: miId, contra_id: idContra })
            });

            cargarConversaciones(false);
        }

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

        const hora = new Date(msg.fecha).toLocaleTimeString("es-MX", {
            hour: "2-digit",
            minute: "2-digit"
        });

        div.innerHTML = `
            <div class="texto">${msg.mensaje}</div>
            <div class="hora">${hora}</div>
        `;

        cont.appendChild(div);
    });

    cont.scrollTop = cont.scrollHeight;
}


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
       
            abrirConversacion(usuarioActualChatId, usuarioActualChatNombre);
        } else {
            alert("No se pudo enviar el mensaje.");
        }
    } catch (err) {
        console.error("Error enviando mensaje:", err);
        alert("No se pudo enviar el mensaje.");
    }
}
