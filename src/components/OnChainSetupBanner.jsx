import { hasDeployedContracts } from '../config/contracts'
import deploymentsFile from '../config/deployments.json'
import styles from './OnChainSetupBanner.module.css'

export default function OnChainSetupBanner() {
  if (hasDeployedContracts()) return null

  const hasFileDeployments = Boolean(
    deploymentsFile?.contracts?.SimpleERC20 &&
    deploymentsFile?.contracts?.SimpleSwap
  )

  return (
    <div className={styles.banner} role="status">
      <div>
        <strong>Contracts not deployed</strong>
        <p>
          {hasFileDeployments ? (
            <>
              Contract addresses exist in <code>src/config/deployments.json</code> but the app
              cannot read them yet. Restart the dev server: stop <code>npm run dev</code>, then run
              it again. Also run <code>npm run sync:deploy-env</code> if <code>.env</code> is missing
              <code> VITE_*</code> addresses.
            </>
          ) : (
            <>
              Follow the deploy steps below (one-time setup). Your project already has helper scripts.
            </>
          )}
        </p>
        <ol className={styles.steps}>
          <li><code>npm run compile:contracts</code></li>
          <li>Set <code>SEPOLIA_RPC_URL</code> and <code>DEPLOYER_PRIVATE_KEY</code> in <code>.env</code></li>
          <li><code>npm run check:deployer</code> — fund wallet if balance is 0</li>
          <li><code>npm run deploy:sepolia</code> (or <code>npm run deploy:complete</code> if partially deployed)</li>
          <li><code>npm run sync:deploy-env</code> then restart <code>npm run dev</code></li>
        </ol>
      </div>
    </div>
  )
}
