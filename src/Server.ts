import cluster from "cluster";
import { cpus } from "os";

import Fastify from "fastify";
import * as jwt from "jsonwebtoken";
import { StringValue } from "ms";
import * as bcrypt from "bcrypt";
import * as types from "../types/globals";
import db from "./plugins/db";
import routers from "./routers";

// decorates
console.log(process.env)

const app = Fastify({
    logger: true
});
app.decorate('bcrypt', {
    async hash(password: string, salt: number): Promise<string> {
        const hash = await bcrypt.hash(password, salt)

        return hash;
    },

    async compare(str: string, encrypted: string) {
        const compare = await bcrypt.compare(str, encrypted);
        return compare;
    }
});
app.decorate('jwt', {
    sign: function (payload: { id: string | number, username: string }, expires: StringValue): string {
        const token = jwt.sign(payload, process.env.SECRET, { expiresIn: expires });

        return token;
    },
    verify: function (token: string): string | jwt.JwtPayload {
        const payload = jwt.verify(token, process.env.SECRET as string);
        if (!payload) {
            return "Você precisa está logado para essa ação";
        };
        return payload;
    }
});
// plugins
app.register(db, {
    host: process.env.HOST,
    database: process.env.DATABASE,
    user: process.env.USERDB,
    password: process.env.PASSWORD,
});
app.register(routers, {
    prefix: "/api"
});

const PORT = +process.env.PORT || 8081;

app.listen({
    port: PORT,
    host: "0.0.0.0"
}, function (err, address) {
    if (err) {
        app.log.error(`Erro ao inicializar o servidor ` + err);
        process.exit();
    };

    app.log.info("Servidor rodando em " + address);
});