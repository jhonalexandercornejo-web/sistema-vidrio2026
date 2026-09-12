let pedidos = [];

let pedidoEditando = null;

let paginaActual = 1;

let totalPaginas = 1;

const limitePorPagina = 50;

let busquedaActual = "";


// ===============================
// TIPOS DE VIDRIO Y ESPESORES
// ===============================

const tiposVidrio = {

    "INCOLORO": [
        "3",
        "4",
        "5",
        "6",
        "8",
        "10",
        "12"
    ],

    "INCOLORO AL ACIDO": [
        "6",
        "8"
    ],

    "GRIS": [
        "4",
        "5",
        "6",
        "8",
        "10"
    ],

    "VERDE": [
        "4"
    ],

    "BRONCE": [
        "6",
        "8",
        "10"
    ],

    "REFLEJANTE AZUL": [
        "4"
    ],

    "GRIS REFLEJANTE": [
        "5.5"
    ],

    "BRONCE REFLEJANTE": [
        "6",
        "8",
        "10"
    ],

    "INC REFLEJANTE": [
        "6",
        "8"
    ],

    "REFL LIGHT BLUE": [
        "6",
        "8"
    ],

    "DARCK BLUE": [
        "6"
    ],

    "ARTIC BLUE": [
        "6"
    ]
};


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


    const objetoFecha =
        new Date(fecha);


    if (
        isNaN(
            objetoFecha.getTime()
        )
    ) {

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
// ACTUALIZAR ESPESORES
// ===============================

function actualizarEspesores(
    selectTipo,
    espesorSeleccionado = null
) {

    const fila =
        selectTipo.closest(
            ".fila-vidrio"
        );


    const selectEspesor =
        fila.querySelector(
            ".espesor"
        );


    const tipo =
        selectTipo.value;


    const espesores =
        tiposVidrio[tipo] || [];


    selectEspesor.innerHTML = "";


    espesores.forEach(
        espesor => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                espesor;


            option.textContent =
                `${espesor} mm`;


            selectEspesor.appendChild(
                option
            );
        }
    );


    if (
        espesorSeleccionado !== null
        &&
        espesores.includes(
            String(
                espesorSeleccionado
            )
        )
    ) {

        selectEspesor.value =
            String(
                espesorSeleccionado
            );
    }
}


// ===============================
// CREAR FILA VIDRIO
// ===============================

