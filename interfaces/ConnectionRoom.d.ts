declare module ConnectionRoom {
    export interface PlaylistItem {
        file_name: string
        file_size: number
    }
}

interface ConnectionRoom {
    id: string
    time: number
    playing: boolean
    playlist: ConnectionRoom.PlaylistItem[]
    playlist_index: number
    last_updated_by: string
}
