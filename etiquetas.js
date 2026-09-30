// ==========================================
// ZAKATA GLASS - GENERADOR DE ETIQUETAS
// ==========================================


// ==========================================
// BUSCAR PEDIDO POR OP
// ==========================================

async function buscarPedidoEtiqueta() {

    const opBuscada = document
        .getElementById("buscarOpEtiqueta")
        .value
        .trim()
        .toLowerCase();

    const mensaje = document.getElementById("mensajeEtiqueta");

    if (!opBuscada) {
        mensaje.innerHTML = "⚠️ Escribe una OP.";
        return;
    }

    mensaje.innerHTML = "Buscando pedido...";

    try {

        const respuesta = await fetch("/api/pedidos");

        if (!respuesta.ok) {
            throw new Error("No se pudieron cargar los pedidos.");
        }

        const pedidos = await respuesta.json();

        const pedido = pedidos.find(p =>
            String(p.op || "").trim().toLowerCase() === opBuscada
        );

        if (!pedido) {
            mensaje.innerHTML = "❌ No se encontró esa OP.";
            return;
        }

        // DATOS DEL PEDIDO
        document.getElementById("opEtiqueta").value =
            pedido.op || "";

        document.getElementById("clienteEtiqueta").value =
            pedido.cliente || "";

        document.getElementById("fechaEtiqueta").value =
            pedido.fechaEntrega || "";


        // SI EL PEDIDO TIENE VIDRIOS
        if (pedido.vidrios && pedido.vidrios.length > 0) {

            const vidrio = pedido.vidrios[0];

            document.getElementById("tipoVidrioEtiqueta").value =
                vidrio.tipoVidrio || "";

            document.getElementById("espesorEtiqueta").value =
                vidrio.espesor || "";

            document.getElementById("cantidadEtiqueta").value =
                vidrio.cantidad || 1;

            document.getElementById("entalleEtiqueta").value =
                vidrio.cantidadEntalle || 0;

            document.getElementById("limpioEtiqueta").value =
                vidrio.cantidadLimpio || 0;
        }


        mensaje.innerHTML =
            "✅ Pedido encontrado: <strong>" +
            pedido.op +
            "</strong>";

    } catch (error) {

        console.error(error);

        mensaje.innerHTML =
            "❌ Error al buscar el pedido.";
    }
}


// ==========================================
// GENERAR ETIQUETAS
// ==========================================

function generarEtiquetas() {

    const op =
        document.getElementById("opEtiqueta").value.trim();

    const cliente =
        document.getElementById("clienteEtiqueta").value.trim();

    const obra =
        document.getElementById("obraEtiqueta").value.trim();

    const fecha =
        document.getElementById("fechaEtiqueta").value;

    const tipo =
        document.getElementById("tipoVidrioEtiqueta").value.trim();

    const espesor =
        document.getElementById("espesorEtiqueta").value;

    const ancho =
        Number(document.getElementById("anchoEtiqueta").value);

    const alto =
        Number(document.getElementById("altoEtiqueta").value);

    const cantidad =
        Number(document.getElementById("cantidadEtiqueta").value);

    const entalle =
        Number(document.getElementById("entalleEtiqueta").value) || 0;

    const limpio =
        Number(document.getElementById("limpioEtiqueta").value) || 0;


    // VALIDACIONES

    if (!op) {
        alert("Ingresa la OP.");
        return;
    }

    if (!cliente) {
        alert("Ingresa el cliente.");
        return;
    }

    if (!tipo) {
        alert("Ingresa el tipo de vidrio.");
        return;
    }

    if (!espesor) {
        alert("Ingresa el espesor.");
        return;
    }

    if (!ancho || ancho <= 0) {
        alert("Ingresa el ancho del vidrio.");
        return;
    }

    if (!alto || alto <= 0) {
        alert("Ingresa el alto del vidrio.");
        return;
    }

    if (!cantidad || cantidad <= 0) {
        alert("La cantidad debe ser mayor a 0.");
        return;
    }

    if (entalle < 0 || limpio < 0) {
        alert("ENTALLE y LIMPIO no pueden ser negativos.");
        return;
    }

    if ((entalle + limpio) > cantidad) {
        alert(
            "ENTALLE + LIMPIO no puede superar la cantidad total."
        );
        return;
    }


    const contenedor =
        document.getElementById("listaEtiquetas");

    contenedor.innerHTML = "";


    // ==========================================
    // CREAR UNA ETIQUETA POR CADA VIDRIO
    // ==========================================

    for (let numero = 1; numero <= cantidad; numero++) {

        const llevaEntalle = numero <= entalle;

        const llevaLimpio =
            numero > entalle &&
            numero <= (entalle + limpio);


        const etiqueta =
            document.createElement("div");

        etiqueta.className = "etiqueta-vidrio";


        etiqueta.innerHTML = `

            <div class="etiqueta-superior">

                <div class="etiqueta-marca">
                    ZAKATA GLASS
                </div>

                <div class="etiqueta-numero">
                    ${numero}/${cantidad}
                </div>

            </div>


            <div class="etiqueta-op">

                OP:
                <strong>${escaparHTML(op)}</strong>

            </div>


            <div class="etiqueta-cliente">

                <span>CLIENTE</span>

                <strong>
                    ${escaparHTML(cliente)}
                </strong>

            </div>


            ${
                obra
                ?
                `
                <div class="etiqueta-dato">

                    <span>OBRA</span>

                    <strong>
                        ${escaparHTML(obra)}
                    </strong>

                </div>
                `
                :
                ""
            }


            <div class="etiqueta-vidrio-info">

                <strong>
                    ${escaparHTML(tipo)}
                    ${escaparHTML(String(espesor))} MM
                </strong>

            </div>


            <div class="etiqueta-medida">

                ${ancho} × ${alto}

                <small>mm</small>

            </div>


            <div class="etiqueta-procesos">

                ${
                    llevaEntalle
                    ? `<span class="proceso-activo">ENTALLE</span>`
                    : ""
                }

                ${
                    llevaLimpio
                    ? `<span class="proceso-activo">LIMPIO</span>`
                    : ""
                }

                ${
                    !llevaEntalle && !llevaLimpio
                    ? `<span>SIN PROCESO ESPECIAL</span>`
                    : ""
                }

            </div>


            <div class="etiqueta-inferior">

                <div>

                    FECHA ENTREGA

                    <strong>
                        ${formatearFechaEtiqueta(fecha)}
                    </strong>

                </div>


                <div class="codigo-etiqueta">

                    ${escaparHTML(op)}-${numero}

                </div>

            </div>

        `;


        contenedor.appendChild(etiqueta);
    }


    document.getElementById("accionesEtiquetas")
        .style.display = "block";
}


// ==========================================
// IMPRIMIR
// ==========================================

function imprimirEtiquetas() {

    const etiquetas =
        document.querySelectorAll(".etiqueta-vidrio");

    if (etiquetas.length === 0) {

        alert("Primero genera las etiquetas.");

        return;
    }

    window.print();
}


// ==========================================
// FORMATEAR FECHA
// ==========================================

function formatearFechaEtiqueta(fecha) {

    if (!fecha) {
        return "SIN FECHA";
    }

    const partes = fecha.split("-");

    if (partes.length !== 3) {
        return fecha;
    }

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}


// ==========================================
// SEGURIDAD PARA TEXTO HTML
// ==========================================

function escaparHTML(valor) {

    return String(valor ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}
