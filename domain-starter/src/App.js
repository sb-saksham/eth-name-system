import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';

import domains from './utils/Domains.json';
import './styles/App.css';
import polygonLogo from './assets/polygonlogo.png';
import ethLogo from './assets/ethlogo.png';
import { networks } from './utils/networks'

// Constants
const tld = '.sb';
const CONTRACT_ADDRESS = '0x536BE7a3a922B9C2E2b7AB728e936D7ce645C580';



const App = () => {
	const [currentAccount, setCurrentAccount] = useState('');
	const [domain, setDomain] = useState('');
	const [record, setRecord] = useState('');
	const [loading, setLoading] = useState(false);
	const [editing, setEditing] = useState(false);
	const [network, setNetwork] = useState('');
	const [mints, setMints] = useState('');

	const connectWallet = async () => {
		try {
			const { ethereum } = window;
			if (!ethereum) {
				alert({
					message: "Please Install Metamask Boi!! https://metamask.io",
					type: 'error'
				});
				return;
			} 
			const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
			console.log("Connected");
			setCurrentAccount(accounts[0]);
		} catch (error) {
			alert({
				message: error.message,
				type: 'error',
			});
		}
	}
	const checkIfWalletIsConnected = async () => {
		const { ethereum } = window;
		if (!ethereum) {
			console.log("Make sure you have Metamask Installed!");
			return;
		} else {
			console.log("We have ethereum object", ethereum);
		}
		const accounts = await ethereum.request({ method: 'eth_accounts' });
		if (accounts.length !== 0) {
			const account = accounts[0];
			console.log('Found an authorized account: ', account);
			setCurrentAccount(account);
		} else {
			console.log('No authorized account found!');
		}

		const chainId = await ethereum.request({ method: 'eth_chainId' });
		setNetwork(networks[chainId]);
		ethereum.on('chainChanged', handleChainChanged);
		function handleChainChanged(_chainId) {
			window.location.reload();
		}
	}
	const renderNotConnectedContainer = () => (
		<div className="connect-wallet-container">
		  <img src="https://media.giphy.com/media/3ohhwytHcusSCXXOUg/giphy.gif" alt="Ninja gif" />
		  <button onClick={connectWallet} className="cta-button connect-wallet-button">
			Connect Wallet
		  </button>
		</div>
	);
	const switchNetwork = async () => {
		if (window.ethereum) {
			try {
				await window.ethereum.request({
					method: 'wallet_switchEthereumChain',
					params: [{ chainId: '0x13881' }], //polygon testnet id in hexadecimal
				});
			} catch (error) {
				if (error.code === 4902) {
					//not have polygon testnetwork as a chain
					try {
						await window.ethereum.request({
							method: 'wallet_addEthereumChain',
							params: [{
								chainId: '0x13881',
								chainName: 'Polygon Mumbai Testnet',
								rpcUrls: ['https://rpc-mumbai.maticvigil.com/'],
								nativeCurrency: {
									name: 'Mumbai Matic',
									symbol: 'Matic',
									decimals: 18
								},
								blockExplorerUrls: ['https://mumbai.polygonscan.com/']
							}],
						})
					} catch (error) {
						console.log(error);
					}
				}
				console.log(error);
			}
		} else {
			alert("Please Install Metamask boi!")
		}
	}
	const mintDomain = async () => {
		if (!domain) { return }
		if (domain.length < 3) {
			alert({
				message: "Domain must be atleast three characters long!",
				type: 'error'
			});
			return;
		}
		setLoading(true);
		const price = domain.length === 3 ? '0.501' : domain.length === 4 ? '0.301' : '0.101';
		const { ethereum } = window;
		if (ethereum) {
			const provider = new ethers.providers.Web3Provider(ethereum);
			//get signers
			const signer = provider.getSigner();
			const domainContract = new ethers.Contract(CONTRACT_ADDRESS, domains.abi, signer);
			try {
				let tx = await domainContract.register(domain, { value: ethers.utils.parseEther(price) });
				const reciept = await tx.wait();
				if (reciept.status === 1) {
					console.log(`${domain}.sb minted successfully. Take a look at https://mumbai.polygonscan.com/tx/${tx.hash}`);
					tx = await domainContract.setRecord(domain, record);
					await tx.wait();
					console.log(`Record for ${domain}.sb minted set successfully. Take a look at https://mumbai.polygonscan.com/`);
					setDomain('');
					setRecord('');
					setTimeout(() => {
						fetchMints();
					}, 2000);
					setLoading(false);
				}
				else {
					alert({
						message: "Transaction failed! Please try again!",
						type: 'error',
					});
					setLoading(false);
				}
			} catch (error) {
				// alert({ message: error, type: 'error' });
				console.log(error);
				setLoading(false);
			}
		}
	}
	const fetchMints = async () => {
		try {
			const { ethereum } = window;
			if (ethereum) {
				const provider = new ethers.providers.Web3Provider(ethereum);
				const signer = provider.getSigner();
				const contract = new ethers.Contract(CONTRACT_ADDRESS, domains.abi, signer);
				console.log("before getting all names");
				const names = await contract.getAllNames();
				
				const mintRecords = await Promise.all(names.map(async (name) => {
					const mintRecord = await contract.records(name);
					const owner = await contract.domains(name);
					return {
						id: names.indexOf(name),
						name: name,
						record: mintRecord,
						owner: owner
					}
				}));
				setMints(mintRecords);
			} else {
				alert("Metamask not installed. Install it boi!!")
			}
		} catch (error) {
			console.log("Error inside this fetchmints block: "+error);
		}
	}
	useEffect(() => {
		if (network === 'Polygon Mumbai Testnet') {
			fetchMints();
		}

	}, [currentAccount, network]);
	const updateDomain = async () => {
		if (!record || !domain) { return }
		setLoading(true);
		console.log(`Updating ${domain} with record ${record}`);
		try {
			const { ethereum } = window;
			if (ethereum) {
				const provider = new ethers.providers.Web3Provider(ethereum);
				const signer = provider.getSigner();
				const contract = new ethers.Contract(CONTRACT_ADDRESS, domains.abi, signer);

				let tx = await contract.setRecord(domain, record);
				await tx.wait();
				console.log("Record set for domain! Check at https://mumbai.polygonscan.com/tx/" + tx.hash);
				fetchMints();
				setRecord('');
				setDomain('');
				setEditing(false);
			}
		} catch (error) {
			console.log(error);
		}
		setLoading(false);
	}
	const renderInputForm = () => {
		if (network !== 'Polygon Mumbai Testnet') {
			return (
				<div className="connect-wallet-container">
					<h2>Please switch to Polygon Mumbai Testnet</h2>
					{/* This button will call our switch network function */}
					<button className='cta-button mint-button' onClick={switchNetwork}>Click here to switch</button>
				</div>
			);
		}
		return (
			<div className='form-container'>
				<div className='first-row'>
					<input
						type="text"
						value={domain}
						placeholder="DOMAIN"
						onChange={e => setDomain(e.target.value)}
					/>
					<p className='tld'> {tld} </p>
				</div>
				<input
					type="text"
					value={record}
					placeholder="StoreSomething"
					onChange={e => setRecord(e.target.value)}
				/>
				{editing ? (
					<div className='button-container'>
						<button className='cta-button mint-button' disabled={loading} onClick={updateDomain}>
							Set Record
						</button>
						<button className='cta-button mint-button' onClick={() => { setEditing(false); setDomain('')}}>
							Cancel
						</button>
					</div>
				) : (
					<button className='cta-button mint-button' disabled={loading} onClick={mintDomain}>
						Mint
					</button>
				)}
			</div>
		);
	}
	const editRecord = (name) => {
		setEditing(true);
		setDomain(name);
	}
	const renderMints = () => {
		if (currentAccount && mints.length > 0) {
			return (
				<div className='mint-container'>
					<p className='subtitle'>Recently Minted domains!</p>
					<div className='mint-list'>
						{mints.map((mint, index) => {
							return (
								<div className='mint-item' key={index}>
									<div className='mint-row'>
										<a className='link' href={`https://testnets.opensea.io/assets/mumbai/${CONTRACT_ADDRESS}/${mint.id}/`} target='_blank' rel='noopener noreferrer'>
											<p className='underlined'>{' '}{mint.name}{tld}{' '}</p>
										</a>
										{
											mint.owner.toLowerCase() === currentAccount.toLowerCase()
												? 
												<button className='edit-button' onClick={()=>editRecord(mint.name)}>
													<img className="edit-icon" src="https://img.icons8.com/metro/26/000000/pencil.png" alt="Edit button" />
												</button>
												:
												null
										}
									</div>
									<p>{mint.record}</p>
								</div>
							)
						})}
					</div>
				</div>
			);
		}
	};
	useEffect(() => {
		checkIfWalletIsConnected();
	}, []);
	return (
		<div className="App">
		  <div className="container">
			<div className="header-container">
			  <header>
					<div className="left">
						<p className="title">Polygon Name Service</p>
						<p className="subtitle">blockchain huh!</p>
					</div>
						<div className='right'>
							<img alt="Network logo" className="logo" src={ network.includes('Polygon') ? polygonLogo : ethLogo } />
							{currentAccount ? <p> Wallet: {currentAccount.slice(0, 6)}...{ currentAccount.slice(-4)}</p> : <p>Not Connected</p>}
						</div>		
			  </header>
			</div>
	
			{/* Add your render method here */}
				{!currentAccount && renderNotConnectedContainer()}
				{currentAccount && renderInputForm()}
				{mints && renderMints()}
		  </div>
		</div>
	  );
}

export default App;