import { FastifySchema } from "fastify";


export const SchemaPost: FastifySchema = {
    body: {
        type: "object",
        required: ['email', "username", "password"],
        properties: {
            email: { type: "string", format: "email" },
            username: { type: 'string' },
            password: { type: 'string' }
        }, additionalProperties: false
    },
    response: {
        '2xx': {
            type: "object",
            required: ["token", "message"],
            properties: {
                message: { type: "string" },
                token: { type: "string" }
            }
        },
        default: {
            type: "object",
            required: ["message"],
            properties: {
                message: { type: "string" }
            }
        }
    }
};

export const SchemaGet: FastifySchema = {
    response: {
        200: {
            type: "object",
            required: ['id','email','password','username'],
            properties: {
                id: {type:"string"},
                email: {type:"string",format:"email"},
                password: {type:"string"},
                username: {type:"string"}
            }
        }
    }
};