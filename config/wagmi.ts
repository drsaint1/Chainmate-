import { createConfig, http } from 'wagmi'
import { bscTestnet, bscMainnet } from './chains'

export const config = createConfig({
  chains: [bscTestnet, bscMainnet],
  transports: {
    [bscTestnet.id]: http(),
    [bscMainnet.id]: http(),
  },
})
