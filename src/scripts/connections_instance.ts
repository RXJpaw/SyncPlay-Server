export const ConnectionsInstance = () => {
    const _connections = new Proxy({} as { [id: string]: ConnectionUser }, {
        set(target, key: string, newValue) {
            target[key] = newValue

            console.log(`User id:${key} joined.`)

            return Reflect.set(target, key, newValue)
        },
        deleteProperty(target, key: string) {
            delete target[key]

            console.log(`User id:${key} left.`)

            return Reflect.deleteProperty(target, key)
        }
    })
    const _rooms = new Proxy({} as { [id: string]: ConnectionRoom }, {
        set(target, key: string, newValue) {
            target[key] = newValue

            console.log(`Room id:${key} created.`)

            return Reflect.set(target, key, newValue)
        },
        deleteProperty(target, key: string) {
            delete target[key]

            console.log(`Room id:${key} deleted.`)

            return Reflect.deleteProperty(target, key)
        }
    })

    const ConnectionBuilder = (userId: string) => {
        //Destroy the user's connection.
        const destroy = (code: number = 1000) => {
            if (!_connections[userId]) return false

            leaveRoom()

            _connections[userId].duplex.socket.close(code)
            delete _connections[userId]

            return true
        }
        //Get the user's information.
        const getUser = () => {
            if (!_connections[userId]) return null

            const User = _connections[userId]

            return {
                id: User.id,

                nickname: User.nickname,
                room: User.room,
                file_name: User.file_name,
                file_size: User.file_size,
                time: User.time ?? 0
            }
        }
        //Get the user's room.
        const getRoom = () => {
            if (!_connections[userId]) return null

            const RoomId = _connections[userId].room
            if (!RoomId) return null

            return _rooms[RoomId]
        }
        //Get the user's duplex.
        const getDuplex = () => {
            if (!_connections[userId]) return null
            return _connections[userId].duplex
        }
        //Get the user's Subject aka UserId
        const getSubject = () => {
            if (!_connections[userId]) return null

            return userId
        }

        //Set the user's nickname.
        const setNickname = (nickname) => {
            if (!_connections[userId]) return null

            _connections[userId].nickname = nickname
        }
        //Leave the current room.
        const leaveRoom = () => {
            if (!_connections[userId]) return null

            const RoomId = _connections[userId].room
            if (!RoomId) return null

            room(RoomId).leaveRoom(userId)
        }
        //Join a room.
        const joinRoom = (roomId: string) => {
            if (!_connections[userId]) return null

            const currentRoomId = _connections[userId].room
            if (currentRoomId) room(currentRoomId).leaveRoom(userId)
            room(roomId).joinRoom(userId)
        }
        //Set the user's file name and size.
        const setFile = (name: string, size: number) => {
            if (!_connections[userId]) return null

            _connections[userId].file_name = name
            _connections[userId].file_size = size
        }
        //Set the user's time.
        const setTime = (time: number) => {
            if (!_connections[userId]) return null

            _connections[userId].time = time
        }

        return {
            destroy,
            getUser,
            getRoom,
            getDuplex,
            getSubject,

            setNickname,
            leaveRoom,
            joinRoom,
            setFile,
            setTime
        }
    }

    const create = (id: string, duplex: Connection.Duplex) => {
        _connections[id] = new Proxy({ id, duplex } as ConnectionUser, {
            set(target, key: string, current) {
                const before = target[key]
                if (before === current) return true
                target[key] = current

                console.log(`User id:${target.id} updated ${key}: ${before} -> ${current}`)

                target.duplex.socket.send(
                    JSON.stringify({
                        event: 'User/update',
                        data: ConnectionBuilder(id).getUser()
                    })
                )

                if (key === 'room') {
                    for (const user of Object.values(_connections)) {
                        if (![current, before].includes(user.room)) continue

                        user.duplex.socket.send(
                            JSON.stringify({
                                event: 'Room/users',
                                data: room(user.room).getUsers()
                            })
                        )
                    }
                } else {
                    for (const user of Object.values(_connections)) {
                        if (user.room !== target.room) continue

                        user.duplex.socket.send(
                            JSON.stringify({
                                event: 'Room/users',
                                data: room(user.room).getUsers()
                            })
                        )
                    }
                }

                return Reflect.set(target, key, current)
            }
        })

        _connections[id].joined = Date.now()

        return ConnectionBuilder(id)
    }

    const select = (id: string, new_duplex?: Connection.Duplex) => {
        if (!_connections[id]) return null

        if (new_duplex) {
            _connections[id].duplex = new_duplex
            _connections[id].joined = Date.now()
        }

        return ConnectionBuilder(id)
    }

    const RoomBuilder = (roomId: string) => {
        //Set userId of the next change.
        const setLastUpdatedBy = (userId?: string | null) => {
            if (!_rooms[roomId]) return null
            _rooms[roomId].last_updated_by = userId || ''
        }
        //Get userId of the last change.
        const getLastUpdatedBy = () => {
            if (!_rooms[roomId]) return ''
            return _rooms[roomId].last_updated_by
        }
        //Get the information of all users in this room.
        const getUsers = () => {
            return Object.values(_connections)
                .filter((user) => user.room === roomId)
                .map((user) => {
                    return {
                        id: user.id,

                        nickname: user.nickname,
                        file_name: user.file_name,
                        file_size: user.file_size,
                        time: user.time
                    }
                })
                .sort((a, b) => {
                    return (a.nickname || '').localeCompare(b.nickname || '')
                })
        }
        //Check if the room is empty
        const isEmpty = () => {
            return !Object.values(_connections).filter((user) => user.room === roomId).length
        }
        //Get the room's information.
        const getRoom = () => {
            if (!_rooms[roomId]) return null

            const Room = _rooms[roomId]

            return {
                id: Room.id,

                time: Room.time ?? 0,
                playing: Room.playing ?? false,
                playlist: Room.playlist ?? [],
                playlist_index: Room.playlist_index ?? 0
            }
        }
        //Set the room's time.
        const setTime = (time: number) => {
            if (!_rooms[roomId]) return null
            _rooms[roomId].time = time
        }
        //Set the room's playing state.
        const setPlaying = (playing: boolean) => {
            if (!_rooms[roomId]) return null
            _rooms[roomId].playing = playing
        }
        //Replace the room's playlist.
        const setPlaylist = (playlist: any[]) => {
            if (!_rooms[roomId]) return null
            _rooms[roomId].playlist = playlist
        }
        //Set the room's playlist index.
        const setPlaylistIndex = (playlist_index: number) => {
            if (!_rooms[roomId]) return null
            _rooms[roomId].playlist_index = playlist_index
        }

        //Make a user leave.
        const leaveRoom = (userId: string) => {
            if (!_connections[userId]) return null

            _connections[userId].room = undefined
            if (isEmpty()) destroy()
        }
        //Make a user join.
        const joinRoom = (userId: string) => {
            if (!_connections[userId]) return null

            if (isEmpty()) create()
            _connections[userId].room = roomId
        }

        //Destroy the room and force-leave user's in the room.
        const destroy = () => {
            if (!_rooms[roomId]) return false

            for (const id in _connections) {
                if (_connections[id].room !== roomId) continue

                _connections[id].room = undefined
            }

            delete _rooms[roomId]

            return true
        }
        //Create the room and define default values.
        const create = () => {
            if (_rooms[roomId]) return false

            _rooms[roomId] = new Proxy(
                {
                    id: roomId,
                    time: 0,
                    playing: false,
                    playlist: [],
                    playlist_index: 0,
                    last_updated_by: ''
                },
                {
                    set(target, key: string, current) {
                        const before = target[key]
                        if (before === current) return true
                        target[key] = current

                        console.log(`Room id:${target.id} updated ${key}: ${JSON.stringify(before)} -> ${JSON.stringify(current)}`)

                        if (key !== 'last_updated_by') {
                            for (const user of Object.values(_connections)) {
                                if (user.room !== target.id) continue
                                const Room = room(user.room)

                                user.duplex.socket.send(
                                    JSON.stringify({
                                        event: 'Room/update',
                                        data: { [key]: current },
                                        subject: Room.getLastUpdatedBy()
                                    })
                                )
                            }
                        }

                        return Reflect.set(target, key, current)
                    }
                }
            )
        }

        return {
            setLastUpdatedBy,
            getLastUpdatedBy,

            getUsers,
            isEmpty,
            getRoom,

            setTime,
            setPlaying,
            setPlaylist,
            setPlaylistIndex,

            leaveRoom,
            joinRoom,

            destroy,
            create
        }
    }

    const room = (id: string | undefined | null) => {
        return RoomBuilder(id!)
    }

    return {
        create,
        select,
        room
    }
}
