import { useWallets } from '@privy-io/react-auth'
import { ethers } from 'ethers'
import { CONTRACTS } from '@/config/contracts'
import { toast } from 'sonner'

const CHAINMATE_CORE_ABI = [
  "function createScheduledPayment(address to, address token, uint256 amount, uint256 executeAt, string memory memo) external returns (uint256)",
  "function executeScheduledPayment(uint256 paymentId) external",
  "function cancelScheduledPayment(uint256 paymentId) external",
  "function createConditionalPayment(address to, address token, uint256 amount, uint256 priceThreshold, bool isAboveThreshold, string memory memo) external returns (uint256)",
  "function addContact(string memory name, address contactAddress) external",
  "function verifyContact(uint256 contactId) external",
  "function createTeam(string memory name, address[] memory members, uint256 requiredApprovals) external returns (uint256)",
  "function getUserScheduledPayments(address user) external view returns (uint256[] memory)",
  "function getUserConditionalPayments(address user) external view returns (uint256[] memory)",
  "function getAddressReputation(address addr) external view returns (uint256, bool)",
  "function scheduledPayments(uint256) external view returns (address from, address to, address token, uint256 amount, uint256 executeAt, bool executed, bool cancelled, string memory memo)",
  "function userContactCount(address) external view returns (uint256)",
  "function userContacts(address, uint256) external view returns (string memory name, address walletAddress, bool verified, uint256 addedAt)"
]

const CHAINMATE_TOKEN_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function faucet() external",
  "function decimals() external view returns (uint8)"
]

export function useChainMateContract() {
  const { wallets } = useWallets()
  const wallet = wallets[0]

  const getProvider = async () => {
    if (!wallet) throw new Error('Wallet not connected')
    const provider = await wallet.getEthersProvider()
    return provider
  }

  const getSigner = async () => {
    const provider = await getProvider()
    return provider.getSigner()
  }

  const getCoreContract = async () => {
    const signer = await getSigner()
    return new ethers.Contract(CONTRACTS.CHAINMATE_CORE, CHAINMATE_CORE_ABI, signer)
  }

  const getTokenContract = async () => {
    const signer = await getSigner()
    return new ethers.Contract(CONTRACTS.CHAINMATE_TOKEN, CHAINMATE_TOKEN_ABI, signer)
  }

  const sendTransaction = async (to: string, amount: string) => {
    try {
      const signer = await getSigner()
      const tx = await signer.sendTransaction({
        to,
        value: ethers.parseEther(amount),
      })

      toast.success('Transaction submitted!')
      await tx.wait()
      toast.success('Transaction confirmed!')

      return tx.hash
    } catch (error: any) {
      console.error('Transaction error:', error)
      toast.error(error.message || 'Transaction failed')
      throw error
    }
  }

  const sendToken = async (to: string, amount: string, tokenAddress: string) => {
    try {
      const signer = await getSigner()
      const tokenContract = new ethers.Contract(
        tokenAddress,
        ['function transfer(address to, uint256 amount) external returns (bool)', 'function decimals() external view returns (uint8)'],
        signer
      )

      const decimals = await tokenContract.decimals()
      const amountInWei = ethers.parseUnits(amount, decimals)

      const tx = await tokenContract.transfer(to, amountInWei)

      toast.success('Token transfer submitted!')
      await tx.wait()
      toast.success('Token transfer confirmed!')

      return tx.hash
    } catch (error: any) {
      console.error('Token transfer error:', error)
      toast.error(error.message || 'Token transfer failed')
      throw error
    }
  }

  const schedulePayment = async (
    to: string,
    token: string,
    amount: string,
    executeAt: number,
    memo: string
  ) => {
    try {
      const contract = await getCoreContract()
      const amountInWei = token === ethers.ZeroAddress
        ? ethers.parseEther(amount)
        : ethers.parseUnits(amount, 18)

      const tx = await contract.createScheduledPayment(to, token, amountInWei, executeAt, memo)

      toast.success('Scheduled payment created!')
      const receipt = await tx.wait()
      toast.success('Payment scheduled successfully!')

      return receipt.hash
    } catch (error: any) {
      console.error('Schedule payment error:', error)
      toast.error(error.message || 'Failed to schedule payment')
      throw error
    }
  }

  const createConditionalPayment = async (
    to: string,
    token: string,
    amount: string,
    priceThreshold: string,
    isAboveThreshold: boolean,
    memo: string
  ) => {
    try {
      const contract = await getCoreContract()
      const amountInWei = ethers.parseEther(amount)
      const thresholdInWei = ethers.parseEther(priceThreshold)

      const tx = await contract.createConditionalPayment(
        to,
        token,
        amountInWei,
        thresholdInWei,
        isAboveThreshold,
        memo
      )

      toast.success('Conditional payment created!')
      await tx.wait()
      toast.success('Payment condition set successfully!')

      return tx.hash
    } catch (error: any) {
      console.error('Conditional payment error:', error)
      toast.error(error.message || 'Failed to create conditional payment')
      throw error
    }
  }

  const addContact = async (name: string, address: string) => {
    try {
      const contract = await getCoreContract()
      const tx = await contract.addContact(name, address)

      toast.success('Adding contact...')
      await tx.wait()
      toast.success(`Contact "${name}" added successfully!`)

      return tx.hash
    } catch (error: any) {
      console.error('Add contact error:', error)
      toast.error(error.message || 'Failed to add contact')
      throw error
    }
  }

  const getBalance = async (address: string) => {
    try {
      const provider = await getProvider()
      const balance = await provider.getBalance(address)
      return ethers.formatEther(balance)
    } catch (error) {
      console.error('Get balance error:', error)
      return '0'
    }
  }

  const getTokenBalance = async (tokenAddress: string, userAddress: string) => {
    try {
      const provider = await getProvider()
      const tokenContract = new ethers.Contract(
        tokenAddress,
        ['function balanceOf(address) view returns (uint256)', 'function decimals() view returns (uint8)'],
        provider
      )

      const balance = await tokenContract.balanceOf(userAddress)
      const decimals = await tokenContract.decimals()
      return ethers.formatUnits(balance, decimals)
    } catch (error) {
      console.error('Get token balance error:', error)
      return '0'
    }
  }

  const claimFromFaucet = async () => {
    try {
      const contract = await getTokenContract()
      const tx = await contract.faucet()

      toast.success('Claiming tokens from faucet...')
      await tx.wait()
      toast.success('100 CMT tokens claimed successfully!')

      return tx.hash
    } catch (error: any) {
      console.error('Faucet claim error:', error)
      toast.error(error.message || 'Failed to claim from faucet')
      throw error
    }
  }

  const getAddressReputation = async (address: string) => {
    try {
      const contract = await getCoreContract()
      const [txCount, isFlagged] = await contract.getAddressReputation(address)
      return {
        transactionCount: Number(txCount),
        isFlagged,
        riskLevel: isFlagged ? 'high' : txCount > 100 ? 'low' : 'medium'
      }
    } catch (error) {
      console.error('Get reputation error:', error)
      return { transactionCount: 0, isFlagged: false, riskLevel: 'unknown' }
    }
  }

  return {
    sendTransaction,
    sendToken,
    schedulePayment,
    createConditionalPayment,
    addContact,
    getBalance,
    getTokenBalance,
    claimFromFaucet,
    getAddressReputation,
  }
}
