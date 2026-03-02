
function logout() {
    window.location.href = "../login/login.html";
}


function actualizarReloj() {
    const ahora = new Date();

  
    const hora = ahora.toLocaleTimeString("es-MX", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    });


    const fecha = ahora.toLocaleDateString("es-MX", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    });

    document.getElementById("reloj-hora").textContent = hora;
    document.getElementById("reloj-fecha").textContent = fecha.charAt(0).toUpperCase() + fecha.slice(1);
}

setInterval(actualizarReloj, 1000);
actualizarReloj();
