const main = async () => {
    const [owner, randomPersonAcc] = await hre.ethers.getSigners();
    const domainContractFactory = await hre.ethers.getContractFactory('Domains');
    const domainContract = await domainContractFactory.deploy("sb");
    await domainContract.deployed();
    // console.log("Contract address: ", domainContract.address);
    // console.log("Contract deployed by(owner): ", owner.address);

    let txn = await domainContract.register("boom", {value: hre.ethers.utils.parseEther('1000')});
    await txn.wait();

    txn = await domainContract.register("zoom", {value: hre.ethers.utils.parseEther('1000')});
    await txn.wait();

    const allNammes = await domainContract.getAllNames();
    console.log(allNammes);
    // let contractBalance = await hre.ethers.provider.getBalance(domainContract.address);
    // console.log("Contract Balance before Withdrawing: ", hre.ethers.utils.formatEther(contractBalance));
    
    // let ownerBalance = await hre.ethers.provider.getBalance(owner.address);
    // console.log("Owner Balance before Withdrawing: ", hre.ethers.utils.formatEther(ownerBalance));
    // try {
    //     const shouldFail = await domainContract.connect(randomPersonAcc).withdraw();
    //     await shouldFail.wait()
    // } catch (error) {
    //     console.log("So hard to withdraw FUnds!!");
    // }

    // const withdrawTxn = await domainContract.connect(owner).withdraw();
    // await withdrawTxn.wait();

    // contractBalance = await hre.ethers.provider.getBalance(domainContract.address);
    // console.log("Contract Balance After Withdrawing: ", hre.ethers.utils.formatEther(contractBalance));
    
    // ownerBalance = await hre.ethers.provider.getBalance(owner.address);
    // console.log("Owner Balance After Withdrawing: ", hre.ethers.utils.formatEther(ownerBalance));
}
const runMain = async () => {
    try {
        await main();
        process.exit(0);
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
}

runMain();