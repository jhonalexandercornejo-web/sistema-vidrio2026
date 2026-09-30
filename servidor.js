const express = require("express");
const path = require("path");
const { Pool } = require("pg");

const app = express();

const PORT =
    process.env.PORT || 3000;


// ===============================
// POSTGRESQL
// ===============================

const pool = new Pool({

    connectionString:
        process.env.DATABASE_URL,

    ssl: {
        rejectUnauthorized: false
    },

    max: 10,

    idleTimeoutMillis: 30000,

    connectionTimeoutMillis: 10000
});


app.use(
    express.json()
);


app.use(
    express.static(
        path.join(__dirname)
    )
);


// ===============================
// CREAR TABLAS E ÍNDICES
// ===============================

async function crearTablas() {

    await pool.query(`

        CREATE TABLE IF NOT EXISTS pedidos (

            id SERIAL PRIMARY KEY,

            op TEXT NOT NULL UNIQUE,

            cliente TEXT NOT NULL,

            "fechaIngreso" TEXT,

            "fechaEntrega" TEXT,

            "horaEntrega" TEXT,

            descripcion TEXT,

            corte INTEGER DEFAULT 0,

            entalle INTEGER DEFAULT 0,

            limpios INTEGER DEFAULT 0,

            templado INTEGER DEFAULT 0,

            terminado INTEGER DEFAULT 0,

            despacho INTEGER DEFAULT 0,

            "creadoEn"
            TIMESTAMP
            NOT NULL
            DEFAULT CURRENT_TIMESTAMP

        )

    `);


    await pool.query(`

        ALTER TABLE pedidos

        ADD COLUMN IF NOT EXISTS
        "creadoEn"

        TIMESTAMP
        NOT NULL
        DEFAULT CURRENT_TIMESTAMP

    `);


    await pool.query(`

        CREATE TABLE IF NOT EXISTS vidrios (

            id SERIAL PRIMARY KEY,

            "pedidoId"
            INTEGER NOT NULL
            REFERENCES pedidos(id)
            ON DELETE CASCADE,

            "tipoVidrio"
            TEXT
            DEFAULT 'INCOLORO',

            espesor TEXT
            DEFAULT '8',

            cantidad REAL
            DEFAULT 0,

            metros REAL
            DEFAULT 0,

            "procesoEspecial"
            TEXT
            DEFAULT 'NINGUNO',

            "cantidadEntalle"
            INTEGER
            DEFAULT 0,

            "cantidadLimpio"
            INTEGER
            DEFAULT 0,

            "marcadosEntalle"
            JSONB
            NOT NULL
            DEFAULT '[]'::jsonb,

            "marcadosLimpio"
            JSONB
            NOT NULL
            DEFAULT '[]'::jsonb

        )

    `);


    // =====================================
    // AGREGAR COLUMNAS A BASE YA EXISTENTE
    // =====================================

    await pool.query(`

        ALTER TABLE vidrios

        ADD COLUMN IF NOT EXISTS
        "cantidadEntalle"
        INTEGER
        DEFAULT 0

    `);


    await pool.query(`

        ALTER TABLE vidrios

        ADD COLUMN IF NOT EXISTS
        "cantidadLimpio"
        INTEGER
        DEFAULT 0

    `);


    await pool.query(`

        ALTER TABLE vidrios

        ADD COLUMN IF NOT EXISTS
        "marcadosEntalle"
        JSONB
        NOT NULL
        DEFAULT '[]'::jsonb

    `);


    await pool.query(`

        ALTER TABLE vidrios

        ADD COLUMN IF NOT EXISTS
        "marcadosLimpio"
        JSONB
        NOT NULL
        DEFAULT '[]'::jsonb

    `);


    // ===============================
    // ÍNDICES
    // ===============================

    await pool.query(`

        CREATE INDEX IF NOT EXISTS
        idx_pedidos_cliente
        ON pedidos(cliente)

    `);


    await pool.query(`

        CREATE INDEX IF NOT EXISTS
        idx_pedidos_fecha_entrega
        ON pedidos("fechaEntrega")

    `);


    await pool.query(`

        CREATE INDEX IF NOT EXISTS
        idx_pedidos_terminado
        ON pedidos(terminado)

    `);


    await pool.query(`

        CREATE INDEX IF NOT EXISTS
        idx_pedidos_creado_en
        ON pedidos("creadoEn")

    `);


    await pool.query(`

        CREATE INDEX IF NOT EXISTS
        idx_vidrios_pedido_id
        ON vidrios("pedidoId")

    `);


    // ===============================
    // MIGRAR PEDIDOS ANTIGUOS
    // ===============================

    await pool.query(`

        INSERT INTO vidrios (

            "pedidoId",
            "tipoVidrio",
            espesor,
            cantidad,
            metros,
            "procesoEspecial"

        )

        SELECT

            p.id,

            'INCOLORO',

            '8',

            COALESCE(p.cantidad, 0),

            COALESCE(p.metros, 0),

            COALESCE(
                p."procesoEspecial",
                'NINGUNO'
            )

        FROM pedidos p

        WHERE NOT EXISTS (

            SELECT 1

            FROM vidrios v

            WHERE
                v."pedidoId" = p.id

        )

    `).catch(() => {

        console.log(
            "Pedidos antiguos sin columnas cantidad/procesoEspecial. Se continúa normalmente."
        );

    });
}


