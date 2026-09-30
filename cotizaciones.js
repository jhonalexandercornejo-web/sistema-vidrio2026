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

    const anio = fecha.getFullYear();

    const mes = String(
        fecha.getMonth() + 1
    ).padStart(2, "0");

    const dia = String(
        fecha.getDate()
    ).padStart(2, "0");

    document.getElementById(
        "fechaCotizacion"
    ).value = `${anio}-${mes}-${dia}`;
}


// ===============================
// MONEDA
// ===============================

function obtenerMoneda() {

    const selector =
        document.getElementById(
            "monedaCotizacion"
        );

    const moneda =
        selector
            ? selector.value
            : "PEN";

    if (moneda === "USD") {

        return {
            codigo: "USD",
            simbolo: "US$",
            nombre: "DÓLARES"
        };
    }

    return {
        codigo: "PEN",
        simbolo: "S/",
        nombre: "SOLES"
    };
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
        calcularCotizacion();

        return;
    }

    try {

        const pedido =
            JSON.parse(guardado);


        document.getElementById(
            "clienteCotizacion"
        ).value =
            pedido.cliente || "";


        const op =
            document.getElementById(
                "opCotizacion"
            );

        if (op) {

            op.value =
                pedido.op || "";
        }


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


        document.getElementById(
            "listaCotizacion"
        ).innerHTML = "";


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


    if (!contenedor) {

        return;
    }


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

                <option value="3">3 mm</option>

                <option value="4">4 mm</option>

                <option value="5">5 mm</option>

                <option value="5.5">5.5 mm</option>

                <option value="6">6 mm</option>

                <option value="8">8 mm</option>

                <option value="10">10 mm</option>

                <option value="12">12 mm</option>

                <option value="15">15 mm</option>

                <option value="19">19 mm</option>

            </select>

        </div>


        <div>

            <label>
                ANCHO (mm)
            </label>

            <input
                type="number"
                class="cot-ancho"
                min="0"
                step="1"
                placeholder="Ej: 150"
                oninput="calcularCotizacion()"
            >

        </div>


        <div>

            <label>
                ALTO (mm)
            </label>

            <input
                type="number"
                class="cot-alto"
                min="0"
                step="1"
                placeholder="Ej: 20"
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
                step="0.001"
                value="0"
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
                placeholder="0.00"
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


    const tipo =
        fila.querySelector(
            ".cot-tipo"
        );


    const tipoGuardado =
        datos.tipoVidrio ||
        "INCOLORO";


    const existeTipo =
        Array.from(
            tipo.options
        ).some(
            opcion =>
                opcion.value ===
                tipoGuardado
        );


    tipo.value =
        existeTipo
            ? tipoGuardado
            : "OTRO";


    const espesor =
        fila.querySelector(
            ".cot-espesor"
        );


    const espesorGuardado =
        String(
            datos.espesor || "8"
        );


    const existeEspesor =
        Array.from(
            espesor.options
        ).some(
            opcion =>
                opcion.value ===
                espesorGuardado
        );


    if (existeEspesor) {

        espesor.value =
            espesorGuardado;
    }


    fila.querySelector(
        ".cot-cantidad"
    ).value =
        datos.cantidad ?? 1;


    fila.querySelector(
        ".cot-metros"
    ).value = "0";


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


    const moneda =
        obtenerMoneda();


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


            let metros = 0;


            if (
                ancho > 0 &&
                alto > 0 &&
                cantidad > 0
            ) {

                metros =
                    (ancho / 1000) *
                    (alto / 1000) *
                    cantidad;
            }


            metrosInput.value =
                metros.toFixed(3);


            const subtotal =
                metros *
                precio;


            fila.querySelector(
                ".cot-subtotal"
            ).value =
                moneda.simbolo +
                " " +
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


    const descuentoInput =
        document.getElementById(
            "descuentoCotizacion"
        );


    const descuento =
        Math.min(
            subtotalGeneral,
            Math.max(
                0,
                Number(
                    descuentoInput.value
                ) || 0
            )
        );


    const base =
        subtotalGeneral -
        descuento;


    const igv =
        aplicarIgv
            ? base * 0.18
            : 0;


    const total =
        base + igv;


    document.getElementById(
        "totalMetrosCotizacion"
    ).textContent =
        totalMetros.toFixed(3) +
        " m²";


    document.getElementById(
        "subtotalCotizacion"
    ).textContent =
        moneda.simbolo +
        " " +
        subtotalGeneral.toFixed(2);


    document.getElementById(
        "igvCotizacion"
    ).textContent =
        moneda.simbolo +
        " " +
        igv.toFixed(2);


    document.getElementById(
        "totalCotizacion"
    ).textContent =
        moneda.simbolo +
        " " +
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

    construirHojaImpresion();

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


    [
        "rucCotizacion",
        "direccionCotizacion",

        // PROVINCIA
        "provinciaCotizacion",

        "vendedorCotizacion",
        "documentoCotizacion",
        "opCotizacion",
        "cpsCotizacion"

    ].forEach(
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


    document.getElementById(
        "descuentoCotizacion"
    ).value = "0";


    document.getElementById(
        "monedaCotizacion"
    ).value = "PEN";


    document.getElementById(
        "hojaImpresion"
    ).innerHTML = "";


    colocarFechaHoy();

    agregarFilaCotizacion();

    calcularCotizacion();
}


// ===============================
// HOJA DE IMPRESIÓN
// ===============================

function construirHojaImpresion() {

    const val =
        id =>
            document
                .getElementById(id)
                ?.value
                ?.trim() || "";


    const seguro =
        texto =>
            String(
                texto ?? ""
            ).replace(
                /[&<>"']/g,
                c => ({
                    "&": "&amp;",
                    "<": "&lt;",
                    ">": "&gt;",
                    '"': "&quot;",
                    "'": "&#39;"
                })[c]
            );


    const dinero =
        n =>
            (Number(n) || 0)
                .toLocaleString(
                    "es-PE",
                    {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    }
                );


    const moneda =
        obtenerMoneda();


    const fecha =
        val(
            "fechaCotizacion"
        ).split("-");


    const fechaBonita =
        fecha.length === 3

            ? `${fecha[2]}/${fecha[1]}/${fecha[0]}`

            : "";


    let suma = 0;


    const filas =
        [
            ...document.querySelectorAll(
                ".fila-cotizacion"
            )
        ].map(
            (fila, i) => {

                const campo =
                    clase =>
                        fila.querySelector(
                            clase
                        )?.value || "";


                const tipo =
                    campo(
                        ".cot-tipo"
                    );


                const espesor =
                    campo(
                        ".cot-espesor"
                    );


                const ancho =
                    Number(
                        campo(
                            ".cot-ancho"
                        )
                    ) || 0;


                const alto =
                    Number(
                        campo(
                            ".cot-alto"
                        )
                    ) || 0;


                const cantidad =
                    Number(
                        campo(
                            ".cot-cantidad"
                        )
                    ) || 0;


                const metros =
                    Number(
                        campo(
                            ".cot-metros"
                        )
                    ) || 0;


                const precio =
                    Number(
                        campo(
                            ".cot-precio"
                        )
                    ) || 0;


                const importe =
                    metros *
                    precio;


                suma +=
                    importe;


                return `

                    <tr>

                        <td>
                            ZKT${String(
                                i + 1
                            ).padStart(
                                4,
                                "0"
                            )}
                        </td>

                        <td>

                            VIDRIO
                            ${seguro(tipo)}
                            ${seguro(espesor)} mm

                            <br>

                            <small>
                                ${seguro(ancho)}
                                ×
                                ${seguro(alto)}
                                mm
                                -
                                ${metros.toFixed(3)}
                                m²
                            </small>

                        </td>

                        <td>
                            Mt²
                        </td>

                        <td class="numero">
                            ${seguro(cantidad)}
                        </td>

                        <td class="numero">
                            ${moneda.simbolo}
                            ${dinero(precio)}
                        </td>

                        <td class="numero">
                            ${moneda.simbolo}
                            ${dinero(importe)}
                        </td>

                    </tr>
                `;
            }
        ).join("");


    const descuento =
        Math.min(
            suma,
            Math.max(
                0,
                Number(
                    val(
                        "descuentoCotizacion"
                    )
                ) || 0
            )
        );


    const igv =
        document.getElementById(
            "aplicarIgv"
        ).checked

            ? (suma - descuento) * 0.18

            : 0;


    const total =
        suma -
        descuento +
        igv;


    const numero =
        val(
            "numeroCotizacion"
        );


    const observacion =
        val(
            "observacionesCotizacion"
        );


    document.getElementById(
        "hojaImpresion"
    ).innerHTML = `

    <article class="documento-zakata">


        <!-- ENCABEZADO -->

        <div class="z-encabezado">

            <img
                class="z-logo"
                src="https://maqvid.com/wp-content/uploads/2024/05/Zakata.jpeg"
                alt="Zakata Glass"
            >


            <div class="z-empresa">

                <b>
                    CORPORATION ZAKATA GLASS SAC
                </b>

                <br>

                Dirección Fiscal:
                JR. LOS MARTILLOS 5083
                URB. INDUSTRIAL INFANTAS -
                LOS OLIVOS, LIMA

                <br>

                Teléfono: 903161015

                <br>

                E-mail:
                corporation.zakataglass@gmail.com

            </div>


            <div class="z-recuadro">

                <b>
                    R.U.C. N° 20610769404
                </b>

                <strong>
                    COTIZACIÓN
                </strong>

                <b>
                    N° ${seguro(numero)}
                </b>

            </div>

        </div>


        <!-- DATOS CLIENTE -->

        <div class="z-datos">


            <div class="z-renglon">

                <span>

                    <b>Señor(es):</b>

                    ${seguro(
                        val(
                            "clienteCotizacion"
                        )
                    )}

                </span>


                <span>

                    <b>RUC:</b>

                    ${seguro(
                        val(
                            "rucCotizacion"
                        )
                    )}

                </span>

            </div>


            <!-- DIRECCIÓN Y PROVINCIA -->

            <div class="z-renglon">

                <span>

                    <b>Dirección:</b>

                    ${seguro(
                        val(
                            "direccionCotizacion"
                        )
                    )}

                </span>


                <span>

                    <b>Provincia:</b>

                    ${seguro(
                        val(
                            "provinciaCotizacion"
                        )
                    )}

                </span>

            </div>


            <div class="z-renglon z-tres">

                <span>

                    <b>N° Docum.:</b>

                    ${seguro(
                        val(
                            "documentoCotizacion"
                        )
                    )}

                </span>


                <span>

                    <b>Vendedor:</b>

                    ${seguro(
                        val(
                            "vendedorCotizacion"
                        )
                    )}

                </span>


                <span>

                    <b>OP:</b>

                    ${seguro(
                        val(
                            "opCotizacion"
                        ) ||
                        numero
                    )}

                </span>

            </div>


            <div class="z-renglon z-tres">

                <span>

                    <b>OBSERV.:</b>

                    ( PLANTA )

                    ${
                        observacion

                            ? " — " +
                              seguro(
                                  observacion
                              )

                            : ""
                    }

                </span>


                <span>

                    <b>CPS:</b>

                    ${seguro(
                        val(
                            "cpsCotizacion"
                        )
                    )}

                </span>


                <span>

                    <b>Fecha:</b>

                    ${seguro(
                        fechaBonita
                    )}

                </span>

            </div>


            <!-- MONEDA -->

            <div class="z-renglon">

                <span>

                    <b>MONEDA:</b>

                    ${moneda.nombre}
                    (${moneda.codigo})

                </span>

            </div>

        </div>


        <!-- TABLA -->

        <div class="z-tabla-area">

            <table class="z-tabla">

                <colgroup>

                    <col style="width:10%">

                    <col style="width:52%">

                    <col style="width:7%">

                    <col style="width:7%">

                    <col style="width:11%">

                    <col style="width:13%">

                </colgroup>


                <thead>

                    <tr>

                        <th>
                            CÓDIGO
                        </th>

                        <th>
                            DESCRIPCIÓN
                        </th>

                        <th>
                            UNI
                        </th>

                        <th>
                            CANT
                        </th>

                        <th>
                            VALOR V.
                        </th>

                        <th>
                            V. TOTAL
                        </th>

                    </tr>

                </thead>


                <tbody>

                    ${filas}


                    <tr class="z-relleno">

                        <td></td>


                        <td>

                            <div class="z-bancos">

                                <b>
                                    Sírvase abonar a nuestra cuenta corriente:
                                </b>

                                <br>

                                BCP SOLES :
                                191-9978634-0-80 //
                                CCI:
                                002-191009978634080-54

                                <br>

                                BCP DÓLARES:
                                191-9986747-1-39 //
                                CCI:
                                002-191-009986747139-55

                                <br>

                                BBVA - SOLES:
                                0011-0174-0201177909 //
                                CCI:
                                01117400020117790903

                            </div>

                        </td>


                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>

                    </tr>

                </tbody>

            </table>

        </div>


        <!-- TOTALES -->

        <div class="z-pie">


            <div class="z-letras">

                <b>
                    SON:
                </b>

                ${moneda.simbolo}

                ${dinero(total)}

                ${moneda.codigo}

                <br><br>

                Total Peso Kg: —

            </div>


            <div class="z-totales">


                <div>

                    <span>
                        Total Valor Venta - Op. Gravadas
                    </span>

                    <b>
                        ${moneda.simbolo}
                        ${dinero(suma)}
                    </b>

                </div>


                <div>

                    <span>
                        Dscto.
                    </span>

                    <b>
                        ${moneda.simbolo}
                        ${dinero(descuento)}
                    </b>

                </div>


                <div>

                    <span>
                        I.G.V.
                    </span>

                    <b>
                        ${moneda.simbolo}
                        ${dinero(igv)}
                    </b>

                </div>


                <div class="z-total-final">

                    <span>
                        Importe Total
                        ${moneda.codigo}
                    </span>

                    <b>
                        ${moneda.simbolo}
                        ${dinero(total)}
                    </b>

                </div>

            </div>

        </div>

    </article>
    `;
}
