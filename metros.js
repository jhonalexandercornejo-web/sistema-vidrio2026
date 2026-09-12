let pedidosMetros = [];


// ===============================
// API
// ===============================

async function apiMetros(url) {

    const respuesta =
        await fetch(url);


    const datos =
        await respuesta.json();


    if (!respuesta.ok) {

        throw new Error(
            datos.error ||
            "Error cargando información"
        );
    }


    return datos;
}


// ===============================
// CARGAR PEDIDOS
// ===============================

async function cargarMetros() {

    try {

        pedidosMetros =
            await apiMetros(
                "/api/pedidos"
            );


        mostrarMetros();


    } catch (error) {

        console.error(error);


        alert(
            "No se pudieron cargar los pedidos."
        );
    }
}


// ===============================
// TOTAL METROS DE UNA OP
// ===============================

function metrosPedido(pedido) {

    if (
        !Array.isArray(pedido.vidrios)
    ) {

        return 0;
    }


    return pedido.vidrios.reduce(
        (total, vidrio) => {

            return total +
                (
                    Number(vidrio.metros)
                    || 0
                );

        },
        0
    );
}


// ===============================
// AGRUPAR POR FECHA
// ===============================

function obtenerFechasAgrupadas() {

    const grupos = {};


    pedidosMetros.forEach(
        pedido => {

            const fecha =
                pedido.fechaEntrega;


            if (!fecha) {
                return;
            }


            if (!grupos[fecha]) {

                grupos[fecha] = {
                    fecha: fecha,
                    pedidos: [],
                    metros: 0
                };
            }


            grupos[fecha]
                .pedidos
                .push(pedido);


            grupos[fecha].metros +=
                metrosPedido(pedido);
        }
    );


    return Object.values(grupos)
        .sort(
            (a, b) =>
                a.fecha.localeCompare(
                    b.fecha
                )
        );
}


// ===============================
// FORMATEAR FECHA
// ===============================

function formatearFecha(fecha) {

    if (!fecha) {
        return "-";
    }


    const partes =
        fecha.split("-");


    if (partes.length !== 3) {

        return fecha;
    }


    return (
        partes[2] +
        "/" +
        partes[1] +
        "/" +
        partes[0]
    );
}


// ===============================
// MOSTRAR TABLA
// ===============================

function mostrarMetros() {

    const tabla =
        document.getElementById(
            "tablaMetros"
        );


    const buscarFecha =
        document.getElementById(
            "buscarFecha"
        ).value;


    let grupos =
        obtenerFechasAgrupadas();


    if (buscarFecha) {

        grupos =
            grupos.filter(
                grupo =>
                    grupo.fecha ===
                    buscarFecha
            );
    }


    if (
        grupos.length === 0
    ) {

        tabla.innerHTML = `

            <tr>

                <td
                    colspan="4"
                    class="sin-datos"
                >

                    No hay pedidos para esta fecha.

                </td>

            </tr>

        `;


        actualizarResumenMetros(
            []
        );


        return;
    }


    tabla.innerHTML =
        grupos.map(
            grupo => {

                return `

                    <tr>

                        <td>

                            <strong>
                                ${formatearFecha(
                                    grupo.fecha
                                )}
                            </strong>

                        </td>


                        <td>

                            ${grupo.pedidos.length}

                        </td>


                        <td class="metros-destacado">

                            ${grupo.metros.toFixed(2)}
                            m²

                        </td>


                        <td>

                            <button
                                class="btn-ver-op"
                                onclick="verPedidosFecha(
                                    '${grupo.fecha}'
                                )"
                            >

                                VER OP

                            </button>

                        </td>

                    </tr>

                `;

            }
        ).join("");


    actualizarResumenMetros(
        grupos
    );
}


// ===============================
// RESUMEN GENERAL
// ===============================

