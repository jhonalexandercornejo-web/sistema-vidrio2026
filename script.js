let pedidos = [];

let pedidoEditando = null;


// ===============================
// API
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
// FORMATEAR FECHA REGISTRO
// ===============================

function formatearCreadoEn(fecha) {

    if (!fecha) {
        return "No disponible";
    }


    const objetoFecha = new Date(fecha);


    if (isNaN(objetoFecha.getTime())) {
        return fecha;
    }


    return objetoFecha.toLocaleString(
        "es-PE",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false
        }
    );
}



// ===============================
// CREAR FILA VIDRIO
// ===============================

function agregarVidrio(datos = {}) {

    const lista =
        document.getElementById("listaVidrios");


    const fila =
        document.createElement("div");


    fila.className = "fila-vidrio";


    fila.innerHTML = `

        <div>

            <label>
                TIPO DE VIDRIO
            </label>

            <select class="tipoVidrio">

                <option value="INCOLORO">
                    INCOLORO
                </option>

                <option value="BRONCE">
                    BRONCE
                </option>

                <option value="GRIS">
                    GRIS
                </option>

                <option value="VERDE">
                    VERDE
                </option>

                <option value="AZUL">
                    AZUL
                </option>

                <option value="REFLECTIVO">
                    REFLECTIVO
                </option>

                <option value="LAMINADO">
                    LAMINADO
                </option>

                <option value="OTRO">
                    OTRO
                </option>

            </select>

        </div>


        <div>

            <label>
                ESPESOR (MM)
            </label>

            <select class="espesor">

                <option value="4">
                    4 mm
                </option>

                <option value="5">
                    5 mm
                </option>

                <option value="6">
                    6 mm
                </option>

                <option value="8">
                    8 mm
                </option>

                <option value="10">
                    10 mm
                </option>

                <option value="12">
                    12 mm
                </option>

                <option value="15">
                    15 mm
                </option>

                <option value="19">
                    19 mm
                </option>

            </select>

        </div>


        <div>

            <label>
                CANTIDAD
            </label>

            <input
                class="cantidadVidrio"
                type="number"
                min="0"
                step="1"
            >

        </div>


        <div>

            <label>
                METROS
            </label>

            <input
                class="metrosVidrio"
                type="number"
                min="0"
                step="0.01"
            >

        </div>


        <div>

            <label>
                PROCESO ESPECIAL
            </label>

            <select class="procesoEspecialVidrio">

                <option value="NINGUNO">
                    NINGUNO
                </option>

                <option value="ENTALLE">
                    ENTALLE
                </option>

                <option value="LIMPIO">
                    LIMPIO
                </option>

                <option value="ENTALLE Y LIMPIO">
                    ENTALLE Y LIMPIO
                </option>

            </select>

        </div>


        <button
            type="button"
            class="btn-quitar"
            onclick="quitarVidrio(this)"
        >
            Quitar
        </button>

    `;


    lista.appendChild(fila);


    fila.querySelector(".tipoVidrio").value =
        datos.tipoVidrio || "INCOLORO";


    fila.querySelector(".espesor").value =
        String(datos.espesor || "8");


    fila.querySelector(".cantidadVidrio").value =
        datos.cantidad ?? "";


    fila.querySelector(".metrosVidrio").value =
        datos.metros ?? "";


    fila.querySelector(".procesoEspecialVidrio").value =
        datos.procesoEspecial || "NINGUNO";
}



// ===============================
// QUITAR VIDRIO
// ===============================

function quitarVidrio(boton) {

    const lista =
        document.getElementById("listaVidrios");


    const filas =
        lista.querySelectorAll(".fila-vidrio");


    if (filas.length <= 1) {

        alert(
            "El pedido debe tener al menos un vidrio."
        );

        return;
    }


    boton.closest(".fila-vidrio").remove();
}



// ===============================
// OBTENER VIDRIOS
// ===============================

function obtenerVidriosFormulario() {

    const filas =
        document.querySelectorAll(".fila-vidrio");


    return Array.from(filas).map(fila => {

        return {

            tipoVidrio:
                fila.querySelector(".tipoVidrio").value,

            espesor:
                fila.querySelector(".espesor").value,

            cantidad:
                Number(
                    fila.querySelector(".cantidadVidrio").value
                ) || 0,

            metros:
                Number(
                    fila.querySelector(".metrosVidrio").value
                ) || 0,

            procesoEspecial:
                fila.querySelector(".procesoEspecialVidrio").value
        };

    });
}



// ===============================
// GUARDAR / EDITAR PEDIDO
// ===============================

