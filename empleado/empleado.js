
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

    const elHora = document.getElementById("reloj-hora");
    const elFecha = document.getElementById("reloj-fecha");

    if (elHora && elFecha) {
        elHora.textContent = hora;
        elFecha.textContent = fecha;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    actualizarReloj();
    setInterval(actualizarReloj, 1000);
});
