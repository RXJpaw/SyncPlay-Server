declare module ConfigToml {
    export interface Server {
        host: string
        port: string
        password: string
    }

    export interface Certificate {
        privkey: string
        fullchain: string
        passphrase: string
    }
}

interface ConfigToml {
    server: ConfigToml.Server
    certificate: ConfigToml.Certificate
}
