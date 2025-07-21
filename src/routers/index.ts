import { FastifyInstance, FastifyReply } from "fastify";
import { SchemaGet, SchemaPost } from "../schemas";
import Handlers from "../handlers/index";
import { JwtPayload, JsonWebTokenError } from "jsonwebtoken";

export default function (fastify: FastifyInstance): void {

    fastify.mysql.query(`
        CREATE TABLE IF NOT EXISTS users (
            id VARCHAR(60) NOT NULL PRIMARY KEY UNIQUE,
            email VARCHAR(255) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            username VARCHAR(255) NOT NULL UNIQUE
        )
    `).then(() => {
        console.log('Tabela criada com sucesso.');
    });
    const handlers = Handlers(fastify);
    fastify.route({
        method: "POST",
        url: '/register',
        schema: SchemaPost,
        handler: handlers.register
    });
    fastify.route({
        method: "POST",
        url: "/login",
        schema: SchemaPost,
        handler: handlers.login
    });
    fastify.route({
        method: "GET",
        url: '/profile',
        preHandler: function (request, reply, done): void | FastifyReply {
            const auth = request.headers.authorization;
            const message = "Token invalído,tente se logar novamente";
            if (!auth) {
                return reply.code(401).send({
                    message
                });
            };
            const token = auth.split(' ')[1];
            if (!token) {
                return reply.code(401).send({
                    message
                });
            };
            try {
                console.log(token);
                const payload = fastify.jwt.verify(token);

                request.user = payload as JwtPayload;
                done()
            }
            catch (e) {
                const error = e as JsonWebTokenError;
                return reply.code(500).send({ message: error.message });
            };

        },
        schema: SchemaGet,
        handler: handlers.profile
    });
};