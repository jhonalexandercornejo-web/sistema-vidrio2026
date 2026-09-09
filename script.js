let pedidos = [];

async function api(url, options = {}) {
    const response = await fetch(url, {
        headers: { "Content-Type": "application/json" },
        ...options
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Error en el servidor");
    }

    return data;
}

async function guardarPedido() {
    const pedido = {
        op: document.getElementById("op").value.trim(),
        cliente: document.getElementById("cliente").value.trim(),
        fechaIngreso: document.getElementById("fechaIngreso").value,
        fechaEntrega: document.getElementById("fechaEntrega").value,
        horaEntrega: document.getElementById("horaEntrega").value,
        descripcion: document.getElementById("descripcion").value.trim(),
        procesoEspecial: document.getElementById("procesoEspecial").value,
        cantidad: document.getElementById("cantidad").value,
        metros: document.getElementById("metros").value
    };

    if (!pedido.op || !pedido.cliente) {
        alert("Ingrese la OP y el cliente.");
        return;
    }

    try {
        await api("/api/pedidos", {
            method: "POST",
            body: JSON.stringify(pedido)
        });

        limpiarFormulario();
        await cargarDatos();
        alert("Pedido registrado correctamente.");
    } catch (error) {
        alert(error.message);
    }
}

async function cargarDatos() {
    try {
        pedidos = await api("/api/pedidos");

        mostrarProduccion();
        actualizarResumen();

        const texto = document.getElementById("buscar").value.trim();

        if (texto) {
            buscarPedido();
        }
    } catch (error) {
        console.error(error);

        document.getElementById("produccion").innerHTML =
            "<p>No se pudo conectar con la base de datos.</p>";
    }
}

function limpiarFormulario() {
    document.getElementById("op").value = "";
    document.getElementById("cliente").value = "";
    document.getElementById("fechaIngreso").value = "";
    document.getElementById("fechaEntrega").value = "";
    document.getElementById("horaEntrega").value = "";
    document.getElementById("descripcion").value = "";
    document.getElementById("procesoEspecial").value = "NINGUNO";
    document.getElementById("cantidad").value = "";
    document.getElementById("metros").value = "";
}

function mostrarProduccion() {
    const contenedor = document.getElementById("produccion");

    if (pedidos.length === 0) {
        contenedor.innerHTML = "<p>No hay pedidos registrados.</p>";
        return;
    }

    const pedidosOrdenados = [...pedidos].sort((a, b) => {
        if (
            a.fechaEntrega &&
            b.fechaEntrega &&
            a.fechaEntrega !== b.fechaEntrega
        ) {
            return a.fechaEntrega.localeCompare(b.fechaEntrega);
        }

        if (!a.fechaEntrega) return 1;
        if (!b.fechaEntrega) return -1;

        if (!a.horaEntrega) return 1;
        if (!b.horaEntrega) return -1;

        return a.horaEntrega.localeCompare(b.horaEntrega);
    });

    contenedor.innerHTML = pedidosOrdenados.map(pedido => `
        <div class="op-card">

            <div class="op-cabecera">
                <strong>OP ${pedido.op}</strong>
                <span>${pedido.cliente}</span>
                <span>🕐 ${pedido.horaEntrega || "SIN HORA"}</span>
                <span>📅 ${pedido.fechaEntrega || "SIN FECHA"}</span>
            </div>

            <div class="procesos">

                ${crearProceso(
                    "CORTE",
                    pedido.corte,
                    pedido.id,
                    "corte"
                )}

                ${crearProceso(
                    "ENTALLE",
                    pedido.entalle,
                    pedido.id,
                    "entalle"
                )}

                ${crearProceso(
                    "LIMPIOS",
                    pedido.limpios,
                    pedido.id,
                    "limpios"
                )}

                ${crearProceso(
                    "TEMPLADO",
                    pedido.templado,
                    pedido.id,
                    "templado"
                )}

                ${crearProceso(
                    "TERMINADO",
                    pedido.terminado,
                    pedido.id,
                    "terminado"
                )}

                ${crearProceso(
                    "DESPACHO",
                    pedido.despacho,
                    pedido.id,
                    "despacho"
                )}

            </div>

            <div class="detalle-op">
                Especial:
                <strong>
                    ${pedido.procesoEspecial || "NINGUNO"}
                </strong>
            </div>

        </div>
    `).join("");
}

function crearProceso(nombre, terminado, id, proceso) {
    return `
        <div
            class="${terminado ? "proceso terminado" : "proceso"}"
            onclick="cambiarProceso(${id}, '${proceso}')"
        >
            ${terminado ? "✓ " : ""}${nombre}
        </div>
    `;
}

async function cambiarProceso(id, proceso) {
    const pedido = pedidos.find(p => p.id === id);

    if (!pedido) return;

    const cambios = {};

    if (proceso === "terminado") {

        if (!pedido.terminado) {

            cambios.terminado = true;
            cambios.corte = true;
            cambios.entalle = true;
            cambios.limpios = true;
            cambios.templado = true;

        } else {

            cambios.terminado = false;
            cambios.templado = false;

        }

    } else if (proceso === "templado") {

        cambios.templado = !pedido.templado;

        if (pedido.templado) {
            cambios.terminado = false;
        }

    } else if (proceso === "limpios") {

        cambios.limpios = !pedido.limpios;

        if (pedido.limpios) {
            cambios.templado = false;
            cambios.terminado = false;
        }

    } else if (proceso === "entalle") {

        cambios.entalle = !pedido.entalle;

        if (pedido.entalle) {
            cambios.limpios = false;
            cambios.templado = false;
            cambios.terminado = false;
        }

    } else if (proceso === "corte") {

        cambios.corte = !pedido.corte;

        if (pedido.corte) {
            cambios.entalle = false;
            cambios.limpios = false;
            cambios.templado = false;
            cambios.terminado = false;
        }

    } else if (proceso === "despacho") {

        cambios.despacho = !pedido.despacho;

    }

    try {

        await api(`/api/pedidos/${id}`, {
            method: "PUT",
            body: JSON.stringify(cambios)
        });

        await cargarDatos();

    } catch (error) {

        alert(error.message);

    }
}

function buscarPedido() {

    const texto = document
        .getElementById("buscar")
        .value
        .toLowerCase()
        .trim();

    const resultado = document.getElementById("resultado");

    if (!texto) {
        resultado.innerHTML = "";
        return;
    }

    const encontrados = pedidos.filter(pedido =>
        String(pedido.op)
            .toLowerCase()
            .includes(texto) ||

        String(pedido.cliente)
            .toLowerCase()
            .includes(texto)
    );

    if (encontrados.length === 0) {

        resultado.innerHTML =
            "<p>No se encontró ningún pedido.</p>";

        return;
    }

    resultado.innerHTML = encontrados.map(pedido => {

        let estadoActual = "PENDIENTE";

        if (pedido.terminado) {
            estadoActual = "TERMINADO";

        } else if (pedido.templado) {
            estadoActual = "TEMPLADO";

        } else if (pedido.limpios) {
            estadoActual = "LIMPIOS";

        } else if (pedido.entalle) {
            estadoActual = "ENTALLE";

        } else if (pedido.corte) {
            estadoActual = "CORTE";
        }

        return `
            <div class="resultado">

                <h3>OP: ${pedido.op}</h3>

                <p>
                    <strong>Cliente:</strong>
                    ${pedido.cliente}
                </p>

                <p>
                    <strong>Entrega:</strong>
                    ${pedido.fechaEntrega || "SIN FECHA"}
                    ${pedido.horaEntrega || ""}
                </p>

                <div class="estado-pedido">

                    <strong>ESTADO ACTUAL</strong>

                    <div class="estado-grande">
                        ${estadoActual}
                    </div>

                </div>

                <div class="procesos-busqueda">

                    ${buscarProceso(
                        "CORTE",
                        pedido.corte,
                        pedido.id,
                        "corte"
                    )}

                    ${buscarProceso(
                        "ENTALLE",
                        pedido.entalle,
                        pedido.id,
                        "entalle"
                    )}

                    ${buscarProceso(
                        "LIMPIOS",
                        pedido.limpios,
                        pedido.id,
                        "limpios"
                    )}

                    ${buscarProceso(
                        "TEMPLADO",
                        pedido.templado,
                        pedido.id,
                        "templado"
                    )}

                    ${buscarProceso(
                        "TERMINADO",
                        pedido.terminado,
                        pedido.id,
                        "terminado"
                    )}

                    ${buscarProceso(
                        "DESPACHO",
                        pedido.despacho,
                        pedido.id,
                        "despacho"
                    )}

                </div>

                <p>
                    <strong>Descripción:</strong>
                    ${pedido.descripcion || "-"}
                </p>

                <p>
                    <strong>Proceso especial:</strong>
                    ${pedido.procesoEspecial || "NINGUNO"}
                </p>

                <p>
                    <strong>Cantidad:</strong>
                    ${pedido.cantidad || "-"}
                </p>

                <p>
                    <strong>Metros:</strong>
                    ${pedido.metros || "-"}
                </p>

            </div>
        `;

    }).join("");
}

function buscarProceso(nombre, estado, id, proceso) {

    return `
        <span
            class="${estado ? "proceso-busqueda terminado" : "proceso-busqueda"}"
            onclick="cambiarProceso(${id}, '${proceso}')"
            style="cursor: pointer;"
        >
            ${estado ? "✓" : "○"} ${nombre}
        </span>
    `;
}

function actualizarResumen() {

    const total = pedidos.length;

    let pendientes = 0;
    let terminados = 0;
    let proceso = 0;

    pedidos.forEach(pedido => {

        if (pedido.terminado) {

            terminados++;
            return;

        }

        const procesos = [
            pedido.corte,
            pedido.entalle,
            pedido.limpios,
            pedido.templado
        ];

        if (procesos.filter(Boolean).length === 0) {

            pendientes++;

        } else {

            proceso++;

        }
    });

    document.getElementById("total").textContent = total;
    document.getElementById("pendientes").textContent = pendientes;
    document.getElementById("proceso").textContent = proceso;
    document.getElementById("terminados").textContent = terminados;
}

cargarDatos();