async function guardarPedido() {

    const pedido = {

        op:
            document.getElementById("op")
                .value
                .trim(),

        cliente:
            document.getElementById("cliente")
                .value
                .trim(),

        fechaIngreso:
            document.getElementById("fechaIngreso").value,

        horaEntrega:
            document.getElementById("horaEntrega").value,

        fechaEntrega:
            document.getElementById("fechaEntrega").value,

        descripcion:
            document.getElementById("descripcion")
                .value
                .trim(),

        vidrios:
            obtenerVidriosFormulario()
    };


    if (!pedido.op || !pedido.cliente) {

        alert(
            "La OP y el nombre son obligatorios."
        );

        return;
    }


    if (pedido.vidrios.length === 0) {

        alert(
            "Debes agregar al menos un vidrio."
        );

        return;
    }


    try {

        if (pedidoEditando) {

            await api(
                `/api/pedidos/${pedidoEditando}/datos`,
                {
                    method: "PUT",
                    body: JSON.stringify(pedido)
                }
            );


            alert(
                "Pedido actualizado correctamente."
            );

        } else {

            await api(
                "/api/pedidos",
                {
                    method: "POST",
                    body: JSON.stringify(pedido)
                }
            );


            alert(
                "Pedido registrado correctamente."
            );
        }


        cancelarEdicion();

        await cargarDatos();


    } catch (error) {

        console.error(error);

        alert(error.message);
    }
}



// ===============================
// LIMPIAR FORMULARIO
// ===============================

function limpiarFormulario() {

    document.getElementById("op").value = "";

    document.getElementById("cliente").value = "";

    document.getElementById("fechaIngreso").value = "";

    document.getElementById("horaEntrega").value = "";

    document.getElementById("fechaEntrega").value = "";

    document.getElementById("descripcion").value = "";


    document.getElementById("listaVidrios").innerHTML = "";


    agregarVidrio();
}



// ===============================
// CARGAR DATOS
// ===============================