// ===============================
// CONVERTIR PEDIDO
// ===============================

function convertirPedido(row) {

    return {

        id:
            row.id,

        op:
            row.op,

        cliente:
            row.cliente,

        fechaIngreso:
            row.fechaIngreso || "",

        fechaEntrega:
            row.fechaEntrega || "",

        horaEntrega:
            row.horaEntrega || "",

        descripcion:
            row.descripcion || "",

        corte:
            Boolean(row.corte),

        entalle:
            Boolean(row.entalle),

        limpios:
            Boolean(row.limpios),

        templado:
            Boolean(row.templado),

        terminado:
            Boolean(row.terminado),

        despacho:
            Boolean(row.despacho),

        creadoEn:
            row.creadoEn,

        vidrios:
            Array.isArray(row.vidrios)
                ? row.vidrios
                : []

    };
}
// ===============================
// CONSTRUIR FILTROS
// ===============================

function construirFiltros(query = {}) {

    const condiciones = [];
    const valores = [];

    const buscar =
        String(query.buscar || "")
            .trim();

    const fechaEntrega =
        String(query.fechaEntrega || "")
            .trim();

    const estado =
        String(query.estado || "")
            .trim()
            .toLowerCase();


    if (buscar) {

        valores.push(
            `%${buscar}%`
        );

        condiciones.push(`

            (
                p.op ILIKE $${valores.length}
                OR
                p.cliente ILIKE $${valores.length}
            )

        `);
    }


    if (fechaEntrega) {

        valores.push(
            fechaEntrega
        );

        condiciones.push(`

            p."fechaEntrega" =
            $${valores.length}

        `);
    }


    if (estado === "pendiente") {

        condiciones.push(`

            COALESCE(p.corte, 0) = 0
            AND
            COALESCE(p.entalle, 0) = 0
            AND
            COALESCE(p.limpios, 0) = 0
            AND
            COALESCE(p.templado, 0) = 0
            AND
            COALESCE(p.terminado, 0) = 0

        `);
    }


    if (
        estado === "proceso"
        ||
        estado === "enproceso"
        ||
        estado === "en-proceso"
    ) {

        condiciones.push(`

            (
                COALESCE(p.corte, 0) <> 0
                OR
                COALESCE(p.entalle, 0) <> 0
                OR
                COALESCE(p.limpios, 0) <> 0
                OR
                COALESCE(p.templado, 0) <> 0
            )

            AND

            COALESCE(p.terminado, 0) = 0

        `);
    }


    if (estado === "terminado") {

        condiciones.push(`

            COALESCE(p.terminado, 0) <> 0

        `);
    }


    if (estado === "despacho") {

        condiciones.push(`

            COALESCE(p.despacho, 0) <> 0

        `);
    }


    const whereSQL =
        condiciones.length > 0
            ? "WHERE " + condiciones.join(" AND ")
            : "";


    return {
        whereSQL,
        valores
    };
}


// ===============================
// PEDIDOS PAGINADOS
// ===============================

