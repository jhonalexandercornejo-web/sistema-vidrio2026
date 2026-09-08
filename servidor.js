const express = require("express");
const path = require("path");
const Database = require("better-sqlite3");

const app = express();
const PORT = 3000;

const db = new Database("base_datos.db");

db.pragma("journal_mode = WAL");

db.exec(`
    CREATE TABLE IF NOT EXISTS pedidos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        op TEXT NOT NULL UNIQUE,
        cliente TEXT NOT NULL,
        fechaIngreso TEXT,
        fechaEntrega TEXT,
        horaEntrega TEXT,
        descripcion TEXT,
        procesoEspecial TEXT DEFAULT 'NINGUNO',
        cantidad REAL DEFAULT 0,
        metros REAL DEFAULT 0,
        corte INTEGER DEFAULT 0,
        entalle INTEGER DEFAULT 0,
        limpios INTEGER DEFAULT 0,
        templado INTEGER DEFAULT 0,
        terminado INTEGER DEFAULT 0,
        despacho INTEGER DEFAULT 0,
        creadoEn TEXT DEFAULT CURRENT_TIMESTAMP
    )
`);

app.use(express.json());
app.use(express.static(path.join(__dirname)));

function convertirPedido(row) {
    if (!row) return null;

    return {
        ...row,
        corte: Boolean(row.corte),
        entalle: Boolean(row.entalle),
        limpios: Boolean(row.limpios),
        templado: Boolean(row.templado),
        terminado: Boolean(row.terminado),
        despacho: Boolean(row.despacho)
    };
}

app.get("/api/pedidos", (req, res) => {
    const rows = db.prepare(`
        SELECT * FROM pedidos
        ORDER BY
            CASE WHEN fechaEntrega IS NULL OR fechaEntrega = '' THEN 1 ELSE 0 END,
            fechaEntrega ASC,
            CASE WHEN horaEntrega IS NULL OR horaEntrega = '' THEN 1 ELSE 0 END,
            horaEntrega ASC
    `).all();

    res.json(rows.map(convertirPedido));
});

app.post("/api/pedidos", (req, res) => {
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
        const stmt = db.prepare(`
            INSERT INTO pedidos (
                op,
                cliente,
                fechaIngreso,
                fechaEntrega,
                horaEntrega,
                descripcion,
                procesoEspecial,
                cantidad,
                metros
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const info = stmt.run(
            op,
            cliente,
            fechaIngreso || "",
            fechaEntrega || "",
            horaEntrega || "",
            descripcion || "",
            procesoEspecial || "NINGUNO",
            Number(cantidad) || 0,
            Number(metros) || 0
        );

        const pedido = db.prepare(
            "SELECT * FROM pedidos WHERE id = ?"
        ).get(info.lastInsertRowid);

        res.status(201).json(convertirPedido(pedido));

    } catch (error) {
        if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
            return res.status(409).json({
                error: "Esa OP ya existe."
            });
        }

        res.status(500).json({
            error: "No se pudo guardar el pedido."
        });
    }
});

app.put("/api/pedidos/:id", (req, res) => {
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
        .filter(([campo]) => camposPermitidos.includes(campo));

    if (cambios.length === 0) {
        return res.status(400).json({
            error: "No hay cambios válidos."
        });
    }

    const sets = cambios.map(([campo]) => `${campo} = ?`).join(", ");
    const valores = cambios.map(([, valor]) => valor ? 1 : 0);

    valores.push(id);

    const stmt = db.prepare(`
        UPDATE pedidos
        SET ${sets}
        WHERE id = ?
    `);

    const info = stmt.run(...valores);

    if (info.changes === 0) {
        return res.status(404).json({
            error: "Pedido no encontrado."
        });
    }

    const pedido = db.prepare(
        "SELECT * FROM pedidos WHERE id = ?"
    ).get(id);

    res.json(convertirPedido(pedido));
});

app.listen(PORT, () => {
    console.log(`Sistema funcionando en http://localhost:${PORT}`);
});