async function cargarDatos() {

    try {

        pedidos =
            await api("/api/pedidos");


        mostrarProduccion();

        actualizarResumen();


        const buscar =
            document.getElementById("buscar");


        if (
            buscar &&
            buscar.value.trim() !== ""
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
// MOSTRAR VIDRIOS
// ===============================

function crearResumenVidrios(vidrios = []) {

    if (!vidrios.length) {

        return `
            <div class="vidrio-resumen">
                Sin información de vidrio
            </div>
        `;
    }


    return vidrios.map(vidrio => {

        const especial =
            vidrio.procesoEspecial &&
            vidrio.procesoEspecial !== "NINGUNO"

                ? `
                    <span class="etiqueta-especial">
                        ${vidrio.procesoEspecial}
                    </span>
                `

                : "";


        return `

            <div class="vidrio-resumen">

                <strong>
                    ${vidrio.tipoVidrio || "INCOLORO"}
                    ${vidrio.espesor || "-"} mm
                </strong>

                <span>
                    -
                    ${vidrio.cantidad || 0} und
                </span>

                <span>
                    -
                    ${vidrio.metros || 0} m
                </span>

                ${especial}

            </div>

        `;

    }).join("");
}



// ===============================
// MOSTRAR PRODUCCIÓN
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

                        <strong>
                            ${pedido.cliente}
                        </strong>

                        <span>
                            Ingreso:
                            ${pedido.fechaIngreso || "-"}
                        </span>

                        <span>
                            🕐
                            ${pedido.horaEntrega || "SIN HORA"}
                        </span>

                        <span>
                            📅
                            ${pedido.fechaEntrega || "SIN FECHA"}
                        </span>

                    </div>


                    ${
                        pedido.descripcion
                            ? `
                                <div class="descripcion-card">
                                    ${pedido.descripcion}
                                </div>
                              `
                            : ""
                    }


                    <div class="resumen-vidrios">

                        ${crearResumenVidrios(
                            pedido.vidrios
                        )}

                    </div>


                    <div class="procesos">

                        ${crearProceso(
                            pedido,
                            "corte",
                            "CORTE"
                        )}

                        ${crearProceso(
                            pedido,
                            "entalle",
                            "ENTALLE"
                        )}

                        ${crearProceso(
                            pedido,
                            "limpios",
                            "LIMPIOS"
                        )}

                        ${crearProceso(
                            pedido,
                            "templado",
                            "TEMPLADO"
                        )}

                        ${crearProceso(
                            pedido,
                            "terminado",
                            "TERMINADO"
                        )}

                        ${crearProceso(
                            pedido,
                            "despacho",
                            "DESPACHO"
                        )}

                    </div>


                    <div class="detalle-op">

                        📝 Registrado:

                        <strong>
                            ${formatearCreadoEn(
                                pedido.creadoEn
                            )}
                        </strong>

                    </div>


                    <div class="acciones-pedido">

                        <button
                            class="btn-editar"
                            onclick="editarPedido(${pedido.id})"
                        >
                            ✎ Editar pedido
                        </button>


                        <button
                            class="btn-eliminar"
                            onclick="eliminarPedido(${pedido.id})"
                        >
                            🗑 Eliminar
                        </button>

                    </div>

                </div>

            `;

        }).join("");
}



// ===============================
// CREAR BOTÓN PROCESO
// ===============================

function crearProceso(
    pedido,
    campo,
    texto
) {

    const activo =
        Boolean(pedido[campo]);


    return `

        <div
            class="proceso ${activo ? "terminado" : ""}"

            onclick="cambiarProceso(
                ${pedido.id},
                '${campo}',
                ${!activo}
            )"
        >

            ${activo ? "✓ " : ""}

            ${texto}

        </div>

    `;
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
// EDITAR PEDIDO
// ===============================

function editarPedido(id) {

    const pedido =
        pedidos.find(
            p => Number(p.id) === Number(id)
        );


    if (!pedido) {

        alert(
            "Pedido no encontrado."
        );

        return;
    }


    pedidoEditando =
        pedido.id;


    document.getElementById("op").value =
        pedido.op || "";


    document.getElementById("cliente").value =
        pedido.cliente || "";


    document.getElementById("fechaIngreso").value =
        pedido.fechaIngreso || "";


    document.getElementById("horaEntrega").value =
        pedido.horaEntrega || "";


    document.getElementById("fechaEntrega").value =
        pedido.fechaEntrega || "";


    document.getElementById("descripcion").value =
        pedido.descripcion || "";


    const lista =
        document.getElementById("listaVidrios");


    lista.innerHTML = "";


    if (
        pedido.vidrios &&
        pedido.vidrios.length
    ) {

        pedido.vidrios.forEach(vidrio => {

            agregarVidrio(vidrio);

        });

    } else {

        agregarVidrio();
    }


    document.getElementById("tituloFormulario")
        .textContent =
        `EDITANDO OP ${pedido.op}`;


    document.getElementById("btnGuardar")
        .textContent =
        "GUARDAR CAMBIOS";


    document.getElementById(
        "btnCancelarEdicion"
    ).classList.remove("oculto");


    document.getElementById(
        "panelRegistro"
    ).scrollIntoView({
        behavior: "smooth"
    });
}



// ===============================
// CANCELAR EDICIÓN
// ===============================

function cancelarEdicion() {

    pedidoEditando = null;


    limpiarFormulario();


    document.getElementById("tituloFormulario")
        .textContent =
        "REGISTRO DE PEDIDOS";


    document.getElementById("btnGuardar")
        .textContent =
        "REGISTRAR PEDIDO";


    document.getElementById(
        "btnCancelarEdicion"
    ).classList.add("oculto");
}



// ===============================
// ELIMINAR
// ===============================

async function eliminarPedido(id) {

    const confirmar =
        confirm(
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
// BUSCAR
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


    if (!encontrados.length) {

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

                    <div class="op-cabecera">

                        <strong>
                            OP ${pedido.op}
                        </strong>

                        <strong>
                            ${pedido.cliente}
                        </strong>

                        <span>
                            🕐 hora de entrega:
                            ${pedido.horaEntrega || "-"}
                        </span>

                        <span>
                            📅 fecha de entrega:
                            ${pedido.fechaEntrega || "-"}
                        </span>

                    </div>


                    <div class="resumen-vidrios">

                        ${crearResumenVidrios(
                            pedido.vidrios
                        )}

                    </div>


                    <div class="procesos">

                        ${crearProceso(
                            pedido,
                            "corte",
                            "CORTE"
                        )}

                        ${crearProceso(
                            pedido,
                            "entalle",
                            "ENTALLE"
                        )}

                        ${crearProceso(
                            pedido,
                            "limpios",
                            "LIMPIOS"
                        )}

                        ${crearProceso(
                            pedido,
                            "templado",
                            "TEMPLADO"
                        )}

                        ${crearProceso(
                            pedido,
                            "terminado",
                            "TERMINADO"
                        )}

                        ${crearProceso(
                            pedido,
                            "despacho",
                            "DESPACHO"
                        )}

                    </div>


                    <div class="detalle-op">

                        📝 Registrado:

                        ${formatearCreadoEn(
                            pedido.creadoEn
                        )}

                    </div>

                </div>

            `;

        }).join("");
}



// ===============================
// RESUMEN
// ===============================

function actualizarResumen() {

    const total =
        pedidos.length;


    const pendientes =
        pedidos.filter(
            pedido =>
                !pedido.corte &&
                !pedido.entalle &&
                !pedido.limpios &&
                !pedido.templado &&
                !pedido.terminado
        ).length;


    const proceso =
        pedidos.filter(
            pedido =>

                (
                    pedido.corte ||
                    pedido.entalle ||
                    pedido.limpios ||
                    pedido.templado
                )

                &&

                !pedido.terminado

        ).length;


    const terminados =
        pedidos.filter(
            pedido => pedido.terminado
        ).length;


    document.getElementById("total")
        .textContent =
        total;


    document.getElementById("pendientes")
        .textContent =
        pendientes;


    document.getElementById("proceso")
        .textContent =
        proceso;


    document.getElementById("terminados")
        .textContent =
        terminados;
}



// ===============================
// INICIAR
// ===============================

agregarVidrio();

cargarDatos();
