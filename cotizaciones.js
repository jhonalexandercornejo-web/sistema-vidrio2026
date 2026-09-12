let contadorFilasCotizacion = 0;


// ===============================
// INICIAR
// ===============================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        colocarFechaHoy();

        cargarPedidoParaCotizar();
    }
);


// ===============================
// FECHA ACTUAL
// ===============================

function colocarFechaHoy() {

    const fecha = new Date();

    const anio =
        fecha.getFullYear();

    const mes =
        String(
            fecha.getMonth() + 1
        ).padStart(2, "0");

    const dia =
        String(
            fecha.getDate()
        ).padStart(2, "0");

    document.getElementById(
        "fechaCotizacion"
    ).value =
        `${anio}-${mes}-${dia}`;
}


// ===============================
// CARGAR PEDIDO DESDE CONTROL
// ===============================

function cargarPedidoParaCotizar() {

    const guardado =
        localStorage.getItem(
            "pedidoParaCotizar"
        );


    if (!guardado) {

        agregarFilaCotizacion();

        return;
    }


    try {

        const pedido =
            JSON.parse(guardado);


        // CLIENTE
        document.getElementById(
            "clienteCotizacion"
        ).value =
            pedido.cliente || "";


        // NÚMERO DE COTIZACIÓN / OP
        const numero =
            document.getElementById(
                "numeroCotizacion"
            );


        if (
            numero &&
            pedido.op
        ) {

            numero.value =
                pedido.op;
        }


        // OBSERVACIONES
        const observaciones =
            document.getElementById(
                "observacionesCotizacion"
            );


        if (observaciones) {

            let texto = "";


            if (pedido.descripcion) {

                texto +=
                    pedido.descripcion;
            }


            if (pedido.fechaEntrega) {

                if (texto) {
                    texto += "\n";
                }


                texto +=
                    "Fecha de entrega: " +
                    pedido.fechaEntrega;
            }


            observaciones.value =
                texto;
        }


        // LIMPIAR FILAS
        document.getElementById(
            "listaCotizacion"
        ).innerHTML = "";


        // CARGAR VIDRIOS
        if (
            Array.isArray(
                pedido.vidrios
            ) &&
            pedido.vidrios.length > 0
        ) {

            pedido.vidrios.forEach(
                vidrio => {

                    agregarFilaCotizacion(
                        vidrio
                    );
                }
            );

        } else {

            agregarFilaCotizacion();
        }


        calcularCotizacion();


        // BORRAR DATO TEMPORAL
        localStorage.removeItem(
            "pedidoParaCotizar"
        );


    } catch (error) {

        console.error(error);

        agregarFilaCotizacion();
    }
}


// ===============================
// AGREGAR VIDRIO
// ===============================

function agregarFilaCotizacion(
    datos = {}
) {

    contadorFilasCotizacion++;


    const contenedor =
        document.getElementById(
            "listaCotizacion"
        );


    const fila =
        document.createElement(
            "div"
        );


    fila.className =
        "fila-cotizacion";


    fila.dataset.id =
        contadorFilasCotizacion;


    fila.innerHTML = `

        <div>

            <label>
                TIPO DE VIDRIO
            </label>

            <select class="cot-tipo">

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
                ESPESOR
            </label>

            <select class="cot-espesor">

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
                ANCHO (m)
            </label>

            <input
                type="number"
                class="cot-ancho"
                min="0"
                step="0.01"
                placeholder="1.20"
                oninput="calcularCotizacion()"
            >

        </div>


        <div>

            <label>
                ALTO (m)
            </label>

            <input
                type="number"
                class="cot-alto"
                min="0"
                step="0.01"
                placeholder="2.00"
                oninput="calcularCotizacion()"
            >

        </div>


        <div>

            <label>
                CANTIDAD
            </label>

            <input
                type="number"
                class="cot-cantidad"
                min="1"
                step="1"
                value="1"
                oninput="calcularCotizacion()"
            >

        </div>


        <div>

            <label>
                M²
            </label>

            <input
                type="number"
                class="cot-metros"
                min="0"
                step="0.01"
                value="0"
                oninput="calcularCotizacion()"
            >

        </div>


        <div>

            <label>
                PRECIO M²
            </label>

            <input
                type="number"
                class="cot-precio"
                min="0"
                step="0.01"
                placeholder="S/ 0.00"
                oninput="calcularCotizacion()"
            >

        </div>


        <div>

            <label>
                SUBTOTAL
            </label>

            <input
                type="text"
                class="cot-subtotal"
                value="S/ 0.00"
                readonly
            >

        </div>


        <div class="contenedor-quitar">

            <button
                type="button"
                class="btn-quitar-cotizacion"
                onclick="quitarFilaCotizacion(this)"
            >
                QUITAR
            </button>

        </div>

    `;


    contenedor.appendChild(
        fila
    );


    fila.querySelector(
        ".cot-tipo"
    ).value =
        datos.tipoVidrio ||
        "INCOLORO";


    fila.querySelector(
        ".cot-espesor"
    ).value =
        String(
            datos.espesor ||
            "8"
        );


    fila.querySelector(
        ".cot-cantidad"
    ).value =
        datos.cantidad ?? 1;


    fila.querySelector(
        ".cot-metros"
    ).value =
        datos.metros ?? 0;


    calcularCotizacion();
}