function actualizarResumenMetros(
    grupos
) {

    const todos =
        obtenerFechasAgrupadas();


    const totalOP =
        todos.reduce(
            (total, grupo) =>
                total +
                grupo.pedidos.length,
            0
        );


    const totalMetros =
        todos.reduce(
            (total, grupo) =>
                total +
                grupo.metros,
            0
        );


    document.getElementById(
        "totalFechas"
    ).textContent =
        todos.length;


    document.getElementById(
        "totalOPMetros"
    ).textContent =
        totalOP;


    document.getElementById(
        "totalMetrosGeneral"
    ).textContent =
        totalMetros.toFixed(2) +
        " m²";


    const hoy =
        new Date()
            .toISOString()
            .slice(0, 10);


    const proxima =
        todos.find(
            grupo =>
                grupo.fecha >= hoy
        );


    document.getElementById(
        "proximaEntrega"
    ).textContent =
        proxima
            ? formatearFecha(
                proxima.fecha
              )
            : "-";
}


// ===============================
// VER PEDIDOS DE UNA FECHA
// ===============================

function verPedidosFecha(fecha) {

    const pedidos =
        pedidosMetros.filter(
            pedido =>
                pedido.fechaEntrega ===
                fecha
        );


    const panel =
        document.getElementById(
            "detalleFecha"
        );


    const titulo =
        document.getElementById(
            "tituloDetalle"
        );


    const lista =
        document.getElementById(
            "listaDetalleFecha"
        );


    titulo.textContent =
        "PEDIDOS PARA " +
        formatearFecha(fecha);


    lista.innerHTML =
        pedidos.map(
            pedido => {

                const metros =
                    metrosPedido(
                        pedido
                    );


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

                                🕐 Hora de entrega:
                                ${
                                    pedido.horaEntrega
                                    ||
                                    "SIN HORA"
                                }

                            </span>


                            <span>

                                📅 Fecha de entrega:
                                ${
                                    formatearFecha(
                                        pedido.fechaEntrega
                                    )
                                }

                            </span>

                        </div>


                        <div
                            class="detalle-metros-op"
                        >

                            Total OP:

                            <strong>

                                ${metros.toFixed(2)}
                                m²

                            </strong>

                        </div>


                        <div
                            class="resumen-vidrios"
                        >

                            ${
                                crearVidriosDetalle(
                                    pedido.vidrios
                                )
                            }

                        </div>

                    </div>

                `;

            }
        ).join("");


    panel.style.display =
        "block";


    panel.scrollIntoView({

        behavior:
            "smooth",

        block:
            "start"

    });
}


// ===============================
// VIDRIOS DE LA OP
// ===============================

function crearVidriosDetalle(
    vidrios = []
) {

    if (
        !Array.isArray(vidrios)
        ||
        vidrios.length === 0
    ) {

        return `
            <p>
                Sin datos de vidrio.
            </p>
        `;
    }


    return vidrios.map(
        vidrio => {

            return `

                <div class="vidrio-resumen">

                    <strong>

                        ${
                            vidrio.tipoVidrio
                            ||
                            "VIDRIO"
                        }

                        ${
                            vidrio.espesor
                            ||
                            "-"
                        }
                        mm

                    </strong>


                    <span>

                        ${
                            Number(
                                vidrio.cantidad
                            )
                            || 0
                        }
                        und

                    </span>


                    <span>

                        ${
                            Number(
                                vidrio.metros
                            )
                            || 0
                        }
                        m²

                    </span>


                    ${
                        vidrio.procesoEspecial
                        &&
                        vidrio.procesoEspecial
                        !== "NINGUNO"

                        ? `

                            <span
                                class="etiqueta-especial"
                            >

                                ${
                                    vidrio.procesoEspecial
                                }

                            </span>

                        `

                        : ""
                    }

                </div>

            `;

        }
    ).join("");
}


// ===============================
// LIMPIAR FECHA
// ===============================

function limpiarFecha() {

    document.getElementById(
        "buscarFecha"
    ).value = "";


    document.getElementById(
        "detalleFecha"
    ).style.display =
        "none";


    mostrarMetros();
}


// ===============================
// INICIAR
// ===============================

cargarMetros();
