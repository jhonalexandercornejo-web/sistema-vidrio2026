let pedidos = [];

let pedidoEditando = null;

let paginaActual = 1;

let totalPaginas = 1;

const limitePorPagina = 50;

let busquedaActual = "";


// ===============================
// API
// ===============================

async function api(
    url,
    options = {}
) {

    const configuracion = {
        headers: {
            "Content-Type":
                "application/json"
        },
        ...options
    };


    const response =
        await fetch(
            url,
            configuracion
        );


    let data = {};

    try {

        data =
            await response.json();

    } catch (error) {

        data = {};
    }


    if (!response.ok) {

        throw new Error(
            data.error
            ||
            "Error en el servidor"
        );
    }


    return data;
}


// ===============================
// TIPOS DE VIDRIO
// ===============================

const tiposVidrio = [

    {
        nombre: "INCOLORO",
        espesores: [
            "3",
            "4",
            "5",
            "6",
            "8",
            "10",
            "12"
        ]
    },

    {
        nombre: "INCOLORO AL ACIDO",
        espesores: [
            "6",
            "8"
        ]
    },

    {
        nombre: "GRIS",
        espesores: [
            "4",
            "5",
            "6",
            "8",
            "10"
        ]
    },

    {
        nombre: "VERDE",
        espesores: [
            "4"
        ]
    },

    {
        nombre: "BRONCE",
        espesores: [
            "6",
            "8",
            "10"
        ]
    },

    {
        nombre: "REFLEJANTE AZUL",
        espesores: [
            "4"
        ]
    },

    {
        nombre: "GRIS REFLEJANTE",
        espesores: [
            "5.5"
        ]
    },

    {
        nombre: "BRONCE REFLEJANTE",
        espesores: [
            "6",
            "8"
        ]
    },

    {
        nombre: "INC REFLEJANTE",
        espesores: [
            "6",
            "8"
        ]
    },

    {
        nombre: "REFL LIGHT BLUE",
        espesores: [
            "6",
            "8"
        ]
    },

    {
        nombre: "DARCK BLUE",
        espesores: [
            "6"
        ]
    },

    {
        nombre: "ARTIC BLUE",
        espesores: [
            "6"
        ]
    }

];


// ===============================
// CREAR OPCIONES TIPO VIDRIO
// ===============================

function crearOpcionesTipoVidrio(
    seleccionado = "INCOLORO"
) {

    return tiposVidrio
        .map(tipo => {

            return `

                <option
                    value="${tipo.nombre}"
                    ${
                        tipo.nombre
                        === seleccionado
                            ? "selected"
                            : ""
                    }
                >
                    ${tipo.nombre}
                </option>

            `;

        })
        .join("");
}


// ===============================
// OBTENER ESPESORES
// ===============================

function obtenerEspesores(
    tipoVidrio
) {

    const encontrado =
        tiposVidrio.find(
            tipo =>
                tipo.nombre
                === tipoVidrio
        );


    if (!encontrado) {

        return [
            "3",
            "4",
            "5",
            "6",
            "8",
            "10",
            "12"
        ];
    }


    return encontrado.espesores;
}


// ===============================
// CREAR OPCIONES ESPESOR
// ===============================

function crearOpcionesEspesor(
    tipoVidrio,
    seleccionado = ""
) {

    const espesores =
        obtenerEspesores(
            tipoVidrio
        );


    return espesores
        .map(espesor => {

            return `

                <option
                    value="${espesor}"
                    ${
                        String(espesor)
                        ===
                        String(seleccionado)
                            ? "selected"
                            : ""
                    }
                >
                    ${espesor} mm
                </option>

            `;

        })
        .join("");
}


// ===============================
// CAMBIAR ESPESORES
// ===============================

function cambiarEspesores(
    selectTipo
) {

    const fila =
        selectTipo.closest(
            ".fila-vidrio"
        );


    if (!fila) {
        return;
    }


    const selectEspesor =
        fila.querySelector(
            ".espesor"
        );


    if (!selectEspesor) {
        return;
    }


    selectEspesor.innerHTML =
        crearOpcionesEspesor(
            selectTipo.value
        );
}


// ===============================
// AGREGAR VIDRIO
// ===============================