app.get(
    "/api/pedidos-paginados",

    async (req, res) => {

        try {

            let pagina =
                Number(req.query.page) || 1;

            let limite =
                Number(req.query.limit) || 50;


            if (pagina < 1) {
                pagina = 1;
            }


            if (limite < 1) {
                limite = 50;
            }


            if (limite > 100) {
                limite = 100;
            }


            const offset =
                (pagina - 1) * limite;


            const {
                whereSQL,
                valores
            } =
                construirFiltros(
                    req.query
                );


            // ===============================
            // CONTAR PEDIDOS
            // ===============================

            const resultadoTotal =
                await pool.query(`

                    SELECT
                        COUNT(*)::INTEGER
                        AS total

                    FROM pedidos p

                    ${whereSQL}

                `, valores);


            const total =
                resultadoTotal.rows[0]
                    ?.total || 0;


            // ===============================
            // PAGINACIÓN
            // ===============================

            const valoresPedidos =
                [...valores];


            valoresPedidos.push(
                limite
            );


            const parametroLimite =
                valoresPedidos.length;


            valoresPedidos.push(
                offset
            );


            const parametroOffset =
                valoresPedidos.length;


            // ===============================
            // OBTENER PEDIDOS
            // ===============================

            const resultado =
                await pool.query(`

                    SELECT

                        p.*,

                        COALESCE(
                            vdatos.vidrios,
                            '[]'::json
                        ) AS vidrios

                    FROM pedidos p


                    LEFT JOIN LATERAL (

                        SELECT

                            json_agg(

                                json_build_object(

                                    'id',
                                    v.id,

                                    'tipoVidrio',
                                    v."tipoVidrio",

                                    'espesor',
                                    v.espesor,

                                    'cantidad',
                                    v.cantidad,

                                    'metros',
                                    v.metros,

                                    'procesoEspecial',
                                    v."procesoEspecial",

                                    'cantidadEntalle',
                                    COALESCE(
                                        v."cantidadEntalle",
                                        0
                                    ),

                                    'cantidadLimpio',
                                    COALESCE(
                                        v."cantidadLimpio",
                                        0
                                    ),

                                    'marcadosEntalle',
                                    COALESCE(
                                        v."marcadosEntalle",
                                        '[]'::jsonb
                                    ),

                                    'marcadosLimpio',
                                    COALESCE(
                                        v."marcadosLimpio",
                                        '[]'::jsonb
                                    )

                                )

                                ORDER BY v.id

                            ) AS vidrios

                        FROM vidrios v

                        WHERE
                            v."pedidoId" = p.id

                    ) vdatos ON TRUE


                    ${whereSQL}


                    ORDER BY

                        CASE

                            WHEN
                                p."fechaEntrega" IS NULL
                                OR
                                p."fechaEntrega" = ''

                            THEN 1

                            ELSE 0

                        END,

                        p."fechaEntrega" ASC,


                        CASE

                            WHEN
                                p."horaEntrega" IS NULL
                                OR
                                p."horaEntrega" = ''

                            THEN 1

                            ELSE 0

                        END,

                        p."horaEntrega" ASC,

                        p.id DESC


                    LIMIT
                        $${parametroLimite}

                    OFFSET
                        $${parametroOffset}

                `, valoresPedidos);


            const totalPaginas =
                Math.max(
                    1,
                    Math.ceil(
                        total / limite
                    )
                );


            res.json({

                pedidos:
                    resultado.rows.map(
                        convertirPedido
                    ),

                pagina:
                    pagina,

                limite:
                    limite,

                total:
                    total,

                totalPaginas:
                    totalPaginas,

                tieneAnterior:
                    pagina > 1,

                tieneSiguiente:
                    pagina < totalPaginas

            });


        } catch (error) {

            console.error(
                "ERROR PEDIDOS PAGINADOS:",
                error
            );


            res.status(500).json({

                error:
                    "No se pudieron cargar los pedidos."

            });
        }
    }
);


// ===============================
// RESUMEN GENERAL
// ===============================

app.get(
    "/api/resumen",

    async (req, res) => {

        try {

            const resultado =
                await pool.query(`

                    SELECT

                        COUNT(*)::INTEGER
                        AS total,


                        COUNT(*) FILTER (

                            WHERE

                                COALESCE(corte, 0) = 0
                                AND
                                COALESCE(entalle, 0) = 0
                                AND
                                COALESCE(limpios, 0) = 0
                                AND
                                COALESCE(templado, 0) = 0
                                AND
                                COALESCE(terminado, 0) = 0

                        )::INTEGER
                        AS pendientes,


                        COUNT(*) FILTER (

                            WHERE

                                (
                                    COALESCE(corte, 0) <> 0
                                    OR
                                    COALESCE(entalle, 0) <> 0
                                    OR
                                    COALESCE(limpios, 0) <> 0
                                    OR
                                    COALESCE(templado, 0) <> 0
                                )

                                AND

                                COALESCE(terminado, 0) = 0

                        )::INTEGER
                        AS proceso,


                        COUNT(*) FILTER (

                            WHERE
                                COALESCE(terminado, 0) <> 0

                        )::INTEGER
                        AS terminados


                    FROM pedidos

                `);


            res.json(
                resultado.rows[0]
            );


        } catch (error) {

            console.error(error);


            res.status(500).json({

                error:
                    "No se pudo cargar el resumen."

            });
        }
    }
);
// ===============================
// OBTENER UN PEDIDO
// ===============================

