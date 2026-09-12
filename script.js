let pedidos = [];

async function api(url, options = {}) {
    const respuesta = await fetch(url, {
        headers: {
            "Content-Type": "application/json"
        },
        ...options
    });

    const datos = await respuesta.json();

    if (!respuesta.ok) {
        throw new Error(datos.error || "Error en la solicitud");
    }

    return datos;
}

function formatearCreadoEn(creadoEn) {
    if (!creadoEn) return "No disponible";

    const fecha = new Date(creadoEn);

    if (isNaN(fecha.getTime())) {
        return "No disponible";
    }

    return fecha.toLocaleString("es-PE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
    });
}

async function guardarPedido() {

    const op = document.getElementById("op").value.trim();
    const cliente = document.getElementById("cliente").value.trim();
    const fechaIngreso = document.getElementById("fechaIngreso").value;
    const fechaEntrega = document.getElementById("fechaEntrega").value;
    const horaEntrega = document.getElementById("horaEntrega").value;
    const descripcion = document.getElementById("descripcion").value.trim();
    const procesoEspecial = document.getElementById("procesoEspecial").value;
    const cantidad = document.getElementById("cantidad").value;
    const metros = document.getElementById("metros").value;

    if (!op || !cliente) {
        alert("La OP y el cliente son obligatorios.");
        return;
    }

    try {

        const pedido = await api("/api/pedidos", {
            method: "POST",
            body: JSON.stringify({
                op,
                cliente,
                fechaIngreso,
                fechaEntrega,
                horaEntrega,
                descripcion,
                procesoEspecial,
                cantidad,
                metros
            })
        });

        pedidos.push(pedido);

        limpiarFormulario();

        await cargarDatos();

        alert("Pedido registrado correctamente.");

    } catch (error) {

        console.error(error);

        alert(error.message);
    }
}

async function cargarDatos() {

    try {

        pedidos = await api("/api/pedidos");

        mostrarProduccion();
        actualizarResumen();

        const buscar = document.getElementById("buscar");

        if (buscar && buscar.value.trim() !== "") {
            buscarPedido();
        }

    } catch (error) {

        console.error(error);

        alert("No se pudieron cargar los pedidos.");
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

    if (!contenedor) return;

    if (pedidos.length === 0) {

        contenedor.innerHTML = `
            <p>No hay pedidos registrados.</p>
        `;

        return;
    }

    contenedor.innerHTML = pedidos.map(pedido => {

        return `
            <div class="pedido">

                <h3>OP: ${pedido.op}</h3>

                <p>
                    <strong>Cliente:</strong>
                    ${pedido.cliente}
                </p>

                <p>
                    <strong>Fecha de ingreso:</strong>
                    ${pedido.fechaIngreso || "-"}
                </p>

                <p>
                    <strong>Fecha de entrega:</strong>
                    ${pedido.fechaEntrega || "-"}
                </p>

                <p>
                    <strong>Hora de entrega:</strong>
                    ${pedido.horaEntrega || "-"}
                </p>

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
                    ${pedido.cantidad || 0}
                </p>

                <p>
                    <strong>Metros:</strong>
                    ${pedido.metros || 0}
                </p>

                <div class="detalle-registro">
                    📝 Registrado:
                    <strong>
                        ${formatearCreadoEn(pedido.creadoEn)}
                    </strong>
                </div>

                <div class="proceso-botones">

                    <button onclick="cambiarProceso(${pedido.id}, 'corte', ${!pedido.corte})">
                        ${pedido.corte ? "✓ CORTE" : "CORTE"}
                    </button>

                    <button onclick="cambiarProceso(${pedido.id}, 'entalle', ${!pedido.entalle})">
                        ${pedido.entalle ? "✓ ENTALLE" : "ENTALLE"}
                    </button>

                    <button onclick="cambiarProceso(${pedido.id}, 'limpios', ${!pedido.limpios})">
                        ${pedido.limpios ? "✓ LIMPIO" : "LIMPIO"}
                    </button>

                    <button onclick="cambiarProceso(${pedido.id}, 'templado', ${!pedido.templado})">
                        ${pedido.templado ? "✓ TEMPLADO" : "TEMPLADO"}
                    </button>

                    <button onclick="cambiarProceso(${pedido.id}, 'terminado', ${!pedido.terminado})">
                        ${pedido.terminado ? "✓ TERMINADO" : "TERMINADO"}
                    </button>

                    <button onclick="cambiarProceso(${pedido.id}, 'despacho', ${!pedido.despacho})">
                        ${pedido.despacho ? "✓ DESPACHO" : "DESPACHO"}
                    </button>

                    <button onclick="eliminarPedido(${pedido.id})">
                        ELIMINAR
                    </button>

                </div>

            </div>
        `;

    }).join("");
}

async function cambiarProceso(id, campo, valor) {

    try {

        await api(`/api/pedidos/${id}`, {
            method: "PUT",
            body: JSON.stringify({
                [campo]: valor
            })
        });

        await cargarDatos();

    } catch (error) {

        console.error(error);

        alert(error.message);
    }
}

async function eliminarPedido(id) {

    const confirmar = confirm(
        "¿Seguro que deseas eliminar este pedido?"
    );

    if (!confirmar) return;

    try {

        await api(`/api/pedidos/${id}`, {
            method: "DELETE"
        });

        await cargarDatos();

    } catch (error) {

        console.error(error);

        alert(error.message);
    }
}

function buscarPedido() {

    const texto = document
        .getElementById("buscar")
        .value
        .trim()
        .toLowerCase();

    const resultado = document.getElementById("resultado");

    if (!resultado) return;

    if (!texto) {

        resultado.innerHTML = "";

        return;
    }

    const encontrados = pedidos.filter(pedido =>
        String(pedido.op).toLowerCase().includes(texto) ||
        String(pedido.cliente).toLowerCase().includes(texto)
    );

    if (encontrados.length === 0) {

        resultado.innerHTML = `
            <p>No se encontraron pedidos.</p>
        `;

        return;
    }

    resultado.innerHTML = encontrados.map(pedido => `

        <div class="resultado-pedido">

            <h3>OP: ${pedido.op}</h3>

            <p>
                <strong>Cliente:</strong>
                ${pedido.cliente}
            </p>

            <p>
                <strong>Fecha ingreso:</strong>
                ${pedido.fechaIngreso || "-"}
            </p>

            <p>
                <strong>Fecha entrega:</strong>
                ${pedido.fechaEntrega || "-"}
            </p>

            <p>
                <strong>Hora entrega:</strong>
                ${pedido.horaEntrega || "-"}
            </p>

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
                ${pedido.cantidad || 0}
            </p>

            <p>
                <strong>Metros:</strong>
                ${pedido.metros || 0}
            </p>

            <p>
                <strong>Registrado:</strong>
                ${formatearCreadoEn(pedido.creadoEn)}
            </p>

        </div>

    `).join("");
}

function actualizarResumen() {

    const total = pedidos.length;

    const pendientes = pedidos.filter(pedido =>
        !pedido.corte
    ).length;

    const proceso = pedidos.filter(pedido =>
        pedido.corte &&
        !pedido.terminado
    ).length;

    const terminados = pedidos.filter(pedido =>
        pedido.terminado
    ).length;

    document.getElementById("total").textContent = total;
    document.getElementById("pendientes").textContent = pendientes;
    document.getElementById("proceso").textContent = proceso;
    document.getElementById("terminados").textContent = terminados;
}

cargarDatos();
