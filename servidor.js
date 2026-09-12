const express = require("express");

const path = require("path");

const { Pool } = require("pg");


const app = express();


const PORT =
    process.env.PORT || 3000;



const pool = new Pool({

    connectionString:
        process.env.DATABASE_URL,

    ssl: {
        rejectUnauthorized: false
    }

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
// CREAR TABLAS
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
            DEFAULT 'NINGUNO'

        )

    `);



    // MIGRAR PEDIDOS ANTIGUOS
    // SOLO SI TODAVÍA NO TIENEN VIDRIOS

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
// OBTENER PEDIDOS
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
                                    v."procesoEspecial"

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

                await clienteDB.query(`

                    INSERT INTO vidrios (

                        "pedidoId",

                        "tipoVidrio",

                        espesor,

                        cantidad,

                        metros,

                        "procesoEspecial"

                    )

                    VALUES (

                        $1,
                        $2,
                        $3,
                        $4,
                        $5,
                        $6

                    )

                `, [

                    pedido.id,

                    vidrio.tipoVidrio
                        || "INCOLORO",

                    String(
                        vidrio.espesor
                        || "8"
                    ),

                    Number(
                        vidrio.cantidad
                    ) || 0,

                    Number(
                        vidrio.metros
                    ) || 0,

                    vidrio.procesoEspecial
                        || "NINGUNO"

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



            await clienteDB.query(`

                DELETE FROM vidrios

                WHERE "pedidoId" = $1

            `, [id]);



            for (
                const vidrio
                of vidrios
            ) {

                await clienteDB.query(`

                    INSERT INTO vidrios (

                        "pedidoId",

                        "tipoVidrio",

                        espesor,

                        cantidad,

                        metros,

                        "procesoEspecial"

                    )

                    VALUES (

                        $1,
                        $2,
                        $3,
                        $4,
                        $5,
                        $6

                    )

                `, [

                    id,

                    vidrio.tipoVidrio
                        || "INCOLORO",

                    String(
                        vidrio.espesor
                        || "8"
                    ),

                    Number(
                        vidrio.cantidad
                    ) || 0,

                    Number(
                        vidrio.metros
                    ) || 0,

                    vidrio.procesoEspecial
                        || "NINGUNO"

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



// ===============================
// ACTUALIZAR PROCESO
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
// ELIMINAR
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
