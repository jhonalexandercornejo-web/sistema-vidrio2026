function mostrarProduccion() {

    const contenedor = document.getElementById("produccion");

    if (!contenedor) return;

    if (pedidos.length === 0) {
        contenedor.innerHTML = "<p>No hay pedidos registrados.</p>";
        return;
    }

    contenedor.innerHTML = pedidos.map(pedido => {

        return `
            <div class="op-card">

                <div class="op-cabecera">
                    <strong>OP ${pedido.op}</strong>

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
                        onclick="cambiarProceso(${pedido.id}, 'corte', ${!pedido.corte})"
                    >
                        ${pedido.corte ? "✓ CORTE" : "CORTE"}
                    </div>

                    <div
                        class="proceso ${pedido.entalle ? "terminado" : ""}"
                        onclick="cambiarProceso(${pedido.id}, 'entalle', ${!pedido.entalle})"
                    >
                        ${pedido.entalle ? "✓ ENTALLE" : "ENTALLE"}
                    </div>

                    <div
                        class="proceso ${pedido.limpios ? "terminado" : ""}"
                        onclick="cambiarProceso(${pedido.id}, 'limpios', ${!pedido.limpios})"
                    >
                        ${pedido.limpios ? "✓ LIMPIOS" : "LIMPIOS"}
                    </div>

                    <div
                        class="proceso ${pedido.templado ? "terminado" : ""}"
                        onclick="cambiarProceso(${pedido.id}, 'templado', ${!pedido.templado})"
                    >
                        ${pedido.templado ? "✓ TEMPLADO" : "TEMPLADO"}
                    </div>

                    <div
                        class="proceso ${pedido.terminado ? "terminado" : ""}"
                        onclick="cambiarProceso(${pedido.id}, 'terminado', ${!pedido.terminado})"
                    >
                        ${pedido.terminado ? "✓ TERMINADO" : "TERMINADO"}
                    </div>

                    <div
                        class="proceso ${pedido.despacho ? "terminado" : ""}"
                        onclick="cambiarProceso(${pedido.id}, 'despacho', ${!pedido.despacho})"
                    >
                        ${pedido.despacho ? "✓ DESPACHO" : "DESPACHO"}
                    </div>

                </div>

                <div class="detalle-op">
                    <strong>Especial:</strong>
                    ${pedido.procesoEspecial || "NINGUNO"}
                </div>

                <div class="detalle-op">
                    📝 <strong>Registrado:</strong>
                    ${formatearCreadoEn(pedido.creadoEn)}
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
