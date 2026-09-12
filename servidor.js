const express = require("express");
const path = require("path");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3000;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ===============================
// CREAR / ASEGURAR TABLA
// ===============================

async function crearTabla() {

    await pool.query(`
        CREATE TABLE IF NOT EXISTS pedidos (
            id SERIAL PRIMARY KEY,
            op TEXT NOT NULL UNIQUE,
            cliente TEXT NOT NULL,
            "fechaIngreso" TEXT,
            "fechaEntrega" TEXT,
            "horaEntrega" TEXT,
            descripcion TEXT,
            "procesoEspecial" TEXT DEFAULT 'NINGUNO',
            cantidad REAL DEFAULT 0,
            metros REAL DEFAULT 0,
            corte INTEGER DEFAULT 0,
            entalle INTEGER DEFAULT 0,
            limpios INTEGER DEFAULT 0,
            templado INTEGER DEFAULT 0,
            terminado INTEGER DEFAULT 0,
            despacho INTEGER DEFAULT 0,
            "creadoEn" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await pool.query(`
        ALTER TABLE pedidos
        ADD COLUMN IF NOT EXISTS "creadoEn"
        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    `);
}

// ===============================
// CONVERTIR PEDIDO
// ===============================

function convertirPedido(row) {

    if (!row) return null;

    return {
        ...row,

        corte: Boolean(row.corte),
        entalle: Boolean(row.entalle),
        limpios: Boolean(row.limpios),
        templado: Boolean(row.templado),
        terminado: Boolean(row.terminado),
        despacho: Boolean(row.despacho),

        creadoEn: row.creadoEn
    };
}

// ===============================
// OBTENER TODOS LOS PEDIDOS
// ===============================

app.get("/api/pedidos", async (req, res) => {

    try {

        const resultado = await pool.query(`
            SELECT *
            FROM pedidos
            ORDER BY
                CASE
                    WHEN "fechaEntrega" IS NULL
                    OR "fechaEntrega" = ''
                    THEN 1
                    ELSE 0
                END,
                "fechaEntrega" ASC,
                CASE
                    WHEN "horaEntrega" IS NULL
                    OR "horaEntrega" = ''
                    THEN 1
                    ELSE 0
                END,
                "horaEntrega" ASC
        `);

        res.json(
            resultado.rows.map(convertirPedido)
        );

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: "No se pudieron cargar los pedidos."
        });
    }
});

// ===============================
// CREAR PEDIDO
// ===============================

app.post("/api/pedidos", async (req, res) => {

    const {
        op,
        cliente,
        fechaIngreso,
        fechaEntrega,
        horaEntrega,
        descripcion,
        procesoEspecial,
        cantidad,
        metros
    } = req.body;

    if (!op || !cliente) {

        return res.status(400).json({
            error: "La OP y el cliente son obligatorios."
        });
    }

    try {

        const resultado = await pool.query(`
            INSERT INTO pedidos (
                op,
                cliente,
                "fechaIngreso",
                "fechaEntrega",
                "horaEntrega",
                descripcion,
                "procesoEspecial",
                cantidad,
                metros
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
                $9
            )
            RETURNING *
        `, [
            op,
            cliente,
            fechaIngreso || "",
            fechaEntrega || "",
            horaEntrega || "",
            descripcion || "",
            procesoEspecial || "NINGUNO",
            Number(cantidad) || 0,
            Number(metros) || 0
        ]);

        res.status(201).json(
            convertirPedido(resultado.rows[0])
        );

    } catch (error) {

        console.error(error);

        if (error.code === "23505") {

            return res.status(409).json({
                error: "Esa OP ya existe."
            });
        }

        res.status(500).json({
            error: "No se pudo guardar el pedido."
        });
    }
});

// ===============================
// ACTUALIZAR PROCESO
// ===============================

app.put("/api/pedidos/:id", async (req, res) => {

    const id = Number(req.params.id);

    const camposPermitidos = [
        "corte",
        "entalle",
        "limpios",
        "templado",
        "terminado",
        "despacho"
    ];

    const cambios = Object.entries(req.body)
        .filter(([campo]) =>
            camposPermitidos.includes(campo)
        );

    if (cambios.length === 0) {

        return res.status(400).json({
            error: "No hay cambios válidos."
        });
    }

    try {

        const valores = [];

        const sets = cambios.map(
            ([campo, valor], indice) => {

                valores.push(valor ? 1 : 0);

                return `"${campo}" = $${indice + 1}`;
            }
        );

        valores.push(id);

        const resultado = await pool.query(`
            UPDATE pedidos
            SET ${sets.join(", ")}
            WHERE id = $${valores.length}
            RETURNING *
        `, valores);

        if (resultado.rowCount === 0) {

            return res.status(404).json({
                error: "Pedido no encontrado."
            });
        }

        res.json(
            convertirPedido(resultado.rows[0])
        );

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: "No se pudo actualizar el pedido."
        });
    }
});

// ===============================
// ELIMINAR PEDIDO
// ===============================

app.delete("/api/pedidos/:id", async (req, res) => {

    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {

        return res.status(400).json({
            error: "ID de pedido inválido."
        });
    }

    try {

        const resultado = await pool.query(
            `
            DELETE FROM pedidos
            WHERE id = $1
            RETURNING *
            `,
            [id]
        );

        if (resultado.rowCount === 0) {

            return res.status(404).json({
                error: "Pedido no encontrado."
            });
        }

        res.json({
            mensaje: "Pedido eliminado correctamente."
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: "No se pudo eliminar el pedido."
        });
    }
});

// ===============================
// INICIAR SERVIDOR
// ===============================

crearTabla()
    .then(() => {

        app.listen(PORT, () => {

            console.log(
                `Sistema funcionando en http://localhost:${PORT}`
            );

        });

    })
    .catch((error) => {

        console.error(
            "Error conectando con Neon:",
            error
        );

        process.exit(1);
    });