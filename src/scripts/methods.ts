import toml from 'toml'
import path from 'path'
import fsSync from 'fs'

export const getExecPath = () => {
    return process['pkg'] ? path.dirname(process.execPath) : path.resolve(__dirname, '..')
}

export const config = (): ConfigToml => {
    const config_path = path.join(getExecPath(), 'config.toml')
    const config_file = fsSync.readFileSync(config_path, 'utf-8')

    return toml.parse(config_file)
}

export const HandleError = (functionToHandle, ...args) => {
    try {
        return functionToHandle(...args)
    } catch (e) {
        return null
    }
}

export const ConsoleColor = {
    reset: '\x1b[0m',
    underscore: '\x1b[4m',
    fg: {
        black: '\x1b[30m',
        red: '\x1b[31m',
        green: '\x1b[32m',
        yellow: '\x1b[33m',
        blue: '\x1b[34m',
        magenta: '\x1b[35m',
        cyan: '\x1b[36m',
        white: '\x1b[37m',
        crimson: '\x1b[38m'
    },
    bg: {
        black: '\x1b[40m',
        red: '\x1b[41m',
        green: '\x1b[42m',
        yellow: '\x1b[43m',
        blue: '\x1b[44m',
        magenta: '\x1b[45m',
        cyan: '\x1b[46m',
        white: '\x1b[47m',
        crimson: '\x1b[48m'
    }
}
