declare module Connection {
    export type Duplex = import('@fastify/websocket').SocketStream
}

interface ConnectionUser {
    id: string
    duplex: Connection.Duplex

    nickname?: string
    room?: string
    file_name?: string
    file_size?: number
    time?: number

    joined: number
}
