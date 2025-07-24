import { FastifyInstance, FastifyReply } from "fastify";
import { SchemaGet, SchemaPost } from "../schemas";
import Handlers from "../handlers/index";
import { JwtPayload, JsonWebTokenError } from "jsonwebtoken";

const rateLimit: Array<{
    ip: string,
    requests: {
        request: number,
        millesegunds: number
    }
}> = [];
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
        onRequest: function (request, reply, done) {
            console.log(request.ip)
            const exists = rateLimit.find(user_request => {
                return user_request.ip === request.ip;
            });
            if (exists) {
                const segunds_request = (Date.now() - exists.requests.millesegunds) / 1000
                if (segunds_request < 4) {
                    return reply.code(429).send({ message: "Sua requisição foi bloqueada,tente novamente mais tarde." });
                };
                if (segunds_request >= 4 && exists.requests.request >= 3) {
                    exists.requests.millesegunds = 0;
                    exists.requests.request = 0;
                };
            };
            if (exists && exists.requests.request < 3) {
                exists.requests.request++;
            };
            if (exists && exists.requests.request >= 3 && !exists.requests.millesegunds) {
                exists.requests.millesegunds = Date.now();
                return reply.code(429).send({ message: "Sua requisição foi bloqueada,tente novamente mais tarde." });
            };
            if (!exists) {
                console.log(rateLimit)
                rateLimit.push({
                    ip: request.ip,
                    requests: {
                        request: 1,
                        millesegunds: 0
                    }
                });
            };

            done();
        },
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