function agregarVidrio(
    datos = {}
) {

    const lista =
        document.getElementById(
            "listaVidrios"
        );


    if (!lista) {
        return;
    }


    const tipoInicial =
        datos.tipoVidrio
        ||
        "INCOLORO";


    const espesores =
        obtenerEspesores(
            tipoInicial
        );


    const espesorInicial =
        datos.espesor
        ||
        espesores[0]
        ||
        "8";


    const fila =
        document.createElement(
            "div"
        );


    fila.className =
        "fila-vidrio";


    // Guardamos el ID del vidrio.
    // Esto permite conservar las marcas
    // cuando se edita un pedido.

    fila.dataset.vidrioId =
        datos.id
            ? String(datos.id)
            : "";


    fila.dataset.marcadosEntalle =
        JSON.stringify(
            Array.isArray(
                datos.marcadosEntalle
            )
                ? datos.marcadosEntalle
                : []
        );


    fila.dataset.marcadosLimpio =
        JSON.stringify(
            Array.isArray(
                datos.marcadosLimpio
            )
                ? datos.marcadosLimpio
                : []
        );


    fila.innerHTML = `

        <div>

            <label>
                TIPO DE VIDRIO
            </label>

            <select
                class="tipoVidrio"
                onchange="cambiarEspesores(this)"
            >

                ${crearOpcionesTipoVidrio(
                    tipoInicial
                )}

            </select>

        </div>


        <div>

            <label>
                ESPESOR (MM)
            </label>

            <select
                class="espesor"
            >

                ${crearOpcionesEspesor(
                    tipoInicial,
                    espesorInicial
                )}

            </select>

        </div>


        <div>

            <label>
                CANTIDAD TOTAL
            </label>

            <input
                type="number"
                class="cantidadVidrio"
                min="0"
                step="1"
                value="${
                    datos.cantidad
                    ?? ""
                }"
                placeholder="0"
            >

        </div>


        <div>

            <label>
                METROS (m²)
            </label>

            <input
                type="number"
                class="metrosVidrio"
                min="0"
                step="0.01"
                value="${
                    datos.metros
                    ?? ""
                }"
                placeholder="0.00"
            >

        </div>


        <div class="cantidades-proceso">

            <label class="titulo-cantidad-proceso">
                CANTIDAD POR PROCESO
            </label>


            <div class="campos-proceso-especial">

                <div>

                    <label>
                        ENTALLE
                    </label>

                    <input
                        type="number"
                        class="cantidadEntalle"
                        min="0"
                        max="30"
                        step="1"
                        value="${
                            datos.cantidadEntalle
                            ?? 0
                        }"
                    >

                </div>


                <div>

                    <label>
                        LIMPIO
                    </label>

                    <input
                        type="number"
                        class="cantidadLimpio"
                        min="0"
                        max="30"
                        step="1"
                        value="${
                            datos.cantidadLimpio
                            ?? 0
                        }"
                    >

                </div>

            </div>

        </div>


        <div>

            <label>
                ACCIÓN
            </label>

            <button
                type="button"
                class="btn-quitar"
                onclick="quitarVidrio(this)"
            >
                ✕ Quitar
            </button>

        </div>

    `;


    lista.appendChild(
        fila
    );
}


// ===============================
// QUITAR VIDRIO
// ===============================

function quitarVidrio(
    boton
) {

    const lista =
        document.getElementById(
            "listaVidrios"
        );


    if (!lista) {
        return;
    }


    const filas =
        lista.querySelectorAll(
            ".fila-vidrio"
        );


    if (filas.length <= 1) {

        alert(
            "El pedido debe tener al menos un vidrio."
        );

        return;
    }


    const fila =
        boton.closest(
            ".fila-vidrio"
        );


    if (fila) {

        fila.remove();
    }
}


// ===============================
// LEER ARRAY GUARDADO
// ===============================

function leerArrayDataset(
    valor
) {

    try {

        const datos =
            JSON.parse(
                valor || "[]"
            );


        return Array.isArray(datos)
            ? datos
            : [];

    } catch (error) {

        return [];
    }
}


// ===============================
// OBTENER VIDRIOS DEL FORMULARIO
// ===============================