app.get(
    "/api/pedidos/:id",

    async (req, res) => {

        const id =
            Number(req.params.id);


        if (!Number.isInteger(id)) {

            return res
                .status(400)
                .json({

                    error:
                        "ID inválido."

                });
        }


        try {

            const resultado =
                await pool.query(`

                    SELECT

                        p.*,

                        COALESCE(

                            json_agg(

                                json_build_object(

                                    'id',
                                    v.id,

                                    'tipoVidrio',
                                    v."tipoVidrio",

                                    'espesor',
                                    v.espesor,

                                    'cantidad',
                                    v.cantidad,

                                    'metros',
                                    v.metros,

                                    'procesoEspecial',
                                    v."procesoEspecial",

                                    'cantidadEntalle',
                                    COALESCE(
                                        v."cantidadEntalle",
                                        0
                                    ),

                                    'cantidadLimpio',
                                    COALESCE(
                                        v."cantidadLimpio",
                                        0
                                    ),

                                    'marcadosEntalle',
                                    COALESCE(
                                        v."marcadosEntalle",
                                        '[]'::jsonb
                                    ),

                                    'marcadosLimpio',
                                    COALESCE(
                                        v."marcadosLimpio",
                                        '[]'::jsonb
                                    )

                                )

                                ORDER BY v.id

                            )

                            FILTER (
                                WHERE v.id IS NOT NULL
                            ),

                            '[]'

                        ) AS vidrios

                    FROM pedidos p

                    LEFT JOIN vidrios v

                    ON
                        v."pedidoId" = p.id

                    WHERE
                        p.id = $1

                    GROUP BY p.id

                `, [id]);


            if (
                resultado.rowCount === 0
            ) {

                return res
                    .status(404)
                    .json({

                        error:
                            "Pedido no encontrado."

                    });
            }


            res.json(
                convertirPedido(
                    resultado.rows[0]
                )
            );


        } catch (error) {

            console.error(error);


            res.status(500).json({

                error:
                    "No se pudo cargar el pedido."

            });
        }
    }
);


// ===============================
// API ANTIGUA
// ===============================
// Se mantiene para que las demás
// funciones actuales sigan funcionando.
// ===============================

app.get(
    "/api/pedidos",

    async (req, res) => {

        try {

            const resultado =
                await pool.query(`

                    SELECT

                        p.*,

                        COALESCE(

                            json_agg(

                                json_build_object(

                                    'id',
                                    v.id,

                                    'tipoVidrio',
                                    v."tipoVidrio",

                                    'espesor',
                                    v.espesor,

                                    'cantidad',
                                    v.cantidad,

                                    'metros',
                                    v.metros,

                                    'procesoEspecial',
                                    v."procesoEspecial",

                                    'cantidadEntalle',
                                    COALESCE(
                                        v."cantidadEntalle",
                                        0
                                    ),

                                    'cantidadLimpio',
                                    COALESCE(
                                        v."cantidadLimpio",
                                        0
                                    ),

                                    'marcadosEntalle',
                                    COALESCE(
                                        v."marcadosEntalle",
                                        '[]'::jsonb
                                    ),

                                    'marcadosLimpio',
                                    COALESCE(
                                        v."marcadosLimpio",
                                        '[]'::jsonb
                                    )

                                )

                                ORDER BY v.id

                            )

                            FILTER (
                                WHERE v.id IS NOT NULL
                            ),

                            '[]'

                        ) AS vidrios

                    FROM pedidos p

                    LEFT JOIN vidrios v

                    ON
                        v."pedidoId" = p.id


                    GROUP BY p.id


                    ORDER BY

                        CASE

                            WHEN
                                p."fechaEntrega" IS NULL
                                OR
                                p."fechaEntrega" = ''

                            THEN 1

                            ELSE 0

                        END,

                        p."fechaEntrega" ASC,


                        CASE

                            WHEN
                                p."horaEntrega" IS NULL
                                OR
                                p."horaEntrega" = ''

                            THEN 1

                            ELSE 0

                        END,

                        p."horaEntrega" ASC

                `);


            res.json(

                resultado.rows.map(
                    convertirPedido
                )

            );


        } catch (error) {

            console.error(error);


            res.status(500).json({

                error:
                    "No se pudieron cargar los pedidos."

            });
        }
    }
);


// ===============================
// CREAR PEDIDO
// ===============================

