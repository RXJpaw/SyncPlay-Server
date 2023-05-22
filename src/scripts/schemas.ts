export const SCHEMA = {
    PUT_Room_Room: {
        body: {
            type: 'object',
            required: [],
            properties: {
                time: {
                    type: 'number'
                },
                playing: {
                    type: 'boolean'
                },
                playlist_index: {
                    type: 'number'
                },
                playlist: {
                    type: 'array',
                    items: {
                        type: 'object',
                        required: ['file_name', 'file_size'],
                        properties: {
                            file_name: {
                                type: 'string'
                            },
                            file_size: {
                                type: 'number'
                            }
                        }
                    }
                }
            }
        }
    },
    PUT_Nickname: {
        body: {
            type: 'string'
        }
    },
    PUT_File: {
        body: {
            type: 'object',
            required: ['name', 'size'],
            properties: {
                name: {
                    type: 'string'
                },
                size: {
                    type: 'number'
                }
            }
        }
    }
}
