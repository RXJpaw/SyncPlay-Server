import { getExecPath } from './scripts/methods'
import path from 'path'
import fsSync from 'fs'

const main = async () => {
    const ExecutablePath = getExecPath()
    const ConfigExamplePath = path.join(__dirname, 'assets', 'config.example.toml')
    const ExternalConfigPath = path.join(ExecutablePath, 'config.toml')

    if (!fsSync.existsSync(ExternalConfigPath)) {
        fsSync.copyFileSync(ConfigExamplePath, ExternalConfigPath)
        console.log('The config file "config.toml" was created. Configure it before starting the service again.')
    } else {
        import('./scripts/server')
    }
}

main().then()
