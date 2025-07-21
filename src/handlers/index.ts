import { randomUUID } from "crypto";
import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import status_code from "http-status-codes";
import { } from "mysql2";
export default function (fastify: FastifyInstance) {

    interface BodyRequest {
        email?: string;
        username?: string;
        password?: string;
    };
    interface User {
        id: string;
        email: string;
        password: string;
        username: string;
    }
    async function register(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
        try {
            const { email, password, username } = request.body as BodyRequest;

            const user = await fastify.mysql.query(`SELECT * FROM users WHERE email = ? OR username = ?`, [email, username]).then(r => {
                if (Array.isArray(r[0])) return r[0];

                return r
            });
            console.log(user[0])
            if (user[0]) {
                return reply.code(status_code.UNAUTHORIZED).send({
                    message: "Esse usuário já existe"
                });
            };
            const id_user = randomUUID();
            await fastify.mysql.query(`INSERT INTO users (id,email,password,username) VALUES (?,?,?,?)`, [
                id_user,
                email,
                await fastify.bcrypt.hash(password as string, 10),
                username
            ]);
            const token = fastify.jwt.sign({ id: id_user, username: username as string }, '1d');
            return reply.code(status_code.CREATED).send({
                message: "Usuário criado com sucesso.",
                token
            });
        }
        catch (e) {
            return reply.code(status_code.INTERNAL_SERVER_ERROR).send({ message: "Erro no servidor,tente novamente mais tarde." });
        };
    };

    async function login(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply | void> {
        try {
            const { email, username, password } = request.body as BodyRequest;

            const user = await fastify.mysql.query(`SELECT * FROM users WHERE email = ? OR username = ?`, [email, username]).then(r => {
                if (Array.isArray(r[0])) return r[0][0] as User
            });
            if (!user) {
                return reply.code(status_code.NOT_FOUND).send({
                    message: "Usuário não encontrado."
                });
            };
            console.log(user);
            const comparePassword = await fastify.bcrypt.compare(password as string, user.password)
            if (user.username === username || user.email === email && comparePassword) {
                const token = fastify.jwt.sign({ id: user.id, username: user.username }, '1d');

                return reply.code(status_code.OK).send({
                    message: "Usuário logado com sucesso",
                    token
                });
            };
            if (user.username === username || user.email === email && !comparePassword) {
                return reply.code(status_code.UNAUTHORIZED).send({ message: "Senha incorreta." });
            };
        }
        catch (e) {
            return reply.code(status_code.INTERNAL_SERVER_ERROR).send({
                message: 'Erro no servidor,tente novamente mais tarde.'
            });
        }
    };
    async function profile(request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
        const [user] = await fastify.mysql.query(`SELECT * FROM users WHERE id = ?`, request.user.id).then(r => {
            return r[0];
        }) as Array<User>;
        console.log(user);
        return reply.code(status_code.OK).send(user );
    };
    return { register, login, profile };
};