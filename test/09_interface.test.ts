import { expect } from "chai";
import dotenv from "dotenv";
dotenv.config();
import { setupWallet, zkEVM_provider, ownerSigner } from "./utils/setupWallet";
import { ethers, Contract } from "ethers";
import { checkBalances } from "./utils/checkBalances";
import counter_artifacts from "../artifacts/src/interface.sol/Counter.json";
import myContract_artifacts from "../artifacts/src/interface.sol/MyContract.json";
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

describe("Interface contract deployment & tests on zkEVM", async () => {
    // declare an instance of the contract to be deployed
    let counter: any;
    let myContract: any;

    // setup atleast 5 wallet addresses for testing
    const derivedNode = await setupWallet();
    before(async () => {
        console.log("\nINTERFACE UNIT TEST CASES\n");

        // get the contract factory
        const counter_Factory = new ethers.ContractFactory(
            counter_artifacts.abi,
            counter_artifacts.bytecode,
            ownerSigner
        );
        const myContract_Factory = new ethers.ContractFactory(
            myContract_artifacts.abi,
            myContract_artifacts.bytecode,
            ownerSigner
        );

        console.log("Checking if wallet addresses have any balance....");
        await checkBalances(derivedNode);

        // deploy the contract
        const counter_contract = await counter_Factory.deploy();
        const myContract_contract = await myContract_Factory.deploy();

        // wait for the contract to get deployed
        await counter_contract.deployed();
        await myContract_contract.deployed();

        // get the instance of the deployed contract
        counter = new Contract(counter_contract.address, counter_artifacts.abi, zkEVM_provider);
        myContract = new Contract(myContract_contract.address, myContract_artifacts.abi, zkEVM_provider);

        console.log("\ncontract deployed at: ", myContract.address);
        console.log(`Contract Details: https://explorer.public.zkevm-test.net/address/${myContract.address}`);
        console.log("\n");
    });

    describe("interface contract functionalities tests", async () => {
        it("...can increment value", async () => {
            const tx = await myContract.connect(ownerSigner).incrementCounter(counter.address);
            await tx.wait(1);
            expect(await myContract.getCount(counter.address)).eq("1");
        });
    });
});
