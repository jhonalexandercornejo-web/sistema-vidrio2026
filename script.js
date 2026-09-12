let pedidos = [];

// ===============================
// CONEXIÓN CON EL SERVIDOR
// ===============================

async function api(url, options = {}) {

    const respuesta = await fetch(url, {
        headers: {
            "Content-Type": "application/json"
        },
        ...options
    });

    const datos = await respuesta.json();

    if (!respuesta.ok) {
        throw new Error(
            datos.error || "Error en el servidor"
        );
    }

    return datos;
}


// ===============================
// FORMATEAR FECHA DE REGISTRO
// ===============================

function formatearCreadoEn(creadoEn) {

    if (!creadoEn) {
        return "No disponible";
    }

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


// ===============================
// GUARDAR PEDIDO
// ===============================

async function guardarPedido() {

    const pedido = {

        op: document
            .getElementById("op")
            .value
            .trim(),

        cliente: document
            .getElementById("cliente")
            .value
            .trim(),

        fechaIngreso:
            document.getElementById("fechaIngreso").value,

        fechaEntrega:
            document.getElementById("fechaEntrega").value,

        horaEntrega:
            document.getElementById("horaEntrega").value,

        descripcion:
            document.getElementById("descripcion")
                .value
                .trim(),

        procesoEspecial:
            document.getElementById("procesoEspecial").value,

        cantidad:
            document.getElementById("cantidad").value,

        metros:
            document.getElementById("metros").value
    };


    if (!pedido.op || !pedido.cliente) {

        alert(
            "La OP y el cliente son obligatorios."
        );

        return;
    }


    try {

        await api("/api/pedidos", {

            method: "POST",

            body: JSON.stringify(pedido)

        });


        limpiarFormulario();

        await cargarDatos();

        alert(
            "Pedido registrado correctamente."
        );


    } catch (error) {

        console.error(error);

        alert(error.message);
    }
}


// ===============================
// CARGAR PEDIDOS
// ===============================

async function cargarDatos() {

    try {

        pedidos = await api("/api/pedidos");

        mostrarProduccion();

        actualizarResumen();


        const buscador =
            document.getElementById("buscar");


        if (
            buscador &&
            buscador.value.trim() !== ""
        ) {

            buscarPedido();
        }


    } catch (error) {

        console.error(error);

        alert(
            "No se pudieron cargar los pedidos."
        );
    }
}


// ===============================
// LIMPIAR FORMULARIO
// ===============================

function limpiarFormulario() {

    document.getElementById("op").value = "";

    document.getElementById("cliente").value = "";

    document.getElementById("fechaIngreso").value = "";

    document.getElementById("fechaEntrega").value = "";

    document.getElementById("horaEntrega").value = "";

    document.getElementById("descripcion").value = "";

    document.getElementById("procesoEspecial").value =
        "NINGUNO";

    document.getElementById("cantidad").value = "";

    document.getElementById("metros").value = "";
}


// ===============================
// MOSTRAR PROCESO DEL VIDRIO
// ===============================

function mostrarProduccion() {

    const contenedor =
        document.getElementById("produccion");


    if (!contenedor) {
        return;
    }


    if (pedidos.length === 0) {

        contenedor.innerHTML =
            "<p>No hay pedidos registrados.</p>";

        return;
    }


    contenedor.innerHTML =
        pedidos.map(pedido => {

            return `

                <div class="op-card">

                    <div class="op-cabecera">

                        <strong>
                            OP ${pedido.op}
                        </strong>

                        <span>
                            ${pedido.cliente}
                        </span>

                        <span>
                            🕐 ${pedido.horaEntrega || "SIN HORA"}
                        </span>

                        <span>
                            📅 ${pedido.fechaEntrega || "SIN FECHA"}
                        </span>

                    </div>


                    <div class="procesos">


                        <div
                            class="proceso ${pedido.corte ? "terminado" : ""}"
                            onclick="cambiarProceso(
                                ${pedido.id},
                                'corte',
                                ${!pedido.corte}
                            )"
                        >

                            ${pedido.corte
                                ? "✓ CORTE"
                                : "CORTE"}

                        </div>


                        <div
                            class="proceso ${pedido.entalle ? "terminado" : ""}"
                            onclick="cambiarProceso(
                                ${pedido.id},
                                'entalle',
                                ${!pedido.entalle}
                            )"
                        >

                            ${pedido.entalle
                                ? "✓ ENTALLE"
                                : "ENTALLE"}

                        </div>


                        <div
                            class="proceso ${pedido.limpios ? "terminado" : ""}"
                            onclick="cambiarProceso(
                                ${pedido.id},
                                'limpios',
                                ${!pedido.limpios}
                            )"
                        >

                            ${pedido.limpios
                                ? "✓ LIMPIOS"
                                : "LIMPIOS"}

                        </div>


                        <div
                            class="proceso ${pedido.templado ? "terminado" : ""}"
                            onclick="cambiarProceso(
                                ${pedido.id},
                                'templado',
                                ${!pedido.templado}
                            )"
                        >

                            ${pedido.templado
                                ? "✓ TEMPLADO"
                                : "TEMPLADO"}

                        </div>


                        <div
                            class="proceso ${pedido.terminado ? "terminado" : ""}"
                            onclick="cambiarProceso(
                                ${pedido.id},
                                'terminado',
                                ${!pedido.terminado}
                            )"
                        >

                            ${pedido.terminado
                                ? "✓ TERMINADO"
                                : "TERMINADO"}

                        </div>


                        <div
                            class="proceso ${pedido.despacho ? "terminado" : ""}"
                            onclick="cambiarProceso(
                                ${pedido.id},
                                'despacho',
                                ${!pedido.despacho}
                            )"
                        >

                            ${pedido.despacho
                                ? "✓ DESPACHO"
                                : "DESPACHO"}

                        </div>

                    </div>


                    <div class="detalle-op">

                        <strong>
                            Especial:
                        </strong>

                        ${pedido.procesoEspecial || "NINGUNO"}

                    </div>


                    <div class="detalle-op">

                        📝

                        <strong>
                            Registrado:
                        </strong>

                        ${formatearCreadoEn(
                            pedido.creadoEn
                        )}

                    </div>


                    <div class="acciones-pedido">

                        <button
                            class="btn-eliminar"
                            onclick="eliminarPedido(${pedido.id})"
                        >

                            🗑 Eliminar pedido

                        </button>

                    </div>

                </div>

            `;

        }).join("");
}


// ===============================
// CAMBIAR PROCESO
// ===============================

async function cambiarProceso(
    id,
    campo,
    valor
) {

    try {

        await api(
            `/api/pedidos/${id}`,
            {

                method: "PUT",

                body: JSON.stringify({
                    [campo]: valor
                })

            }
        );


        await cargarDatos();


    } catch (error) {

        console.error(error);

        alert(error.message);
    }
}


// ===============================
// ELIMINAR PEDIDO
// ===============================

async function eliminarPedido(id) {

    const confirmar = confirm(
        "¿Seguro que deseas eliminar este pedido?"
    );


    if (!confirmar) {
        return;
    }


    try {

        await api(
            `/api/pedidos/${id}`,
            {
                method: "DELETE"
            }
        );


        await cargarDatos();


    } catch (error) {

        console.error(error);

        alert(error.message);
    }
}


// ===============================
// BUSCAR PEDIDO
// ===============================

function buscarPedido() {

    const texto =
        document
            .getElementById("buscar")
            .value
            .trim()
            .toLowerCase();


    const resultado =
        document.getElementById("resultado");


    if (!resultado) {
        return;
    }


    if (!texto) {

        resultado.innerHTML = "";

        return;
    }


    const encontrados =
        pedidos.filter(pedido =>

            String(pedido.op)
                .toLowerCase()
                .includes(texto)

            ||

            String(pedido.cliente)
                .toLowerCase()
                .includes(texto)

        );


    if (encontrados.length === 0) {

        resultado.innerHTML = `

            <div class="resultado">

                No se encontraron pedidos.

            </div>

        `;

        return;
    }


    resultado.innerHTML =
        encontrados.map(pedido => {

            return `

                <div class="resultado">

                    <h3>
                        OP ${pedido.op}
                    </h3>


                    <p>
                        <strong>
                            Cliente:
                        </strong>

                        ${pedido.cliente}
                    </p>


                    <p>
                        <strong>
                            Fecha de ingreso:
                        </strong>

                        ${pedido.fechaIngreso || "-"}
                    </p>


                    <p>
                        <strong>
                            Fecha de entrega:
                        </strong>

                        ${pedido.fechaEntrega || "-"}
                    </p>


                    <p>
                        <strong>
                            Hora de entrega:
                        </strong>

                        ${pedido.horaEntrega || "-"}
                    </p>


                    <p>
                        <strong>
                            Descripción:
                        </strong>

                        ${pedido.descripcion || "-"}
                    </p>


                    <p>
                        <strong>
                            Proceso especial:
                        </strong>

                        ${pedido.procesoEspecial || "NINGUNO"}
                    </p>


                    <p>
                        <strong>
                            Cantidad:
                        </strong>

                        ${pedido.cantidad || 0}
                    </p>


                    <p>
                        <strong>
                            Metros:
                        </strong>

                        ${pedido.metros || 0}
                    </p>


                    <p>

                        📝

                        <strong>
                            Registrado:
                        </strong>

                        ${formatearCreadoEn(
                            pedido.creadoEn
                        )}

                    </p>


                    <div class="procesos-busqueda">


                        <div
                            class="proceso-busqueda ${pedido.corte ? "terminado" : ""}"
                            onclick="cambiarProceso(
                                ${pedido.id},
                                'corte',
                                ${!pedido.corte}
                            )"
                        >

                            ${pedido.corte
                                ? "✓ CORTE"
                                : "CORTE"}

                        </div>


                        <div
                            class="proceso-busqueda ${pedido.entalle ? "terminado" : ""}"
                            onclick="cambiarProceso(
                                ${pedido.id},
                                'entalle',
                                ${!pedido.entalle}
                            )"
                        >

                            ${pedido.entalle
                                ? "✓ ENTALLE"
                                : "ENTALLE"}

                        </div>


                        <div
                            class="proceso-busqueda ${pedido.limpios ? "terminado" : ""}"
                            onclick="cambiarProceso(
                                ${pedido.id},
                                'limpios',
                                ${!pedido.limpios}
                            )"
                        >

                            ${pedido.limpios
                                ? "✓ LIMPIOS"
                                : "LIMPIOS"}

                        </div>


                        <div
                            class="proceso-busqueda ${pedido.templado ? "terminado" : ""}"
                            onclick="cambiarProceso(
                                ${pedido.id},
                                'templado',
                                ${!pedido.templado}
                            )"
                        >

                            ${pedido.templado
                                ? "✓ TEMPLADO"
                                : "TEMPLADO"}

                        </div>


                        <div
                            class="proceso-busqueda ${pedido.terminado ? "terminado" : ""}"
                            onclick="cambiarProceso(
                                ${pedido.id},
                                'terminado',
                                ${!pedido.terminado}
                            )"
                        >

                            ${pedido.terminado
                                ? "✓ TERMINADO"
                                : "TERMINADO"}

                        </div>


                        <div
                            class="proceso-busqueda ${pedido.despacho ? "terminado" : ""}"
                            onclick="cambiarProceso(
                                ${pedido.id},
                                'despacho',
                                ${!pedido.despacho}
                            )"
                        >

                            ${pedido.despacho
                                ? "✓ DESPACHO"
                                : "DESPACHO"}

                        </div>

                    </div>

                </div>

            `;

        }).join("");
}


// ===============================
// ACTUALIZAR RESUMEN
// ===============================

function actualizarResumen() {

    const total =
        pedidos.length;


    const pendientes =
        pedidos.filter(
            pedido => !pedido.corte
        ).length;


    const proceso =
        pedidos.filter(
            pedido =>
                pedido.corte &&
                !pedido.terminado
        ).length;


    const terminados =
        pedidos.filter(
            pedido => pedido.terminado
        ).length;


    document
        .getElementById("total")
        .textContent = total;


    document
        .getElementById("pendientes")
        .textContent = pendientes;


    document
        .getElementById("proceso")
        .textContent = proceso;


    document
        .getElementById("terminados")
        .textContent = terminados;
}


// ===============================
// INICIAR SISTEMA
// ===============================

cargarDatos();