// ===============================
// QUITAR VIDRIO
// ===============================

function quitarFilaCotizacion(
    boton
) {

    const filas =
        document.querySelectorAll(
            ".fila-cotizacion"
        );


    if (filas.length <= 1) {

        alert(
            "Debe quedar al menos un vidrio."
        );

        return;
    }


    boton
        .closest(
            ".fila-cotizacion"
        )
        .remove();


    calcularCotizacion();
}


// ===============================
// CALCULAR
// ===============================

function calcularCotizacion() {

    const filas =
        document.querySelectorAll(
            ".fila-cotizacion"
        );


    let totalMetros = 0;

    let subtotalGeneral = 0;


    filas.forEach(
        fila => {

            const ancho =
                Number(
                    fila.querySelector(
                        ".cot-ancho"
                    ).value
                ) || 0;


            const alto =
                Number(
                    fila.querySelector(
                        ".cot-alto"
                    ).value
                ) || 0;


            const cantidad =
                Number(
                    fila.querySelector(
                        ".cot-cantidad"
                    ).value
                ) || 0;


            const metrosInput =
                fila.querySelector(
                    ".cot-metros"
                );


            const precio =
                Number(
                    fila.querySelector(
                        ".cot-precio"
                    ).value
                ) || 0;


            let metros =
                Number(
                    metrosInput.value
                ) || 0;


            // SI ESCRIBES ANCHO Y ALTO,
            // RECALCULA LOS M²
            if (
                ancho > 0 &&
                alto > 0
            ) {

                metros =
                    ancho *
                    alto *
                    cantidad;


                metrosInput.value =
                    metros.toFixed(2);
            }


            const subtotal =
                metros *
                precio;


            fila.querySelector(
                ".cot-subtotal"
            ).value =
                "S/ " +
                subtotal.toFixed(2);


            totalMetros +=
                metros;


            subtotalGeneral +=
                subtotal;
        }
    );


    const aplicarIgv =
        document.getElementById(
            "aplicarIgv"
        ).checked;


    const igv =
        aplicarIgv
            ? subtotalGeneral * 0.18
            : 0;


    const total =
        subtotalGeneral +
        igv;


    document.getElementById(
        "totalMetrosCotizacion"
    ).textContent =
        totalMetros.toFixed(2) +
        " m²";


    document.getElementById(
        "subtotalCotizacion"
    ).textContent =
        "S/ " +
        subtotalGeneral.toFixed(2);


    document.getElementById(
        "igvCotizacion"
    ).textContent =
        "S/ " +
        igv.toFixed(2);


    document.getElementById(
        "totalCotizacion"
    ).textContent =
        "S/ " +
        total.toFixed(2);
}


// ===============================
// IMPRIMIR
// ===============================

function imprimirCotizacion() {

    const cliente =
        document.getElementById(
            "clienteCotizacion"
        ).value.trim();


    if (!cliente) {

        alert(
            "Ingresa el nombre del cliente."
        );

        return;
    }


    const numero =
        document.getElementById(
            "numeroCotizacion"
        ).value.trim();


    if (!numero) {

        alert(
            "Ingresa el N° de cotización."
        );

        return;
    }


    calcularCotizacion();


    window.print();
}


// ===============================
// NUEVA COTIZACIÓN
// ===============================

function nuevaCotizacion() {

    const confirmar =
        confirm(
            "¿Deseas iniciar una nueva cotización?"
        );


    if (!confirmar) {
        return;
    }


    document.getElementById(
        "numeroCotizacion"
    ).value = "";


    document.getElementById(
        "clienteCotizacion"
    ).value = "";


    document.getElementById(
        "observacionesCotizacion"
    ).value = "";


    document.getElementById(
        "aplicarIgv"
    ).checked = false;


    document.getElementById(
        "listaCotizacion"
    ).innerHTML = "";


    colocarFechaHoy();


    agregarFilaCotizacion();
}
