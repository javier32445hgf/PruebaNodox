async function login() {
    const usuario = document.getElementById("usuario").value;
    const contrasena = document.getElementById("contrasena").value;

    if (!usuario || !contrasena) {
        document.getElementById("error").innerText = "Llena todos los campos.";
        return;
    }

    const response = await fetch("http://localhost:3000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario, contrasena })
    });

    const data = await response.json();

    if (data.msg === "blocked") {
        document.getElementById("error").innerText = "Tu cuenta está bloqueada. Contacta al administrador.";
        return;
    }

    if (data.msg === "ok") {

        localStorage.setItem("usuarioId", data.id);
        localStorage.setItem("usuarioNombre", data.nombre);
        localStorage.setItem("usuarioRol", data.rol);

        if (data.rol === "Administrador") {
            window.location.href = "../admin/admin.html";
        }
        if (data.rol === "Empleado") {
            window.location.href = "../empleado/empleado.html";
        }
        if (data.rol === "Produccion") {
            window.location.href = "../produccion/produccion.html";
        }

    } else {

        document.getElementById("error").innerText = data.msg;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const inputUsuario = document.getElementById("usuario");
    const inputPassword = document.getElementById("contrasena");
    const btnLogin = document.getElementById("btn-login");

    function ejecutarLoginConEnter(event) {
        if (event.key === "Enter") {
            event.preventDefault();
            btnLogin.click(); 
        }
    }

    inputUsuario.addEventListener("keydown", ejecutarLoginConEnter);
    inputPassword.addEventListener("keydown", ejecutarLoginConEnter);
});

document.addEventListener("DOMContentLoaded", () => {
    const btnSalir = document.getElementById("btn-salir");

    btnSalir.addEventListener("click", () => {
        mostrarConfirmacionSalida();
    });
});


function mostrarConfirmacionSalida() {
    const noMostrar = localStorage.getItem("nodox_skip_logout_confirm");

    if (noMostrar === "true") {
        window.close();
        return;
    }

    const modal = document.getElementById("modal-salida");
    modal.classList.remove("oculto");

    const btnConfirmar = document.getElementById("confirmar-salida");
    const btnCancelar = document.getElementById("cancelar-salida");
    const checkNoMostrar = document.getElementById("no-mostrar-salida");

    
    btnConfirmar.onclick = null;
    btnCancelar.onclick = null;

    btnConfirmar.onclick = () => {
        if (checkNoMostrar.checked) {
            localStorage.setItem("nodox_skip_logout_confirm", "true");
        }
        window.close();
    };

    
    btnCancelar.onclick = () => {
        modal.classList.add("oculto");
    };
}

setInterval(() => {
    fetch("http://localhost:3000/usuarios/ping/" + miId);
}, 5000);
