
export const CONTRACTS = {
  CHAINMATE_CORE: process.env.NEXT_PUBLIC_CORE_CONTRACT_ADDRESS || '',
  CHAINMATE_TOKEN: process.env.NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS || '',
  // PancakeSwap V2 Router on BSC Testnet
  PANCAKE_ROUTER: '0xD99D1c33F9fC3444f8101754aBC46c52416550D1',
  // Wrapped BNB on BSC Testnet
  WBNB: '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd',
}

export const CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '97')

export const BSC_TESTNET_RPC = 'https://data-seed-prebsc-1-s1.binance.org:8545'
export const BSCSCAN_API_BASE = 'https://api-testnet.bscscan.com/api'
export const BSCSCAN_API_KEY = process.env.NEXT_PUBLIC_BSCSCAN_API_KEY || ''

// Known token addresses on BSC Testnet for swap resolution
export const TOKEN_ADDRESSES: Record<string, string> = {
  BNB: '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd',   // WBNB
  WBNB: '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd',
  CMT: process.env.NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS || '',
  BUSD: '0xeD24FC36d5Ee211Ea25A80239Fb8C4Cfd80f12Ee',
  USDT: '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd',
  DAI: '0x8a9424745056Eb399FD19a0EC26A14316684e274',
}