function obtenerVidriosFormulario() {

    const filas =
        document.querySelectorAll(
            "#listaVidrios .fila-vidrio"
        );


    return Array.from(filas)
        .map(fila => {

            return {

                id:
                    Number(
                        fila.dataset.vidrioId
                    ) || null,


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


                cantidadEntalle:
                    Number(
                        fila.querySelector(
                            ".cantidadEntalle"
                        ).value
                    ) || 0,


                cantidadLimpio:
                    Number(
                        fila.querySelector(
                            ".cantidadLimpio"
                        ).value
                    ) || 0,


                marcadosEntalle:
                    leerArrayDataset(
                        fila.dataset
                            .marcadosEntalle
                    ),


                marcadosLimpio:
                    leerArrayDataset(
                        fila.dataset
                            .marcadosLimpio
                    )

            };

        });
}


// ===============================
// VALIDAR VIDRIOS
// ===============================

function validarVidrios(
    vidrios
) {

    if (
        !Array.isArray(vidrios)
        ||
        vidrios.length === 0
    ) {

        alert(
            "Debes agregar al menos un vidrio."
        );

        return false;
    }


    for (
        let i = 0;
        i < vidrios.length;
        i++
    ) {

        const vidrio =
            vidrios[i];


        if (
            vidrio.cantidadEntalle < 0
            ||
            vidrio.cantidadLimpio < 0
        ) {

            alert(
                `Vidrio ${i + 1}: las cantidades no pueden ser negativas.`
            );

            return false;
        }


        if (
            vidrio.cantidadEntalle > 30
            ||
            vidrio.cantidadLimpio > 30
        ) {

            alert(
                `Vidrio ${i + 1}: ENTALLE y LIMPIO permiten máximo 30 unidades.`
            );

            return false;
        }


        if (
            vidrio.cantidadEntalle
            +
            vidrio.cantidadLimpio
            >
            vidrio.cantidad
        ) {

            alert(
                `Vidrio ${i + 1}: ENTALLE + LIMPIO no puede superar la CANTIDAD TOTAL.`
            );

            return false;
        }
    }


    return true;
}
// ===============================
// GUARDAR PEDIDO
// ===============================

