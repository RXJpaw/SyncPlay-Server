declare module SyncPlayServer {
    export interface Params {
        version: string
        auth_type: 'basic' | 'bearer'
        room: string
        action: string
    }

    export interface Request {
        Params: SyncPlayServer.Params
        Body: { [key: string]: any }
    }
}

type SyncPlayRequest = import('fastify').FastifyRequest<SyncPlayServer.Request>
