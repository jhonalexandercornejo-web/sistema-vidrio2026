let contadorFilasCotizacion = 0;


// ===============================
// INICIAR
// ===============================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        generarNumeroCotizacion();

        colocarFechaHoy();

        agregarFilaCotizacion();
    }
);


// ===============================
// NÚMERO DE COTIZACIÓN
// ===============================




// ===============================
// AGREGAR VIDRIO
// ===============================

function agregarFilaCotizacion() {

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

                <option value="4">4 mm</option>
                <option value="5">5 mm</option>
                <option value="6">6 mm</option>
                <option value="8" selected>8 mm</option>
                <option value="10">10 mm</option>
                <option value="12">12 mm</option>
                <option value="15">15 mm</option>
                <option value="19">19 mm</option>

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
                type="text"
                class="cot-metros"
                value="0.00"
                readonly
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


            const precio =
                Number(
                    fila.querySelector(
                        ".cot-precio"
                    ).value
                ) || 0;


            const metros =
                ancho *
                alto *
                cantidad;


            const subtotal =
                metros *
                precio;


            fila.querySelector(
                ".cot-metros"
            ).value =
                metros.toFixed(2);


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