app.post(
    "/api/pedidos",

    async (req, res) => {

        const {

            op,

            cliente,

            fechaIngreso,

            fechaEntrega,

            horaEntrega,

            descripcion,

            vidrios

        } = req.body;


        if (!op || !cliente) {

            return res
                .status(400)
                .json({

                    error:
                        "La OP y el nombre son obligatorios."

                });
        }


        if (
            !Array.isArray(vidrios)
            ||
            vidrios.length === 0
        ) {

            return res
                .status(400)
                .json({

                    error:
                        "Debes agregar al menos un vidrio."

                });
        }


        // ===============================
        // VALIDAR CANTIDADES
        // ===============================

        for (const vidrio of vidrios) {

            const cantidad =
                Math.max(
                    0,
                    Math.floor(
                        Number(
                            vidrio.cantidad
                        ) || 0
                    )
                );

            const cantidadEntalle =
                Math.max(
                    0,
                    Math.floor(
                        Number(
                            vidrio.cantidadEntalle
                        ) || 0
                    )
                );

            const cantidadLimpio =
                Math.max(
                    0,
                    Math.floor(
                        Number(
                            vidrio.cantidadLimpio
                        ) || 0
                    )
                );


            if (cantidadEntalle > 30) {

                return res
                    .status(400)
                    .json({

                        error:
                            "La cantidad de ENTALLE no puede superar 30."

                    });
            }


            if (cantidadLimpio > 30) {

                return res
                    .status(400)
                    .json({

                        error:
                            "La cantidad de LIMPIO no puede superar 30."

                    });
            }


            if (
                cantidadEntalle
                +
                cantidadLimpio
                >
                cantidad
            ) {

                return res
                    .status(400)
                    .json({

                        error:
                            "ENTALLE + LIMPIO no puede superar la cantidad total del vidrio."

                    });
            }
        }


        const clienteDB =
            await pool.connect();


        try {

            await clienteDB.query(
                "BEGIN"
            );


            const resultado =
                await clienteDB.query(`

                    INSERT INTO pedidos (

                        op,

                        cliente,

                        "fechaIngreso",

                        "fechaEntrega",

                        "horaEntrega",

                        descripcion

                    )

                    VALUES (

                        $1,
                        $2,
                        $3,
                        $4,
                        $5,
                        $6

                    )

                    RETURNING *

                `, [

                    op,

                    cliente,

                    fechaIngreso || "",

                    fechaEntrega || "",

                    horaEntrega || "",

                    descripcion || ""

                ]);


            const pedido =
                resultado.rows[0];


            for (
                const vidrio
                of vidrios
            ) {

                const cantidad =
                    Math.max(
                        0,
                        Math.floor(
                            Number(
                                vidrio.cantidad
                            ) || 0
                        )
                    );

                const cantidadEntalle =
                    Math.max(
                        0,
                        Math.floor(
                            Number(
                                vidrio.cantidadEntalle
                            ) || 0
                        )
                    );

                const cantidadLimpio =
                    Math.max(
                        0,
                        Math.floor(
                            Number(
                                vidrio.cantidadLimpio
                            ) || 0
                        )
                    );


                await clienteDB.query(`

                    INSERT INTO vidrios (

                        "pedidoId",

                        "tipoVidrio",

                        espesor,

                        cantidad,

                        metros,

                        "procesoEspecial",

                        "cantidadEntalle",

                        "cantidadLimpio",

                        "marcadosEntalle",

                        "marcadosLimpio"

                    )

                    VALUES (

                        $1,
                        $2,
                        $3,
                        $4,
                        $5,
                        $6,
                        $7,
                        $8,
                        $9::jsonb,
                        $10::jsonb

                    )

                `, [

                    pedido.id,

                    vidrio.tipoVidrio
                        || "INCOLORO",

                    String(
                        vidrio.espesor
                        || "8"
                    ),

                    cantidad,

                    Number(
                        vidrio.metros
                    ) || 0,

                    "NINGUNO",

                    cantidadEntalle,

                    cantidadLimpio,

                    JSON.stringify([]),

                    JSON.stringify([])

                ]);
            }


            await clienteDB.query(
                "COMMIT"
            );


            res
                .status(201)
                .json({

                    mensaje:
                        "Pedido registrado correctamente.",

                    id:
                        pedido.id

                });


        } catch (error) {

            await clienteDB.query(
                "ROLLBACK"
            );


            console.error(error);


            if (
                error.code === "23505"
            ) {

                return res
                    .status(409)
                    .json({

                        error:
                            "Esa OP ya existe."

                    });
            }


            res
                .status(500)
                .json({

                    error:
                        "No se pudo guardar el pedido."

                });


        } finally {

            clienteDB.release();
        }
    }
);
// ===============================
// ACTUALIZAR DATOS DEL PEDIDO
// ===============================

