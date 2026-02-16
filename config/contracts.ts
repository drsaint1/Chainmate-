
export const CONTRACTS = {
  CHAINMATE_CORE: process.env.NEXT_PUBLIC_CORE_CONTRACT_ADDRESS || '',
  CHAINMATE_TOKEN: process.env.NEXT_PUBLIC_TOKEN_CONTRACT_ADDRESS || '',
}

export const CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '97') 