async function guardarPedido() {

    const op =
        document.getElementById("op")
            ?.value
            .trim()
        || "";


    const cliente =
        document.getElementById("cliente")
            ?.value
            .trim()
        || "";


    const fechaIngreso =
        document.getElementById("fechaIngreso")
            ?.value
        || "";


    const fechaEntrega =
        document.getElementById("fechaEntrega")
            ?.value
        || "";


    const horaEntrega =
        document.getElementById("horaEntrega")
            ?.value
        || "";


    const descripcion =
        document.getElementById("descripcion")
            ?.value
            .trim()
        || "";


    // ===============================
    // VALIDACIONES
    // ===============================

    if (!op) {

        alert(
            "Debes ingresar la OP."
        );

        document.getElementById("op")
            ?.focus();

        return;
    }


    if (!cliente) {

        alert(
            "Debes ingresar el cliente."
        );

        document.getElementById("cliente")
            ?.focus();

        return;
    }


    const vidrios =
        obtenerVidriosFormulario();


    if (
        !validarVidrios(
            vidrios
        )
    ) {

        return;
    }


    const pedido = {

        op,

        cliente,

        fechaIngreso,

        fechaEntrega,

        horaEntrega,

        descripcion,

        vidrios

    };


    try {

        // ===============================
        // EDITANDO
        // ===============================

        if (pedidoEditando) {

            await api(
                `/api/pedidos/${pedidoEditando}/datos`,
                {
                    method:
                        "PUT",

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

            // ===============================
            // NUEVO PEDIDO
            // ===============================

            await api(
                "/api/pedidos",
                {
                    method:
                        "POST",

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


        // ===============================
        // LIMPIAR Y RECARGAR
        // ===============================

        limpiarFormulario();


        paginaActual = 1;


        await cargarDatos();


    } catch (error) {

        console.error(
            "ERROR GUARDANDO PEDIDO:",
            error
        );


        alert(
            error.message
            ||
            "No se pudo guardar el pedido."
        );
    }
}


// ===============================
// EDITAR PEDIDO
// ===============================

async function editarPedido(
    id
) {

    try {

        const pedido =
            await api(
                `/api/pedidos/${id}`
            );


        pedidoEditando =
            Number(id);


        // ===============================
        // DATOS PRINCIPALES
        // ===============================

        const inputOp =
            document.getElementById(
                "op"
            );


        const inputCliente =
            document.getElementById(
                "cliente"
            );


        const inputFechaIngreso =
            document.getElementById(
                "fechaIngreso"
            );


        const inputFechaEntrega =
            document.getElementById(
                "fechaEntrega"
            );


        const inputHoraEntrega =
            document.getElementById(
                "horaEntrega"
            );


        const inputDescripcion =
            document.getElementById(
                "descripcion"
            );


        if (inputOp) {

            inputOp.value =
                pedido.op || "";
        }


        if (inputCliente) {

            inputCliente.value =
                pedido.cliente || "";
        }


        if (inputFechaIngreso) {

            inputFechaIngreso.value =
                pedido.fechaIngreso || "";
        }


        if (inputFechaEntrega) {

            inputFechaEntrega.value =
                pedido.fechaEntrega || "";
        }


        if (inputHoraEntrega) {

            inputHoraEntrega.value =
                pedido.horaEntrega || "";
        }


        if (inputDescripcion) {

            inputDescripcion.value =
                pedido.descripcion || "";
        }


        // ===============================
        // CARGAR VIDRIOS
        // ===============================

        const lista =
            document.getElementById(
                "listaVidrios"
            );


        if (lista) {

            lista.innerHTML = "";


            if (
                Array.isArray(
                    pedido.vidrios
                )
                &&
                pedido.vidrios.length > 0
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
        }


        // ===============================
        // CAMBIAR TEXTO DEL BOTÓN
        // ===============================

        const botonGuardar =
            document.getElementById(
                "btnGuardar"
            );


        if (botonGuardar) {

            botonGuardar.textContent =
                "💾 ACTUALIZAR PEDIDO";
        }


        // ===============================
        // MOSTRAR BOTÓN CANCELAR
        // ===============================

        const botonCancelar =
            document.getElementById(
                "btnCancelarEdicion"
            );


        if (botonCancelar) {

            botonCancelar.style.display =
                "inline-block";
        }


        // ===============================
        // IR AL FORMULARIO
        // ===============================

        const formulario =
            document.getElementById(
                "panelIngreso"
            );


        if (formulario) {

            formulario.scrollIntoView({

                behavior:
                    "smooth",

                block:
                    "start"

            });

        } else {

            window.scrollTo({

                top: 0,

                behavior:
                    "smooth"

            });
        }


    } catch (error) {

        console.error(
            "ERROR EDITANDO PEDIDO:",
            error
        );


        alert(
            error.message
            ||
            "No se pudo cargar el pedido."
        );
    }
}


// ===============================
// CANCELAR EDICIÓN
// ===============================

function cancelarEdicion() {

    limpiarFormulario();
}


// ===============================
// LIMPIAR FORMULARIO
// ===============================

function limpiarFormulario() {

    pedidoEditando = null;


    const campos = [

        "op",

        "cliente",

        "fechaIngreso",

        "fechaEntrega",

        "horaEntrega",

        "descripcion"

    ];


    campos.forEach(
        id => {

            const elemento =
                document.getElementById(
                    id
                );


            if (elemento) {

                elemento.value = "";
            }
        }
    );


    // ===============================
    // LIMPIAR VIDRIOS
    // ===============================

    const lista =
        document.getElementById(
            "listaVidrios"
        );


    if (lista) {

        lista.innerHTML = "";

        agregarVidrio();
    }


    // ===============================
    // RESTAURAR BOTÓN GUARDAR
    // ===============================

    const botonGuardar =
        document.getElementById(
            "btnGuardar"
        );


    if (botonGuardar) {

        botonGuardar.textContent =
            "💾 GUARDAR PEDIDO";
    }


    // ===============================
    // OCULTAR CANCELAR
    // ===============================

    const botonCancelar =
        document.getElementById(
            "btnCancelarEdicion"
        );


    if (botonCancelar) {

        botonCancelar.style.display =
            "none";
    }
}


// ===============================
// ELIMINAR PEDIDO
// ===============================

async function eliminarPedido(
    id
) {

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


        // Si estamos editando
        // justamente ese pedido.

        if (
            Number(pedidoEditando)
            ===
            Number(id)
        ) {

            limpiarFormulario();
        }


        await cargarDatos();


    } catch (error) {

        console.error(
            "ERROR ELIMINANDO PEDIDO:",
            error
        );


        alert(
            error.message
            ||
            "No se pudo eliminar el pedido."
        );
    }
}


// ===============================
// CAMBIAR PROCESO GENERAL
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
                method:
                    "PUT",

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
            "ERROR CAMBIANDO PROCESO:",
            error
        );


        alert(
            error.message
            ||
            "No se pudo cambiar el proceso."
        );
    }
}


// ===============================
// CREAR BOTÓN PROCESO GENERAL
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

            class="
                proceso
                ${
                    activo
                        ? "terminado"
                        : ""
                }
            "

            onclick="
                cambiarProceso(
                    ${pedido.id},
                    '${campo}',
                    ${!activo}
                )
            "

        >

            ${
                activo
                    ? "✓ "
                    : ""
            }

            ${texto}

        </div>

    `;
}
// ===============================
// NORMALIZAR NÚMEROS MARCADOS
// ===============================

function normalizarMarcados(
    valores,
    cantidad
) {

    if (!Array.isArray(valores)) {
        return [];
    }


    const maximo =
        Math.min(
            30,
            Math.max(
                0,
                Number(cantidad) || 0
            )
        );


    return [
        ...new Set(
            valores
                .map(Number)
                .filter(
                    numero =>
                        Number.isInteger(numero)
                        &&
                        numero >= 1
                        &&
                        numero <= maximo
                )
        )
    ].sort(
        (a, b) => a - b
    );
}


// ===============================
// CREAR NÚMEROS POR PROCESO
// ===============================

function crearMarcadoresVidrio(
    vidrio,
    proceso,
    texto
) {

    const esEntalle =
        proceso === "entalle";


    const cantidad =
        Math.min(
            30,
            Math.max(
                0,
                Number(
                    esEntalle
                        ? vidrio.cantidadEntalle
                        : vidrio.cantidadLimpio
                ) || 0
            )
        );


    // Si este vidrio no tiene
    // unidades en ese proceso,
    // no mostramos nada.

    if (cantidad <= 0) {
        return "";
    }


    const marcados =
        normalizarMarcados(

            esEntalle
                ? vidrio.marcadosEntalle
                : vidrio.marcadosLimpio,

            cantidad

        );


    const botones =
        Array.from(
            {
                length:
                    cantidad
            },

            (_, indice) => {

                const numero =
                    indice + 1;


                const activo =
                    marcados.includes(
                        numero
                    );


                return `

                    <button

                        type="button"

                        class="
                            unidad-proceso
                            ${
                                activo
                                    ? "marcada"
                                    : ""
                            }
                        "

                        onclick="
                            cambiarMarcaVidrio(
                                ${vidrio.id},
                                '${proceso}',
                                ${numero},
                                ${!activo}
                            )
                        "

                        title="
                            ${texto}
                            - unidad ${numero}
                        "

                    >

                        ${
                            activo
                                ? "✓ "
                                : ""
                        }

                        ${numero}

                    </button>

                `;

            }
        )
        .join("");


    return `

        <div class="proceso-vidrio-detalle">

            <div class="proceso-vidrio-titulo">

                <strong>
                    ${texto} (${cantidad})
                </strong>


                <span>

                    ${marcados.length}
                    /
                    ${cantidad}
                    realizados

                </span>

            </div>


            <div class="unidades-proceso">

                ${botones}

            </div>

        </div>

    `;
}


// ===============================
// RESUMEN DE VIDRIOS
// ===============================

function crearResumenVidrios(
    vidrios = []
) {

    if (
        !Array.isArray(vidrios)
        ||
        vidrios.length === 0
    ) {

        return `

            <div class="vidrio-resumen">

                Sin información de vidrio

            </div>

        `;
    }


    return vidrios
        .map(vidrio => {

            const cantidadEntalle =
                Number(
                    vidrio.cantidadEntalle
                ) || 0;


            const cantidadLimpio =
                Number(
                    vidrio.cantidadLimpio
                ) || 0;


            // ===============================
            // PEDIDOS ANTIGUOS
            // ===============================
            // Si es un pedido antiguo que
            // todavía tiene procesoEspecial,
            // lo mostramos para no perder
            // esa información.

            let procesoAntiguo = "";


            if (
                cantidadEntalle === 0
                &&
                cantidadLimpio === 0
                &&
                vidrio.procesoEspecial
                &&
                vidrio.procesoEspecial
                    !== "NINGUNO"
            ) {

                procesoAntiguo = `

                    <span class="etiqueta-especial">

                        ${vidrio.procesoEspecial}

                    </span>

                `;
            }


            const entalle =
                crearMarcadoresVidrio(
                    vidrio,
                    "entalle",
                    "ENTALLE"
                );


            const limpio =
                crearMarcadoresVidrio(
                    vidrio,
                    "limpio",
                    "LIMPIO"
                );


            return `

                <div class="vidrio-bloque">


                    <div class="vidrio-resumen">

                        <strong>

                            ${
                                vidrio.tipoVidrio
                                ||
                                "INCOLORO"
                            }

                            ${
                                vidrio.espesor
                                ||
                                "-"
                            } mm

                        </strong>


                        <span>

                            -

                            ${
                                Number(
                                    vidrio.cantidad
                                ) || 0
                            }

                            und

                        </span>


                        <span>

                            -

                            ${
                                (
                                    Number(
                                        vidrio.metros
                                    ) || 0
                                ).toFixed(2)
                            }

                            m²

                        </span>


                        ${procesoAntiguo}

                    </div>


                    ${entalle}


                    ${limpio}


                </div>

            `;

        })
        .join("");
}


// ===============================
// MARCAR / DESMARCAR NÚMERO
// ===============================

async function cambiarMarcaVidrio(
    idVidrio,
    proceso,
    numero,
    marcado
) {

    if (!idVidrio) {

        alert(
            "No se encontró el vidrio."
        );

        return;
    }


    try {

        await api(
            `/api/vidrios/${idVidrio}/marcado`,
            {
                method:
                    "PUT",

                body:
                    JSON.stringify({

                        proceso,

                        numero,

                        marcado

                    })
            }
        );


        // Volvemos a cargar para que
        // el número quede actualizado.

        await cargarDatos();


    } catch (error) {

        console.error(
            "ERROR MARCANDO VIDRIO:",
            error
        );


        alert(
            error.message
            ||
            "No se pudo marcar la unidad."
        );
    }
}


// ===============================
// FORMATEAR FECHA REGISTRO
// ===============================

function formatearFechaRegistro(
    fecha
) {

    if (!fecha) {
        return "";
    }


    const fechaObjeto =
        new Date(fecha);


    if (
        Number.isNaN(
            fechaObjeto.getTime()
        )
    ) {

        return fecha;
    }


    return fechaObjeto
        .toLocaleString(
            "es-PE"
        );
}


// ===============================
// MOSTRAR PRODUCCIÓN
// ===============================

function mostrarProduccion(lista = pedidos) {

    const contenedor = document.getElementById("listaPedidos");

    if (!contenedor) {
        return;
    }

    if (!Array.isArray(lista) || lista.length === 0) {

        contenedor.innerHTML = `
            <div class="sin-resultados">
                No hay pedidos para mostrar.
            </div>
        `;

        return;
    }

    contenedor.innerHTML = lista.map(pedido => {

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


                ${
                    pedido.creadoEn
                    ? `
                        <div class="registro-automatico">
                            🕒 Registrado:
                            ${formatearFechaRegistro(pedido.creadoEn)}
                        </div>
                    `
                    : ""
                }


                ${
                    pedido.descripcion
                    ? `
                        <div class="descripcion-card">
                            <strong>DESCRIPCIÓN:</strong>
                            ${pedido.descripcion}
                        </div>
                    `
                    : ""
                }


                ${crearResumenVidrios(pedido.vidrios)}


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
                        "HORNO"
                    )}

                    ${crearProceso(
                        pedido,
                        "templado",
                        "TEMPLADO"
                    )}

                    ${crearProceso(
                        pedido,
                        "terminado",
                        "ENCAJONADO"
                    )}

                    ${crearProceso(
                        pedido,
                        "despacho",
                        "ENTREGADO"
                    )}

                </div>


                <div class="detalle-op">

                    <strong>FECHA DE INGRESO:</strong>
                    ${pedido.fechaIngreso || "SIN FECHA"}

                    <br>

                    <strong>FECHA DE ENTREGA:</strong>
                    ${pedido.fechaEntrega || "SIN FECHA"}

                </div>


               <div class="acciones-pedido">

    <button
        type="button"
        class="btn-editar"
        onclick="editarPedido(${pedido.id})"
    >
        EDITAR
    </button>

    <button
        type="button"
        class="btn-editar"
        onclick="window.location.href='cotizacion.html?pedido=${pedido.id}'"
    >
        COTIZACIÓN
    </button>

    <button
        type="button"
        class="btn-eliminar"
        onclick="eliminarPedido(${pedido.id})"
    >
        ELIMINAR
    </button>

</div>
        `;

    }).join("");
}
// ===============================
// CARGAR DATOS
// ===============================

