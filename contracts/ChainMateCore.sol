// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ChainMateCore
 * @dev Core contract for ChainMate - AI-powered crypto transaction automation on BSC
 * Handles scheduled payments, conditional transfers, and transaction management
 */
contract ChainMateCore is Ownable, ReentrancyGuard {

    struct ScheduledPayment {
        address from;
        address to;
        address token;
        uint256 amount;
        uint256 executeAt;
        bool executed;
        bool cancelled;
        string memo;
    }

    struct ConditionalPayment {
        address from;
        address to;
        address token;
        uint256 amount;
        uint256 priceThreshold;
        bool isAboveThreshold; // true if price must be above, false if below
        bool executed;
        bool cancelled;
        string memo;
    }

    struct Contact {
        string name;
        address walletAddress;
        bool verified;
        uint256 addedAt;
    }

    struct Team {
        string name;
        address creator;
        address[] members;
        uint256 requiredApprovals;
        bool active;
    }

    struct TeamTransaction {
        uint256 teamId;
        address initiator;
        address to;
        address token;
        uint256 amount;
        uint256 approvalCount;
        mapping(address => bool) approvals;
        bool executed;
        bool cancelled;
        string memo;
    }

    
    uint256 public scheduledPaymentCount;
    uint256 public conditionalPaymentCount;
    uint256 public teamCount;
    uint256 public teamTransactionCount;

    mapping(uint256 => ScheduledPayment) public scheduledPayments;
    mapping(uint256 => ConditionalPayment) public conditionalPayments;
    mapping(address => mapping(uint256 => Contact)) public userContacts;
    mapping(address => uint256) public userContactCount;
    mapping(uint256 => Team) public teams;
    mapping(uint256 => TeamTransaction) public teamTransactions;
    mapping(address => uint256[]) public userScheduledPayments;
    mapping(address => uint256[]) public userConditionalPayments;
    mapping(address => uint256[]) public userTeams;

    
    mapping(address => uint256) public userTransactionCount;
    mapping(address => mapping(uint256 => bytes32)) public userTransactionHashes;

    
    mapping(address => uint256) public addressTransactionCount;
    mapping(address => bool) public flaggedAddresses;

    
    event ScheduledPaymentCreated(uint256 indexed paymentId, address indexed from, address indexed to, uint256 executeAt);
    event ScheduledPaymentExecuted(uint256 indexed paymentId);
    event ScheduledPaymentCancelled(uint256 indexed paymentId);

    event ConditionalPaymentCreated(uint256 indexed paymentId, address indexed from, address indexed to);
    event ConditionalPaymentExecuted(uint256 indexed paymentId);
    event ConditionalPaymentCancelled(uint256 indexed paymentId);

    event ContactAdded(address indexed user, string name, address indexed contactAddress);
    event ContactVerified(address indexed user, address indexed contactAddress);

    event TeamCreated(uint256 indexed teamId, string name, address indexed creator);
    event TeamMemberAdded(uint256 indexed teamId, address indexed member);
    event TeamTransactionCreated(uint256 indexed transactionId, uint256 indexed teamId);
    event TeamTransactionApproved(uint256 indexed transactionId, address indexed approver);
    event TeamTransactionExecuted(uint256 indexed transactionId);

    event TransactionRecorded(address indexed from, address indexed to, uint256 amount, bytes32 txHash);
    event AddressFlagged(address indexed flaggedAddress, string reason);

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Create a scheduled payment to be executed at a future time
     */
    function createScheduledPayment(
        address to,
        address token,
        uint256 amount,
        uint256 executeAt,
        string memory memo
    ) external returns (uint256) {
        require(to != address(0), "Invalid recipient");
        require(executeAt > block.timestamp, "Execution time must be in future");
        require(amount > 0, "Amount must be greater than 0");

        uint256 paymentId = scheduledPaymentCount++;

        scheduledPayments[paymentId] = ScheduledPayment({
            from: msg.sender,
            to: to,
            token: token,
            amount: amount,
            executeAt: executeAt,
            executed: false,
            cancelled: false,
            memo: memo
        });

        userScheduledPayments[msg.sender].push(paymentId);

        emit ScheduledPaymentCreated(paymentId, msg.sender, to, executeAt);

        return paymentId;
    }

    /**
     * @dev Execute a scheduled payment
     */
    function executeScheduledPayment(uint256 paymentId) external nonReentrant {
        ScheduledPayment storage payment = scheduledPayments[paymentId];

        require(!payment.executed, "Payment already executed");
        require(!payment.cancelled, "Payment cancelled");
        require(block.timestamp >= payment.executeAt, "Execution time not reached");
        require(msg.sender == payment.from || msg.sender == owner(), "Not authorized");

        payment.executed = true;

        if (payment.token == address(0)) {
            
            (bool success, ) = payment.to.call{value: payment.amount}("");
            require(success, "Transfer failed");
        } else {
            
            IERC20(payment.token).transferFrom(payment.from, payment.to, payment.amount);
        }

        _recordTransaction(payment.from, payment.to, payment.amount);

        emit ScheduledPaymentExecuted(paymentId);
    }

    /**
     * @dev Cancel a scheduled payment
     */
    function cancelScheduledPayment(uint256 paymentId) external {
        ScheduledPayment storage payment = scheduledPayments[paymentId];

        require(msg.sender == payment.from, "Only creator can cancel");
        require(!payment.executed, "Payment already executed");
        require(!payment.cancelled, "Payment already cancelled");

        payment.cancelled = true;

        emit ScheduledPaymentCancelled(paymentId);
    }

    /**
     * @dev Create a conditional payment based on price threshold
     */
    function createConditionalPayment(
        address to,
        address token,
        uint256 amount,
        uint256 priceThreshold,
        bool isAboveThreshold,
        string memory memo
    ) external returns (uint256) {
        require(to != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be greater than 0");

        uint256 paymentId = conditionalPaymentCount++;

        conditionalPayments[paymentId] = ConditionalPayment({
            from: msg.sender,
            to: to,
            token: token,
            amount: amount,
            priceThreshold: priceThreshold,
            isAboveThreshold: isAboveThreshold,
            executed: false,
            cancelled: false,
            memo: memo
        });

        userConditionalPayments[msg.sender].push(paymentId);

        emit ConditionalPaymentCreated(paymentId, msg.sender, to);

        return paymentId;
    }

    /**
     * @dev Execute conditional payment (price check done off-chain via oracle/API)
     */
    function executeConditionalPayment(uint256 paymentId, bool conditionMet) external nonReentrant {
        ConditionalPayment storage payment = conditionalPayments[paymentId];

        require(!payment.executed, "Payment already executed");
        require(!payment.cancelled, "Payment cancelled");
        require(msg.sender == payment.from || msg.sender == owner(), "Not authorized");
        require(conditionMet, "Condition not met");

        payment.executed = true;

        if (payment.token == address(0)) {
            (bool success, ) = payment.to.call{value: payment.amount}("");
            require(success, "Transfer failed");
        } else {
            IERC20(payment.token).transferFrom(payment.from, payment.to, payment.amount);
        }

        _recordTransaction(payment.from, payment.to, payment.amount);

        emit ConditionalPaymentExecuted(paymentId);
    }

    /**
     * @dev Add a contact
     */
    function addContact(string memory name, address contactAddress) external {
        require(contactAddress != address(0), "Invalid address");

        uint256 contactId = userContactCount[msg.sender]++;

        userContacts[msg.sender][contactId] = Contact({
            name: name,
            walletAddress: contactAddress,
            verified: false,
            addedAt: block.timestamp
        });

        emit ContactAdded(msg.sender, name, contactAddress);
    }

    /**
     * @dev Verify a contact address
     */
    function verifyContact(uint256 contactId) external {
        Contact storage contact = userContacts[msg.sender][contactId];
        require(contact.walletAddress != address(0), "Contact does not exist");

        contact.verified = true;

        emit ContactVerified(msg.sender, contact.walletAddress);
    }

    /**
     * @dev Create a team
     */
    function createTeam(
        string memory name,
        address[] memory members,
        uint256 requiredApprovals
    ) external returns (uint256) {
        require(members.length > 0, "Team must have members");
        require(requiredApprovals > 0 && requiredApprovals <= members.length, "Invalid approval count");

        uint256 teamId = teamCount++;

        Team storage newTeam = teams[teamId];
        newTeam.name = name;
        newTeam.creator = msg.sender;
        newTeam.requiredApprovals = requiredApprovals;
        newTeam.active = true;

        for (uint256 i = 0; i < members.length; i++) {
            newTeam.members.push(members[i]);
            userTeams[members[i]].push(teamId);
        }

        emit TeamCreated(teamId, name, msg.sender);

        return teamId;
    }

    /**
     * @dev Create a team transaction requiring approvals
     */
    function createTeamTransaction(
        uint256 teamId,
        address to,
        address token,
        uint256 amount,
        string memory memo
    ) external returns (uint256) {
        Team storage team = teams[teamId];
        require(team.active, "Team not active");
        require(_isTeamMember(teamId, msg.sender), "Not a team member");

        uint256 txId = teamTransactionCount++;

        TeamTransaction storage teamTx = teamTransactions[txId];
        teamTx.teamId = teamId;
        teamTx.initiator = msg.sender;
        teamTx.to = to;
        teamTx.token = token;
        teamTx.amount = amount;
        teamTx.approvalCount = 0;
        teamTx.executed = false;
        teamTx.cancelled = false;
        teamTx.memo = memo;

        emit TeamTransactionCreated(txId, teamId);

        return txId;
    }

    /**
     * @dev Approve a team transaction
     */
    function approveTeamTransaction(uint256 txId) external {
        TeamTransaction storage teamTx = teamTransactions[txId];
        Team storage team = teams[teamTx.teamId];

        require(team.active, "Team not active");
        require(_isTeamMember(teamTx.teamId, msg.sender), "Not a team member");
        require(!teamTx.approvals[msg.sender], "Already approved");
        require(!teamTx.executed, "Already executed");
        require(!teamTx.cancelled, "Transaction cancelled");

        teamTx.approvals[msg.sender] = true;
        teamTx.approvalCount++;

        emit TeamTransactionApproved(txId, msg.sender);

        
        if (teamTx.approvalCount >= team.requiredApprovals) {
            _executeTeamTransaction(txId);
        }
    }

    /**
     * @dev Execute team transaction
     */
    function _executeTeamTransaction(uint256 txId) internal nonReentrant {
        TeamTransaction storage teamTx = teamTransactions[txId];

        require(!teamTx.executed, "Already executed");
        teamTx.executed = true;

        if (teamTx.token == address(0)) {
            (bool success, ) = teamTx.to.call{value: teamTx.amount}("");
            require(success, "Transfer failed");
        } else {
            IERC20(teamTx.token).transferFrom(teamTx.initiator, teamTx.to, teamTx.amount);
        }

        _recordTransaction(teamTx.initiator, teamTx.to, teamTx.amount);

        emit TeamTransactionExecuted(txId);
    }

    /**
     * @dev Check if address is team member
     */
    function _isTeamMember(uint256 teamId, address user) internal view returns (bool) {
        Team storage team = teams[teamId];
        for (uint256 i = 0; i < team.members.length; i++) {
            if (team.members[i] == user) {
                return true;
            }
        }
        return false;
    }

    /**
     * @dev Record transaction for analytics
     */
    function _recordTransaction(address from, address to, uint256 amount) internal {
        bytes32 txHash = keccak256(abi.encodePacked(from, to, amount, block.timestamp));

        uint256 txIndex = userTransactionCount[from]++;
        userTransactionHashes[from][txIndex] = txHash;

        addressTransactionCount[to]++;

        emit TransactionRecorded(from, to, amount, txHash);
    }

    /**
     * @dev Flag suspicious address
     */
    function flagAddress(address suspiciousAddress, string memory reason) external onlyOwner {
        flaggedAddresses[suspiciousAddress] = true;
        emit AddressFlagged(suspiciousAddress, reason);
    }

    /**
     * @dev Get address reputation score (simple implementation)
     */
    function getAddressReputation(address addr) external view returns (uint256, bool) {
        return (addressTransactionCount[addr], flaggedAddresses[addr]);
    }

    /**
     * @dev Get user's scheduled payments
     */
    function getUserScheduledPayments(address user) external view returns (uint256[] memory) {
        return userScheduledPayments[user];
    }

    /**
     * @dev Get user's conditional payments
     */
    function getUserConditionalPayments(address user) external view returns (uint256[] memory) {
        return userConditionalPayments[user];
    }

    /**
     * @dev Get user's teams
     */
    function getUserTeams(address user) external view returns (uint256[] memory) {
        return userTeams[user];
    }

    /**
     * @dev Get team members
     */
    function getTeamMembers(uint256 teamId) external view returns (address[] memory) {
        return teams[teamId].members;
    }

    
    receive() external payable {}
}