app.put(
    "/api/pedidos/:id/datos",

    async (req, res) => {

        const id =
            Number(req.params.id);

        const {

            op,

            cliente,

            fechaIngreso,

            fechaEntrega,

            horaEntrega,

            descripcion,

            vidrios

        } = req.body;


        if (!Number.isInteger(id)) {

            return res
                .status(400)
                .json({

                    error:
                        "ID inválido."

                });
        }


        if (!op || !cliente) {

            return res
                .status(400)
                .json({

                    error:
                        "La OP y el nombre son obligatorios."

                });
        }


        if (
            !Array.isArray(vidrios)
            ||
            vidrios.length === 0
        ) {

            return res
                .status(400)
                .json({

                    error:
                        "Debes agregar al menos un vidrio."

                });
        }


        // ===============================
        // VALIDAR CANTIDADES
        // ===============================

        for (const vidrio of vidrios) {

            const cantidad =
                Math.max(
                    0,
                    Math.floor(
                        Number(
                            vidrio.cantidad
                        ) || 0
                    )
                );

            const cantidadEntalle =
                Math.max(
                    0,
                    Math.floor(
                        Number(
                            vidrio.cantidadEntalle
                        ) || 0
                    )
                );

            const cantidadLimpio =
                Math.max(
                    0,
                    Math.floor(
                        Number(
                            vidrio.cantidadLimpio
                        ) || 0
                    )
                );


            if (cantidadEntalle > 30) {

                return res
                    .status(400)
                    .json({

                        error:
                            "La cantidad de ENTALLE no puede superar 30."

                    });
            }


            if (cantidadLimpio > 30) {

                return res
                    .status(400)
                    .json({

                        error:
                            "La cantidad de LIMPIO no puede superar 30."

                    });
            }


            if (
                cantidadEntalle
                +
                cantidadLimpio
                >
                cantidad
            ) {

                return res
                    .status(400)
                    .json({

                        error:
                            "ENTALLE + LIMPIO no puede superar la cantidad total del vidrio."

                    });
            }
        }


        const clienteDB =
            await pool.connect();


        try {

            await clienteDB.query(
                "BEGIN"
            );


            const resultado =
                await clienteDB.query(`

                    UPDATE pedidos

                    SET

                        op = $1,

                        cliente = $2,

                        "fechaIngreso" = $3,

                        "fechaEntrega" = $4,

                        "horaEntrega" = $5,

                        descripcion = $6

                    WHERE id = $7

                    RETURNING *

                `, [

                    op,

                    cliente,

                    fechaIngreso || "",

                    fechaEntrega || "",

                    horaEntrega || "",

                    descripcion || "",

                    id

                ]);


            if (
                resultado.rowCount === 0
            ) {

                await clienteDB.query(
                    "ROLLBACK"
                );


                return res
                    .status(404)
                    .json({

                        error:
                            "Pedido no encontrado."

                    });
            }


            // ===============================
            // VIDRIOS QUE YA EXISTEN
            // ===============================

            const vidriosActuales =
                await clienteDB.query(`

                    SELECT *

                    FROM vidrios

                    WHERE
                        "pedidoId" = $1

                `, [id]);


            const idsRecibidos = [];


            // ===============================
            // ACTUALIZAR / CREAR VIDRIOS
            // ===============================

            for (const vidrio of vidrios) {

                const vidrioId =
                    Number(
                        vidrio.id
                    );


                const cantidad =
                    Math.max(
                        0,
                        Math.floor(
                            Number(
                                vidrio.cantidad
                            ) || 0
                        )
                    );


                const cantidadEntalle =
                    Math.max(
                        0,
                        Math.floor(
                            Number(
                                vidrio.cantidadEntalle
                            ) || 0
                        )
                    );


                const cantidadLimpio =
                    Math.max(
                        0,
                        Math.floor(
                            Number(
                                vidrio.cantidadLimpio
                            ) || 0
                        )
                    );


                const existente =
                    vidriosActuales.rows.find(
                        item =>
                            Number(item.id)
                            ===
                            vidrioId
                    );


                // ===============================
                // SI EL VIDRIO YA EXISTE
                // ===============================

                if (existente) {

                    idsRecibidos.push(
                        vidrioId
                    );


                    let marcadosEntalle =
                        Array.isArray(
                            existente.marcadosEntalle
                        )
                            ? existente.marcadosEntalle
                            : [];


                    let marcadosLimpio =
                        Array.isArray(
                            existente.marcadosLimpio
                        )
                            ? existente.marcadosLimpio
                            : [];


                    // Si bajamos la cantidad,
                    // quitar números que ya no existen.

                    marcadosEntalle =
                        marcadosEntalle
                            .map(Number)
                            .filter(
                                numero =>
                                    Number.isInteger(numero)
                                    &&
                                    numero >= 1
                                    &&
                                    numero <= cantidadEntalle
                                    &&
                                    numero <= 30
                            );


                    marcadosLimpio =
                        marcadosLimpio
                            .map(Number)
                            .filter(
                                numero =>
                                    Number.isInteger(numero)
                                    &&
                                    numero >= 1
                                    &&
                                    numero <= cantidadLimpio
                                    &&
                                    numero <= 30
                            );


                    await clienteDB.query(`

                        UPDATE vidrios

                        SET

                            "tipoVidrio" = $1,

                            espesor = $2,

                            cantidad = $3,

                            metros = $4,

                            "procesoEspecial" = $5,

                            "cantidadEntalle" = $6,

                            "cantidadLimpio" = $7,

                            "marcadosEntalle" = $8::jsonb,

                            "marcadosLimpio" = $9::jsonb

                        WHERE

                            id = $10

                            AND

                            "pedidoId" = $11

                    `, [

                        vidrio.tipoVidrio
                            || "INCOLORO",

                        String(
                            vidrio.espesor
                            || "8"
                        ),

                        cantidad,

                        Number(
                            vidrio.metros
                        ) || 0,

                        "NINGUNO",

                        cantidadEntalle,

                        cantidadLimpio,

                        JSON.stringify(
                            marcadosEntalle
                        ),

                        JSON.stringify(
                            marcadosLimpio
                        ),

                        vidrioId,

                        id

                    ]);

                } else {

                    // ===============================
                    // VIDRIO NUEVO
                    // ===============================

                    const nuevoVidrio =
                        await clienteDB.query(`

                            INSERT INTO vidrios (

                                "pedidoId",

                                "tipoVidrio",

                                espesor,

                                cantidad,

                                metros,

                                "procesoEspecial",

                                "cantidadEntalle",

                                "cantidadLimpio",

                                "marcadosEntalle",

                                "marcadosLimpio"

                            )

                            VALUES (

                                $1,
                                $2,
                                $3,
                                $4,
                                $5,
                                $6,
                                $7,
                                $8,
                                $9::jsonb,
                                $10::jsonb

                            )

                            RETURNING id

                        `, [

                            id,

                            vidrio.tipoVidrio
                                || "INCOLORO",

                            String(
                                vidrio.espesor
                                || "8"
                            ),

                            cantidad,

                            Number(
                                vidrio.metros
                            ) || 0,

                            "NINGUNO",

                            cantidadEntalle,

                            cantidadLimpio,

                            JSON.stringify([]),

                            JSON.stringify([])

                        ]);


                    idsRecibidos.push(
                        Number(
                            nuevoVidrio.rows[0].id
                        )
                    );
                }
            }


            // ===============================
            // ELIMINAR VIDRIOS QUITADOS
            // ===============================

            const idsActuales =
                vidriosActuales.rows.map(
                    vidrio =>
                        Number(vidrio.id)
                );


            const idsEliminar =
                idsActuales.filter(
                    vidrioId =>
                        !idsRecibidos.includes(
                            vidrioId
                        )
                );


            if (idsEliminar.length > 0) {

                await clienteDB.query(`

                    DELETE FROM vidrios

                    WHERE
                        "pedidoId" = $1

                    AND
                        id = ANY($2::int[])

                `, [

                    id,

                    idsEliminar

                ]);
            }


            await clienteDB.query(
                "COMMIT"
            );


            res.json({

                mensaje:
                    "Pedido actualizado correctamente."

            });


        } catch (error) {

            await clienteDB.query(
                "ROLLBACK"
            );


            console.error(error);


            if (
                error.code === "23505"
            ) {

                return res
                    .status(409)
                    .json({

                        error:
                            "Esa OP ya existe."

                    });
            }


            res
                .status(500)
                .json({

                    error:
                        "No se pudo actualizar el pedido."

                });


        } finally {

            clienteDB.release();
        }
    }
);


