import { FastifyInstance,FastifyRequest } from "fastify";
import { JwtPayload } from "jsonwebtoken";
import { StringValue } from "ms";
import { Connection } from "mysql2/promise";

declare module "fastify" {
    interface FastifyInstance {
        jwt: {
            sign(payload: { id: string | number, username: string }, expires: StringValue): string;
            verify(token: string): string | JwtPayload
        }
        mysql: Connection;

        bcrypt: {
            hash(password:string,salt:number):Promise<string>;
            compare(str:string,encrypted:string):Promise<boolean>;
        }
    }
    interface FastifyRequest {
        user: JwtPayload
    }
}