async function cargarDatos() {

    try {

        const parametros =
            new URLSearchParams();


        parametros.set(
            "page",
            paginaActual
        );


        parametros.set(
            "limit",
            limitePorPagina
        );


        if (busquedaActual) {

            parametros.set(
                "buscar",
                busquedaActual
            );
        }


        const data =
            await api(
                `/api/pedidos-paginados?${parametros.toString()}`
            );


        pedidos =
            Array.isArray(data.pedidos)
                ? data.pedidos
                : [];


        paginaActual =
            Number(data.pagina)
            || 1;


        totalPaginas =
            Number(data.totalPaginas)
            || 1;


        mostrarProduccion(
            pedidos
        );


        actualizarPaginacion(
            data
        );


        await actualizarResumen();


    } catch (error) {

        console.error(
            "ERROR CARGANDO PEDIDOS:",
            error
        );


        const contenedor =
            document.getElementById(
                "listaPedidos"
            );


        if (contenedor) {

            contenedor.innerHTML = `

                <div class="sin-resultados">

                    No se pudieron cargar
                    los pedidos.

                </div>

            `;
        }
    }
}

// ===============================
// ACTUALIZAR RESUMEN
// ===============================

async function actualizarResumen() {

    try {

        const resumen = await api("/api/resumen");

        const total = document.getElementById("total");
        const pendientes = document.getElementById("pendientes");
        const proceso = document.getElementById("proceso");
        const terminados = document.getElementById("terminados");

        if (total) {
            total.textContent = resumen.total ?? 0;
        }

        if (pendientes) {
            pendientes.textContent = resumen.pendientes ?? 0;
        }

        if (proceso) {
            proceso.textContent = resumen.proceso ?? 0;
        }

        if (terminados) {
            terminados.textContent = resumen.terminados ?? 0;
        }

    } catch (error) {

        console.error(
            "ERROR CARGANDO RESUMEN:",
            error
        );
    }
}


