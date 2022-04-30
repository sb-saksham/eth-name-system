const main = async () => {
    const domainContractFactory = await hre.ethers.getContractFactory('Domains');
    const domainContract = await domainContractFactory.deploy("sb");
    await domainContract.deployed();
  
    console.log("Contract deployed to:", domainContract.address);
  
    // CHANGE THIS DOMAIN TO SOMETHING ELSE! I don't want to see OpenSea full of bananas lol
    let txn = await domainContract.register("saksham",  {value: hre.ethers.utils.parseEther('0.2')});
    await txn.wait();
    console.log("Minted domain saksham.sb");
  
    txn = await domainContract.setRecord("saksham", "My name as an ENS domain");
    await txn.wait();
    console.log("Set record saksham.sb");
  
    const address = await domainContract.getAddress("saksham");
    console.log("Owner of domain saksham: ", address);
  
    const balance = await hre.ethers.provider.getBalance(domainContract.address);
    console.log("Contract balance: ", hre.ethers.utils.formatEther(balance));
  }
  
  const runMain = async () => {
    try {
      await main();
      process.exit(0);
    } catch (error) {
      console.log(error);
      process.exit(1);
    }
  };
  
  runMain();