function agregarVidrio(datos = {}) {

    const lista =
        document.getElementById(
            "listaVidrios"
        );


    if (!lista) {
        return;
    }


    const fila =
        document.createElement(
            "div"
        );


    fila.className =
        "fila-vidrio";


    fila.innerHTML = `

        <div>

            <label>
                TIPO DE VIDRIO
            </label>

            <select
                class="tipoVidrio"
                onchange="actualizarEspesores(this)"
            >

                <option value="INCOLORO">
                    INCOLORO
                </option>

                <option value="INCOLORO AL ACIDO">
                    INCOLORO AL ACIDO
                </option>

                <option value="GRIS">
                    GRIS
                </option>

                <option value="VERDE">
                    VERDE
                </option>

                <option value="BRONCE">
                    BRONCE
                </option>

                <option value="REFLEJANTE AZUL">
                    REFLEJANTE AZUL
                </option>

                <option value="GRIS REFLEJANTE">
                    GRIS REFLEJANTE
                </option>

                <option value="BRONCE REFLEJANTE">
                    BRONCE REFLEJANTE
                </option>

                <option value="INC REFLEJANTE">
                    INC REFLEJANTE
                </option>

                <option value="REFL LIGHT BLUE">
                    REFL LIGHT BLUE (AZUL CLARO)
                </option>

                <option value="DARCK BLUE">
                    DARCK BLUE (AZUL CHILLON)
                </option>

                <option value="ARTIC BLUE">
                    ARTIC BLUE (VERDOSO)
                </option>

            </select>

        </div>


        <div>

            <label>
                ESPESOR (MM)
            </label>

            <select
                class="espesor"
            >
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

            <select
                class="procesoEspecialVidrio"
            >

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


    lista.appendChild(
        fila
    );


    const selectTipo =
        fila.querySelector(
            ".tipoVidrio"
        );


    const tipoGuardado =
        datos.tipoVidrio || "INCOLORO";


    if (
        tiposVidrio[
            tipoGuardado
        ]
    ) {

        selectTipo.value =
            tipoGuardado;

    } else {

        selectTipo.value =
            "INCOLORO";
    }


    actualizarEspesores(
        selectTipo,
        datos.espesor || null
    );


    fila.querySelector(
        ".cantidadVidrio"
    ).value =
        datos.cantidad ?? "";


    fila.querySelector(
        ".metrosVidrio"
    ).value =
        datos.metros ?? "";


    fila.querySelector(
        ".procesoEspecialVidrio"
    ).value =
        datos.procesoEspecial
        || "NINGUNO";
}


// ===============================
// QUITAR VIDRIO
// ===============================

function quitarVidrio(boton) {

    const lista =
        document.getElementById(
            "listaVidrios"
        );


    const filas =
        lista.querySelectorAll(
            ".fila-vidrio"
        );


    if (
        filas.length <= 1
    ) {

        alert(
            "El pedido debe tener al menos un vidrio."
        );

        return;
    }


    boton.closest(
        ".fila-vidrio"
    ).remove();
}


// ===============================
// OBTENER VIDRIOS
// ===============================

function obtenerVidriosFormulario() {

    const filas =
        document.querySelectorAll(
            ".fila-vidrio"
        );


    return Array
        .from(filas)
        .map(fila => {

            return {

                tipoVidrio:
                    fila.querySelector(
                        ".tipoVidrio"
                    ).value,

                espesor:
                    fila.querySelector(
                        ".espesor"
                    ).value,

                cantidad:
                    Number(
                        fila.querySelector(
                            ".cantidadVidrio"
                        ).value
                    ) || 0,

                metros:
                    Number(
                        fila.querySelector(
                            ".metrosVidrio"
                        ).value
                    ) || 0,

                procesoEspecial:
                    fila.querySelector(
                        ".procesoEspecialVidrio"
                    ).value
            };

        });
}


// ===============================
// GUARDAR / EDITAR PEDIDO
// ===============================

async function guardarPedido() {

    const pedido = {

        op:
            document
                .getElementById("op")
                .value
                .trim(),

        cliente:
            document
                .getElementById("cliente")
                .value
                .trim(),

        fechaIngreso:
            document
                .getElementById(
                    "fechaIngreso"
                )
                .value,

        horaEntrega:
            document
                .getElementById(
                    "horaEntrega"
                )
                .value,

        fechaEntrega:
            document
                .getElementById(
                    "fechaEntrega"
                )
                .value,

        descripcion:
            document
                .getElementById(
                    "descripcion"
                )
                .value
                .trim(),

        vidrios:
            obtenerVidriosFormulario()
    };


    if (
        !pedido.op
        ||
        !pedido.cliente
    ) {

        alert(
            "La OP y el nombre son obligatorios."
        );

        return;
    }


    if (
        pedido.vidrios.length === 0
    ) {

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

                    body:
                        JSON.stringify(
                            pedido
                        )
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

                    body:
                        JSON.stringify(
                            pedido
                        )
                }
            );


            alert(
                "Pedido registrado correctamente."
            );
        }


        cancelarEdicion();


        busquedaActual = "";

        paginaActual = 1;


        const buscar =
            document.getElementById(
                "buscar"
            );


        if (buscar) {

            buscar.value = "";
        }


        await cargarDatos();


    } catch (error) {

        console.error(
            error
        );


        alert(
            error.message
        );
    }
}


// ===============================
// LIMPIAR FORMULARIO
// ===============================

function limpiarFormulario() {

    document
        .getElementById("op")
        .value = "";


    document
        .getElementById("cliente")
        .value = "";


    document
        .getElementById("fechaIngreso")
        .value = "";


    document
        .getElementById("horaEntrega")
        .value = "";


    document
        .getElementById("fechaEntrega")
        .value = "";


    document
        .getElementById("descripcion")
        .value = "";


    document
        .getElementById(
            "listaVidrios"
        )
        .innerHTML = "";


    agregarVidrio();
}


// ===============================
// CARGAR DATOS PAGINADOS
// ===============================

async function cargarDatos() {

    try {

        let url =
            `/api/pedidos-paginados?page=${paginaActual}&limit=${limitePorPagina}`;


        if (
            busquedaActual
        ) {

            url +=
                `&buscar=${encodeURIComponent(
                    busquedaActual
                )}`;
        }


        const respuesta =
            await api(url);


        pedidos =
            Array.isArray(
                respuesta.pedidos
            )

                ? respuesta.pedidos

                : [];


        paginaActual =
            respuesta.pagina || 1;


        totalPaginas =
            respuesta.totalPaginas || 1;


        mostrarProduccion();


        mostrarPaginacion(
            respuesta.total || 0
        );


        await actualizarResumen();


    } catch (error) {

        console.error(
            error
        );


        alert(
            "No se pudieron cargar los pedidos."
        );
    }
}


// ===============================
// MOSTRAR VIDRIOS
// ===============================

function crearResumenVidrios(
    vidrios = []
) {

    if (
        !vidrios.length
    ) {

        return `

            <div class="vidrio-resumen">

                Sin información de vidrio

            </div>

        `;
    }


    return vidrios
        .map(vidrio => {

            const especial =
                vidrio.procesoEspecial
                &&
                vidrio.procesoEspecial
                !== "NINGUNO"

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

        })
        .join("");
}


// ===============================
// MOSTRAR PRODUCCIÓN
// ===============================

function mostrarProduccion() {

    const contenedor =
        document.getElementById(
            "produccion"
        );


    if (!contenedor) {

        return;
    }


    if (
        pedidos.length === 0
    ) {

        contenedor.innerHTML =
            "<p>No hay pedidos encontrados.</p>";

        return;
    }


    contenedor.innerHTML =
        pedidos
            .map(pedido => {

                return `

                    <div
                        class="op-card"
                        id="pedido-${pedido.id}"
                    >

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

                                🕐 hora de entrega:

                                ${pedido.horaEntrega || "SIN HORA"}

                            </span>

                            <span>

                                📅 fecha de entrega:

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
                                onclick="cotizarPedido(${pedido.id})"
                            >
                                💰 Cotizar
                            </button>


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

            })
            .join("");
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
        Boolean(
            pedido[campo]
        );


    return `

        <div

            class="proceso ${
                activo
                    ? "terminado"
                    : ""
            }"

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

                body:
                    JSON.stringify({

                        [campo]:
                            valor

                    })
            }
        );


        await cargarDatos();


    } catch (error) {

        console.error(
            error
        );


        alert(
            error.message
        );
    }
}


// ===============================
// COTIZAR PEDIDO
// ===============================

function cotizarPedido(id) {

    const pedido =
        pedidos.find(
            p =>
                Number(p.id)
                ===
                Number(id)
        );


    if (!pedido) {

        alert(
            "Pedido no encontrado."
        );

        return;
    }


    const datosCotizacion = {

        pedidoId:
            pedido.id,

        op:
            pedido.op || "",

        cliente:
            pedido.cliente || "",

        fechaEntrega:
            pedido.fechaEntrega || "",

        descripcion:
            pedido.descripcion || "",

        vidrios:
            Array.isArray(
                pedido.vidrios
            )

                ? pedido.vidrios

                : []
    };


    localStorage.setItem(
        "pedidoParaCotizar",

        JSON.stringify(
            datosCotizacion
        )
    );


    window.open(
        "cotizaciones.html",
        "_blank"
    );
}


// ===============================
// EDITAR PEDIDO
// ===============================

function editarPedido(id) {

    const pedido =
        pedidos.find(
            p =>
                Number(p.id)
                ===
                Number(id)
        );


    if (!pedido) {

        alert(
            "Pedido no encontrado."
        );

        return;
    }


    pedidoEditando =
        pedido.id;


    document
        .getElementById("op")
        .value =
        pedido.op || "";


    document
        .getElementById("cliente")
        .value =
        pedido.cliente || "";


    document
        .getElementById(
            "fechaIngreso"
        )
        .value =
        pedido.fechaIngreso || "";


    document
        .getElementById(
            "horaEntrega"
        )
        .value =
        pedido.horaEntrega || "";


    document
        .getElementById(
            "fechaEntrega"
        )
        .value =
        pedido.fechaEntrega || "";


    document
        .getElementById(
            "descripcion"
        )
        .value =
        pedido.descripcion || "";


    const lista =
        document.getElementById(
            "listaVidrios"
        );


    lista.innerHTML = "";


    if (
        pedido.vidrios
        &&
        pedido.vidrios.length
    ) {

        pedido.vidrios.forEach(
            vidrio => {

                agregarVidrio(
                    vidrio
                );
            }
        );

    } else {

        agregarVidrio();
    }


    document
        .getElementById(
            "tituloFormulario"
        )
        .textContent =
        `EDITANDO OP ${pedido.op}`;


    document
        .getElementById(
            "btnGuardar"
        )
        .textContent =
        "GUARDAR CAMBIOS";


    document
        .getElementById(
            "btnCancelarEdicion"
        )
        .classList
        .remove(
            "oculto"
        );


    document
        .getElementById(
            "panelRegistro"
        )
        .scrollIntoView({

            behavior: "smooth"

        });
}


// ===============================
// CANCELAR EDICIÓN
// ===============================

function cancelarEdicion() {

    pedidoEditando = null;


    limpiarFormulario();


    document
        .getElementById(
            "tituloFormulario"
        )
        .textContent =
        "REGISTRO DE PEDIDOS";


    document
        .getElementById(
            "btnGuardar"
        )
        .textContent =
        "REGISTRAR PEDIDO";


    document
        .getElementById(
            "btnCancelarEdicion"
        )
        .classList
        .add(
            "oculto"
        );
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
                method:
                    "DELETE"
            }
        );


        if (
            pedidos.length === 1
            &&
            paginaActual > 1
        ) {

            paginaActual--;
        }


        await cargarDatos();


    } catch (error) {

        console.error(
            error
        );


        alert(
            error.message
        );
    }
}


// ===============================
// BUSCAR PEDIDO
// ===============================

async function buscarPedido() {

    const input =
        document.getElementById(
            "buscar"
        );


    if (!input) {

        return;
    }


    const texto =
        input.value.trim();


    const resultado =
        document.getElementById(
            "resultado"
        );


    if (resultado) {

        resultado.innerHTML = "";
    }


    busquedaActual =
        texto;


    paginaActual = 1;


    await cargarDatos();


    if (!texto) {

        return;
    }


    const pedidoExacto =
        pedidos.find(
            pedido =>

                String(
                    pedido.op
                )
                .toLowerCase()
                ===
                texto.toLowerCase()
        );


    if (pedidoExacto) {

        irAlPedido(
            pedidoExacto.id
        );
    }
}


// ===============================
// LIMPIAR BÚSQUEDA
// ===============================

async function limpiarBusqueda() {

    const buscar =
        document.getElementById(
            "buscar"
        );


    if (buscar) {

        buscar.value = "";
    }


    busquedaActual = "";

    paginaActual = 1;


    await cargarDatos();
}


// ===============================
// IR AL PEDIDO
// ===============================

function irAlPedido(id) {

    const tarjeta =
        document.getElementById(
            `pedido-${id}`
        );


    if (!tarjeta) {

        return;
    }


    tarjeta.scrollIntoView({

        behavior: "smooth",

        block: "center"

    });
}


// ===============================
// RESUMEN GENERAL
// ===============================

async function actualizarResumen() {

    try {

        const resumen =
            await api(
                "/api/resumen"
            );


        document
            .getElementById(
                "total"
            )
            .textContent =
            resumen.total || 0;


        document
            .getElementById(
                "pendientes"
            )
            .textContent =
            resumen.pendientes || 0;


        document
            .getElementById(
                "proceso"
            )
            .textContent =
            resumen.proceso || 0;


        document
            .getElementById(
                "terminados"
            )
            .textContent =
            resumen.terminados || 0;


    } catch (error) {

        console.error(
            "Error cargando resumen:",
            error
        );
    }
}


// ===============================
// PAGINACIÓN
// ===============================

function mostrarPaginacion(
    totalPedidos
) {

    let contenedor =
        document.getElementById(
            "paginacionPedidos"
        );


    if (!contenedor) {

        contenedor =
            document.createElement(
                "div"
            );


        contenedor.id =
            "paginacionPedidos";


        contenedor.style.display =
            "flex";


        contenedor.style.justifyContent =
            "center";


        contenedor.style.alignItems =
            "center";


        contenedor.style.gap =
            "10px";


        contenedor.style.flexWrap =
            "wrap";


        contenedor.style.margin =
            "25px 0";


        const produccion =
            document.getElementById(
                "produccion"
            );


        if (produccion) {

            produccion.insertAdjacentElement(
                "afterend",
                contenedor
            );
        }
    }


    if (
        totalPedidos === 0
    ) {

        contenedor.innerHTML = "";

        return;
    }


    contenedor.innerHTML = `

        <button
            type="button"
            onclick="paginaAnterior()"
            ${
                paginaActual <= 1
                    ? "disabled"
                    : ""
            }
        >
            ← ANTERIOR
        </button>


        <strong>

            Página ${paginaActual}
            de ${totalPaginas}

        </strong>


        <span>

            ${totalPedidos}

            pedido${
                totalPedidos === 1
                    ? ""
                    : "s"
            }

        </span>


        <button
            type="button"
            onclick="paginaSiguiente()"
            ${
                paginaActual >= totalPaginas
                    ? "disabled"
                    : ""
            }
        >
            SIGUIENTE →
        </button>

    `;
}


// ===============================
// PÁGINA ANTERIOR
// ===============================

async function paginaAnterior() {

    if (
        paginaActual <= 1
    ) {

        return;
    }


    paginaActual--;


    await cargarDatos();


    irArribaPedidos();
}


// ===============================
// PÁGINA SIGUIENTE
// ===============================

async function paginaSiguiente() {

    if (
        paginaActual >= totalPaginas
    ) {

        return;
    }


    paginaActual++;


    await cargarDatos();


    irArribaPedidos();
}


// ===============================
// IR ARRIBA DE LOS PEDIDOS
// ===============================

function irArribaPedidos() {

    const produccion =
        document.getElementById(
            "produccion"
        );


    if (!produccion) {

        return;
    }


    produccion.scrollIntoView({

        behavior: "smooth",

        block: "start"

    });
}


// ===============================
// PREPARAR BUSCADOR
// ===============================

function prepararBuscador() {

    const buscar =
        document.getElementById(
            "buscar"
        );


    if (!buscar) {

        return;
    }


    buscar.addEventListener(
        "keydown",

        function (evento) {

            if (
                evento.key === "Enter"
            ) {

                evento.preventDefault();


                buscarPedido();
            }
        }
    );


    buscar.addEventListener(
        "input",

        function () {

            if (
                buscar.value.trim() === ""
                &&
                busquedaActual !== ""
            ) {

                limpiarBusqueda();
            }
        }
    );
}


// ===============================
// INICIAR
// ===============================

agregarVidrio();

prepararBuscador();

cargarDatos();