// ===============================
// BUSCAR PEDIDOS
// ===============================

function buscarPedidos() {

    const input =
        document.getElementById(
            "buscarPedido"
        );


    busquedaActual =
        input
            ?.value
            .trim()
        || "";


    paginaActual = 1;


    cargarDatos();
}


// ===============================
// LIMPIAR BÚSQUEDA
// ===============================

function limpiarBusqueda() {

    const input =
        document.getElementById(
            "buscarPedido"
        );


    if (input) {

        input.value = "";
    }


    busquedaActual = "";

    paginaActual = 1;


    cargarDatos();
}


// ===============================
// BUSCAR AL PRESIONAR ENTER
// ===============================

function prepararBuscador() {

    const input =
        document.getElementById(
            "buscarPedido"
        );


    if (!input) {
        return;
    }


    input.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Enter"
            ) {

                event.preventDefault();

                buscarPedidos();
            }
        }
    );
}


// ===============================
// PAGINACIÓN
// ===============================

function actualizarPaginacion(
    data
) {

    const contenedor =
        document.getElementById(
            "paginacion"
        );


    if (!contenedor) {
        return;
    }


    const total =
        Number(data.total)
        || 0;


    if (
        total === 0
        ||
        totalPaginas <= 1
    ) {

        contenedor.innerHTML = "";

        return;
    }


    contenedor.innerHTML = `

        <button
            type="button"
            class="btn-pagina"
            onclick="paginaAnterior()"
            ${
                paginaActual <= 1
                    ? "disabled"
                    : ""
            }
        >

            ← ANTERIOR

        </button>


        <span class="info-pagina">

            Página

            <strong>
                ${paginaActual}
            </strong>

            de

            <strong>
                ${totalPaginas}
            </strong>

        </span>


        <button
            type="button"
            class="btn-pagina"
            onclick="paginaSiguiente()"
            ${
                paginaActual
                >= totalPaginas
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

function paginaAnterior() {

    if (
        paginaActual <= 1
    ) {

        return;
    }


    paginaActual--;


    cargarDatos();


    subirAProduccion();
}


// ===============================
// PÁGINA SIGUIENTE
// ===============================

function paginaSiguiente() {

    if (
        paginaActual
        >= totalPaginas
    ) {

        return;
    }


    paginaActual++;


    cargarDatos();


    subirAProduccion();
}


// ===============================
// SUBIR A PRODUCCIÓN
// ===============================

function subirAProduccion() {

    const contenedor =
        document.getElementById(
            "listaPedidos"
        );


    if (!contenedor) {
        return;
    }


    setTimeout(
        () => {

            contenedor.scrollIntoView({

                behavior:
                    "smooth",

                block:
                    "start"

            });

        },
        100
    );
}


// ===============================
// FILTRAR POR PROCESO
// ===============================

function filtrarProceso(
    proceso
) {

    if (!proceso) {

        mostrarProduccion(
            pedidos
        );

        return;
    }


    const procesoNormalizado =
        String(proceso)
            .toLowerCase();


    const filtrados =
        pedidos.filter(
            pedido => {

                if (
                    procesoNormalizado
                    === "pendiente"
                ) {

                    return (
                        !pedido.corte
                        &&
                        !pedido.entalle
                        &&
                        !pedido.limpios
                        &&
                        !pedido.templado
                        &&
                        !pedido.terminado
                    );
                }


                if (
                    procesoNormalizado
                    === "proceso"
                    ||
                    procesoNormalizado
                    === "enproceso"
                ) {

                    return (

                        (
                            pedido.corte
                            ||
                            pedido.entalle
                            ||
                            pedido.limpios
                            ||
                            pedido.templado
                        )

                        &&

                        !pedido.terminado

                    );
                }


                if (
                    procesoNormalizado
                    === "corte"
                ) {

                    return Boolean(
                        pedido.corte
                    );
                }


                if (
                    procesoNormalizado
                    === "entalle"
                ) {

                    return Boolean(
                        pedido.entalle
                    );
                }


                if (
                    procesoNormalizado
                    === "horno"
                    ||
                    procesoNormalizado
                    === "limpios"
                ) {

                    return Boolean(
                        pedido.limpios
                    );
                }


                if (
                    procesoNormalizado
                    === "templado"
                ) {

                    return Boolean(
                        pedido.templado
                    );
                }


                if (
                    procesoNormalizado
                    === "terminado"
                    ||
                    procesoNormalizado
                    === "encajonado"
                ) {

                    return Boolean(
                        pedido.terminado
                    );
                }


                if (
                    procesoNormalizado
                    === "despacho"
                    ||
                    procesoNormalizado
                    === "entregado"
                ) {

                    return Boolean(
                        pedido.despacho
                    );
                }


                return true;
            }
        );


    mostrarProduccion(
        filtrados
    );
}


// ===============================
// INICIAR PÁGINA
// ===============================

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        prepararBuscador();


        const listaVidrios =
            document.getElementById(
                "listaVidrios"
            );


        // Crear el primer vidrio
        // solamente si todavía no existe.

        if (
            listaVidrios
            &&
            listaVidrios.children.length
            === 0
        ) {

            agregarVidrio();
        }


        await cargarDatos();

    }
);
