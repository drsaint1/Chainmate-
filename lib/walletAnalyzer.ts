import { ethers } from 'ethers'
import { CONTRACTS, TOKEN_ADDRESSES, BSC_TESTNET_RPC, BSCSCAN_API_BASE, BSCSCAN_API_KEY } from '@/config/contracts'
import { WalletAnalysisData, BSCScanTransaction, ContractSourceData } from '@/types'

const provider = new ethers.JsonRpcProvider(BSC_TESTNET_RPC)

const ERC20_BALANCE_ABI = [
  'function balanceOf(address account) external view returns (uint256)',
  'function decimals() external view returns (uint8)',
]

const CORE_REPUTATION_ABI = [
  'function getAddressReputation(address addr) external view returns (uint256, bool)',
]

async function getBNBBalance(address: string): Promise<string> {
  const balance = await provider.getBalance(address)
  return ethers.formatEther(balance)
}

async function getTokenBalance(
  tokenAddress: string,
  walletAddress: string
): Promise<string> {
  const contract = new ethers.Contract(tokenAddress, ERC20_BALANCE_ABI, provider)
  const [balance, decimals] = await Promise.all([
    contract.balanceOf(walletAddress),
    contract.decimals(),
  ])
  return ethers.formatUnits(balance, decimals)
}

async function getAllTokenBalances(
  address: string
): Promise<{ symbol: string; balance: string; address: string }[]> {
  const tokens = Object.entries(TOKEN_ADDRESSES).filter(
    ([symbol]) => symbol !== 'WBNB' && symbol !== 'BNB' // skip WBNB/BNB — native BNB shown separately
  )

  const results = await Promise.allSettled(
    tokens.map(async ([symbol, tokenAddr]) => {
      const balance = await getTokenBalance(tokenAddr, address)
      return { symbol, balance, address: tokenAddr }
    })
  )

  return results
    .filter((r): r is PromiseFulfilledResult<{ symbol: string; balance: string; address: string }> =>
      r.status === 'fulfilled'
    )
    .map((r) => r.value)
}

async function getTransactionCount(address: string): Promise<number> {
  return provider.getTransactionCount(address)
}

async function isContractAddress(address: string): Promise<boolean> {
  const code = await provider.getCode(address)
  return code !== '0x'
}

async function getRecentTransactions(address: string): Promise<BSCScanTransaction[]> {
  try {
    const apiKeyParam = BSCSCAN_API_KEY ? `&apikey=${BSCSCAN_API_KEY}` : ''
    const url = `${BSCSCAN_API_BASE}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=25&sort=desc${apiKeyParam}`
    const response = await fetch(url)
    const data = await response.json()
    if (data.status === '1' && Array.isArray(data.result)) {
      return data.result
    }
    return []
  } catch {
    return []
  }
}

async function getFirstTxTimestamp(address: string): Promise<number | null> {
  try {
    const apiKeyParam = BSCSCAN_API_KEY ? `&apikey=${BSCSCAN_API_KEY}` : ''
    const url = `${BSCSCAN_API_BASE}?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=1&sort=asc${apiKeyParam}`
    const response = await fetch(url)
    const data = await response.json()
    if (data.status === '1' && Array.isArray(data.result) && data.result.length > 0) {
      return parseInt(data.result[0].timeStamp)
    }
    return null
  } catch {
    return null
  }
}

async function getOnchainReputation(
  address: string
): Promise<{ transactionCount: number; isFlagged: boolean } | null> {
  try {
    if (!CONTRACTS.CHAINMATE_CORE) return null
    const contract = new ethers.Contract(
      CONTRACTS.CHAINMATE_CORE,
      CORE_REPUTATION_ABI,
      provider
    )
    const [txCount, isFlagged] = await contract.getAddressReputation(address)
    return { transactionCount: Number(txCount), isFlagged }
  } catch {
    return null
  }
}

async function getContractSourceCode(address: string): Promise<ContractSourceData | null> {
  try {
    const apiKeyParam = BSCSCAN_API_KEY ? `&apikey=${BSCSCAN_API_KEY}` : ''
    const url = `${BSCSCAN_API_BASE}?module=contract&action=getsourcecode&address=${address}${apiKeyParam}`
    const response = await fetch(url)
    const data = await response.json()
    if (data.status === '1' && Array.isArray(data.result) && data.result.length > 0) {
      const r = data.result[0]
      // BSCScan returns empty SourceCode for unverified contracts
      if (!r.SourceCode || r.SourceCode === '') return null
      return {
        sourceCode: r.SourceCode,
        contractName: r.ContractName || '',
        compilerVersion: r.CompilerVersion || '',
        optimizationUsed: r.OptimizationUsed === '1',
        runs: parseInt(r.Runs) || 0,
        evmVersion: r.EVMVersion || '',
        licenseType: r.LicenseType || '',
        proxy: r.Proxy === '1',
        implementation: r.Implementation || '',
      }
    }
    return null
  } catch {
    return null
  }
}

export async function analyzeWallet(address: string): Promise<WalletAnalysisData> {
  const [
    bnbResult,
    tokensResult,
    txCountResult,
    isContractResult,
    recentTxResult,
    reputationResult,
    firstTxResult,
  ] = await Promise.allSettled([
    getBNBBalance(address),
    getAllTokenBalances(address),
    getTransactionCount(address),
    isContractAddress(address),
    getRecentTransactions(address),
    getOnchainReputation(address),
    getFirstTxTimestamp(address),
  ])

  const recentTxs =
    recentTxResult.status === 'fulfilled' ? recentTxResult.value : []

  // Use dedicated first-tx fetch; fallback to earliest in recent list
  let firstTxTimestamp: number | null =
    firstTxResult.status === 'fulfilled' ? firstTxResult.value : null
  if (!firstTxTimestamp && recentTxs.length > 0) {
    const timestamps = recentTxs.map((tx) => parseInt(tx.timeStamp))
    firstTxTimestamp = Math.min(...timestamps)
  }

  const isContract = isContractResult.status === 'fulfilled' ? isContractResult.value : false

  // Fetch contract source code if this is a smart contract
  let contractSource: ContractSourceData | null = null
  if (isContract) {
    contractSource = await getContractSourceCode(address)
  }

  return {
    address,
    bnbBalance: bnbResult.status === 'fulfilled' ? bnbResult.value : '0',
    tokenBalances: tokensResult.status === 'fulfilled' ? tokensResult.value : [],
    transactionCount: txCountResult.status === 'fulfilled' ? txCountResult.value : 0,
    isContract,
    recentTransactions: recentTxs,
    reputation: reputationResult.status === 'fulfilled' ? reputationResult.value : null,
    firstTxTimestamp,
    contractSource,
  }
}
