import { FastifyInstance } from "fastify";
import fastifyPlugin from "fastify-plugin";
import * as mysql from "mysql2/promise";

async function CreateConnection(fastify:FastifyInstance,options:mysql.ConnectionOptions) {
    const connect = await mysql.createConnection(options);
    connect.connect().then(() => {
        console.log('Conectado ao banco de dados com sucesso.');
    });
    fastify.decorate('mysql',connect);
};

export default fastifyPlugin(CreateConnection);