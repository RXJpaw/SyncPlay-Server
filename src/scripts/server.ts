import { ConnectionsInstance } from './connections_instance'
import { config, HandleError } from './methods'
import websocket from '@fastify/websocket'
import { SCHEMA } from './schemas'
import crypto from 'node:crypto'
import Fastify from 'fastify'
import fsSync from 'fs'

const ServerVersion = 'v1'
const ServerSecret = crypto.randomBytes(48)
const Connections = ConnectionsInstance()
const CONFIG = config()

const FastifyArguments = {}
const ServerAddress = CONFIG.server.host
const ServerPort = CONFIG.server.port

const certificate = CONFIG.certificate
if (certificate.privkey && certificate.fullchain) {
    FastifyArguments['https'] = {
        key: fsSync.readFileSync(certificate.privkey, 'utf-8'),
        cert: fsSync.readFileSync(certificate.fullchain, 'utf8'),
        passphrase: certificate.passphrase || undefined
    }
}

const fastify = Fastify({ ...FastifyArguments })
fastify.register(websocket, { options: { host: ServerAddress } })
fastify.register(async (fastify) => {
    /**
     * Authorization
     */
    //Validate Headers, Paths, Queries for authorization (HOOK_PreValidation)
    fastify.addHook('preValidation', async (req: SyncPlayRequest, res) => {
        const { version } = req.params
        if (version !== ServerVersion) return res.code(404).send('unsupported_server_version')

        const ServerPassword = CONFIG.server.password
        if (!ServerPassword) return

        const AuthHeader = req.headers.authorization
        if (!AuthHeader) return res.code(401).send('authorization_required')

        if (AuthHeader.startsWith('Basic ')) {
            const EncryptedPassword = AuthHeader.substring(6)
            const ProvidedPassword = Buffer.from(EncryptedPassword, 'base64url').toString('utf-8')
            if (ProvidedPassword !== ServerPassword) return res.code(401).send('authorization_invalid')

            req.id = req.id.substring(4)
            req.params.auth_type = 'basic'
        } else if (AuthHeader.startsWith('Bearer ')) {
            const EncryptedBearer = AuthHeader.substring(7)
            const [ProvidedToken, Signature] = EncryptedBearer.split('.')
            if (!ProvidedToken || !Signature) return res.code(401).send('bearer_malformed')

            const CompareHash = crypto.createHmac('sha256', ServerSecret).update(ProvidedToken).digest('base64url')
            if (Signature !== CompareHash) return res.code(401).send('authorization_invalid')

            req.id = Buffer.from(ProvidedToken, 'base64url').toString('utf-8')
            req.params.auth_type = 'bearer'
        } else {
            return res.code(401).send('authorization_unsupported')
        }
    })
    //Request Bearer for further requests (GET_Authorization)
    fastify.get('/:version/authorization', (req: SyncPlayRequest, res) => {
        if (req.params.auth_type !== 'basic') return res.code(403).send('non_basic_authorization')

        const TokenData = Buffer.from(req.id).toString('base64url')
        const Signature = crypto.createHmac('sha256', ServerSecret).update(TokenData).digest('base64url')

        return res
            .code(200)
            .headers({ authorization: TokenData + '.' + Signature })
            .send()
    })

    /**
     * User Room Operations
     */
    //User joins :room (POST_Room_RoomJoin)
    fastify.post('/:version/room/:room/join', (req: SyncPlayRequest, res) => {
        if (req.params.auth_type !== 'bearer') return res.code(403).send('non_bearer_authorization')

        const Connection = Connections.select(req.id)
        if (!Connection) return res.code(409).send('client_not_connected')

        Connection.joinRoom(req.params.room)
        return res.code(200).send()
    })
    //Get the User's current room (GET_Room)
    fastify.get('/:version/room', (req: SyncPlayRequest, res) => {
        if (req.params.auth_type !== 'bearer') return res.code(403).send('non_bearer_authorization')

        const Connection = Connections.select(req.id)
        if (!Connection) return res.code(409).send('client_not_connected')

        const Room = Connection.getRoom()
        return res.code(200).send(Room)
    })
    //Update the user's current room (PUT_Room_Room)
    fastify.put('/:version/room', { schema: SCHEMA.PUT_Room_Room }, (req: SyncPlayRequest, res) => {
        if (req.params.auth_type !== 'bearer') return res.code(403).send('non_bearer_authorization')

        const Connection = Connections.select(req.id)
        if (!Connection) return res.code(409).send('client_not_connected')
        const UserRoom = Connection.getRoom()
        if (!UserRoom) return res.code(409).send('client_is_lonely')

        const Room = Connections.room(UserRoom.id)
        Room.setLastUpdatedBy(Connection.getSubject())

        if (Object.hasOwn(req.body, 'time')) Room.setTime(req.body.time)
        if (Object.hasOwn(req.body, 'playing')) Room.setPlaying(req.body.playing)
        if (Object.hasOwn(req.body, 'playlist')) Room.setPlaylist(req.body.playlist)
        if (Object.hasOwn(req.body, 'playlist_index')) Room.setPlaylistIndex(req.body.playlist_index)

        return res.code(200).send()
    })
    //User leaves current room (DELETE_Room)
    fastify.delete('/:version/room', (req: SyncPlayRequest, res) => {
        if (req.params.auth_type !== 'bearer') return res.code(403).send('non_bearer_authorization')

        const Connection = Connections.select(req.id)
        if (!Connection) return res.code(409).send('client_not_connected')

        Connection.leaveRoom()
        return res.code(200).send()
    })
    //Get the users in the User's current room (GET_Users)
    fastify.get('/:version/users', (req: SyncPlayRequest, res) => {
        if (req.params.auth_type !== 'bearer') return res.code(403).send('non_bearer_authorization')

        const Connection = Connections.select(req.id)
        if (!Connection) return res.code(409).send('client_not_connected')
        const UserRoom = Connection.getRoom()
        if (!UserRoom) return res.code(409).send('client_is_lonely')

        const Room = Connections.room(UserRoom.id)
        const RoomUsers = Room.getUsers()

        return res.code(200).send(RoomUsers)
    })

    /**
     * User Self Operations
     */
    //Set the User's nickname (PUT_Nickname)
    fastify.put('/:version/nickname', { schema: SCHEMA.PUT_Nickname }, (req: SyncPlayRequest, res) => {
        if (req.params.auth_type !== 'bearer') return res.code(403).send('non_bearer_authorization')

        const Connection = Connections.select(req.id)
        if (!Connection) return res.code(409).send('client_not_connected')

        Connection.setNickname(req.body)
        return res.code(200).send()
    })
    //Get the User (GET_User)
    fastify.get('/:version/user', (req: SyncPlayRequest, res) => {
        if (req.params.auth_type !== 'bearer') return res.code(403).send('non_bearer_authorization')

        const Connection = Connections.select(req.id)
        if (!Connection) return res.code(409).send('client_not_connected')

        const User = Connection.getUser()
        return res.code(200).send(User)
    })
    //Set the User's file (PUT_File)
    fastify.put('/:version/file', { schema: SCHEMA.PUT_File }, (req: SyncPlayRequest, res) => {
        if (req.params.auth_type !== 'bearer') return res.code(403).send('non_bearer_authorization')

        const Connection = Connections.select(req.id)
        if (!Connection) return res.code(409).send('client_not_connected')

        Connection.setFile(req.body.name, req.body.size)
        return res.code(200).send()
    })

    /**
     * Websocket
     */
    fastify.get('/:version/websocket', { websocket: true }, (connection, req) => {
        const Connection = Connections.select(req.id, connection) || Connections.create(req.id, connection)

        connection.socket.on('message', async (buffer) => {
            const message = HandleError(JSON.parse, buffer.toString())
            if (typeof message !== 'object') return

            switch (message.event) {
                case 'Time/set': {
                    if (typeof message.data !== 'number') return

                    return Connection.setTime(Math.floor(message.data))
                }
            }
        })
        connection.socket.on('close', () => {
            Connection.destroy()
        })
    })
})

fastify
    .listen({ port: Number(ServerPort), host: ServerAddress })
    .then((err) => console.debug(err))
    .catch((err) => console.error(err))