// ==========================================
// MARCAR / DESMARCAR UNIDAD DE VIDRIO
// ==========================================

app.put(
    "/api/vidrios/:id/marcado",

    async (req, res) => {

        const id =
            Number(
                req.params.id
            );


        const proceso =
            String(
                req.body.proceso || ""
            )
                .trim()
                .toLowerCase();


        const numero =
            Number(
                req.body.numero
            );


        const marcado =
            Boolean(
                req.body.marcado
            );


        if (!Number.isInteger(id)) {

            return res
                .status(400)
                .json({

                    error:
                        "ID de vidrio inválido."

                });
        }


        if (
            proceso !== "entalle"
            &&
            proceso !== "limpio"
        ) {

            return res
                .status(400)
                .json({

                    error:
                        "Proceso inválido."

                });
        }


        if (
            !Number.isInteger(numero)
            ||
            numero < 1
            ||
            numero > 30
        ) {

            return res
                .status(400)
                .json({

                    error:
                        "El número debe estar entre 1 y 30."

                });
        }


        try {

            const resultadoVidrio =
                await pool.query(`

                    SELECT

                        id,

                        "cantidadEntalle",

                        "cantidadLimpio",

                        "marcadosEntalle",

                        "marcadosLimpio"

                    FROM vidrios

                    WHERE
                        id = $1

                `, [id]);


            if (
                resultadoVidrio.rowCount === 0
            ) {

                return res
                    .status(404)
                    .json({

                        error:
                            "Vidrio no encontrado."

                    });
            }


            const vidrio =
                resultadoVidrio.rows[0];


            const cantidadProceso =
                proceso === "entalle"

                    ? Number(
                        vidrio.cantidadEntalle
                    ) || 0

                    : Number(
                        vidrio.cantidadLimpio
                    ) || 0;


            if (
                numero > cantidadProceso
            ) {

                return res
                    .status(400)
                    .json({

                        error:
                            "Ese número no pertenece a la cantidad de este proceso."

                    });
            }


            const campoMarcados =
                proceso === "entalle"

                    ? "marcadosEntalle"

                    : "marcadosLimpio";


            const marcadosActuales =
                Array.isArray(
                    vidrio[campoMarcados]
                )

                    ? vidrio[campoMarcados]
                        .map(Number)
                        .filter(
                            valor =>
                                Number.isInteger(valor)
                        )

                    : [];


            let nuevosMarcados =
                [...marcadosActuales];


            if (marcado) {

                if (
                    !nuevosMarcados.includes(
                        numero
                    )
                ) {

                    nuevosMarcados.push(
                        numero
                    );
                }

            } else {

                nuevosMarcados =
                    nuevosMarcados.filter(
                        valor =>
                            valor !== numero
                    );
            }


            nuevosMarcados =
                [...new Set(
                    nuevosMarcados
                )]
                    .filter(
                        valor =>
                            valor >= 1
                            &&
                            valor <= cantidadProceso
                            &&
                            valor <= 30
                    )
                    .sort(
                        (a, b) =>
                            a - b
                    );


            await pool.query(`

                UPDATE vidrios

                SET
                    "${campoMarcados}" = $1::jsonb

                WHERE
                    id = $2

            `, [

                JSON.stringify(
                    nuevosMarcados
                ),

                id

            ]);


            res.json({

                mensaje:
                    marcado
                        ? "Unidad marcada."
                        : "Unidad desmarcada.",

                marcados:
                    nuevosMarcados

            });


        } catch (error) {

            console.error(
                "ERROR MARCANDO VIDRIO:",
                error
            );


            res
                .status(500)
                .json({

                    error:
                        "No se pudo actualizar la unidad."

                });
        }
    }
);
// ===============================
// ACTUALIZAR PROCESO GENERAL
// ===============================

app.put(
    "/api/pedidos/:id",

    async (req, res) => {

        const id =
            Number(req.params.id);


        const camposPermitidos = [

            "corte",

            "entalle",

            "limpios",

            "templado",

            "terminado",

            "despacho"

        ];


        const cambios =
            Object.entries(req.body)

                .filter(
                    ([campo]) =>
                        camposPermitidos.includes(
                            campo
                        )
                );


        if (
            cambios.length === 0
        ) {

            return res
                .status(400)
                .json({

                    error:
                        "No hay cambios válidos."

                });
        }


        try {

            const valores = [];


            const sets =
                cambios.map(
                    ([campo, valor], indice) => {

                        valores.push(
                            valor ? 1 : 0
                        );


                        return `"${campo}" = $${indice + 1}`;
                    }
                );


            valores.push(id);


            const resultado =
                await pool.query(`

                    UPDATE pedidos

                    SET
                        ${sets.join(", ")}

                    WHERE
                        id = $${valores.length}

                    RETURNING *

                `, valores);


            if (
                resultado.rowCount === 0
            ) {

                return res
                    .status(404)
                    .json({

                        error:
                            "Pedido no encontrado."

                    });
            }


            res.json({

                mensaje:
                    "Proceso actualizado correctamente."

            });


        } catch (error) {

            console.error(error);


            res
                .status(500)
                .json({

                    error:
                        "No se pudo actualizar el proceso."

                });
        }
    }
);


// ===============================
// ELIMINAR PEDIDO
// ===============================

app.delete(
    "/api/pedidos/:id",

    async (req, res) => {

        const id =
            Number(req.params.id);


        if (
            !Number.isInteger(id)
        ) {

            return res
                .status(400)
                .json({

                    error:
                        "ID inválido."

                });
        }


        try {

            const resultado =
                await pool.query(`

                    DELETE FROM pedidos

                    WHERE id = $1

                    RETURNING id

                `, [id]);


            if (
                resultado.rowCount === 0
            ) {

                return res
                    .status(404)
                    .json({

                        error:
                            "Pedido no encontrado."

                    });
            }


            res.json({

                mensaje:
                    "Pedido eliminado correctamente."

            });


        } catch (error) {

            console.error(error);


            res
                .status(500)
                .json({

                    error:
                        "No se pudo eliminar el pedido."

                });
        }
    }
);


// ===============================
// INICIAR SERVIDOR
// ===============================

crearTablas()

    .then(() => {

        app.listen(
            PORT,

            () => {

                console.log(

                    `Sistema funcionando en http://localhost:${PORT}`

                );
            }
        );

    })

    .catch(error => {

        console.error(
            "Error conectando con PostgreSQL:",
            error
        );


        process.exit(1);
    });
