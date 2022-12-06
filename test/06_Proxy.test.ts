import { expect } from "chai";
import dotenv from "dotenv";
dotenv.config();
import { setupWallet, zkEVM_provider, ownerSigner } from "./utils/setupWallet";
import { ethers, Contract } from "ethers";
import { checkBalances } from "./utils/checkBalances";
import example_artifacts from "../artifacts/src/proxy_contracts/Example.sol/Example.json";
import proxy_artifacts from "../artifacts/src/proxy_contracts/ExampleProxy.sol/ExampleProxy.json";

describe("Proxy contract deployment & tests on zkEVM", async () => {
    // declare an instance of the contract to be deployed
    let exampleContract: any;
    let proxyContract: any;
    let writeAsProxy: any;
    // setup atleast 5 wallet addresses for testing

    const derivedNode = await setupWallet();
    before(async () => {
        console.log("\nAUTOMATE UNIT TEST CASES FOR PROXY CONTRACT\n");

        console.log("Checking if wallet addresses have any balance....");
        await checkBalances(derivedNode);

        console.log("\nDeploying proxy contract & its implementation on zkEVM chain....");

        // get the contract factory
        const Example = new ethers.ContractFactory(
            example_artifacts.abi,
            example_artifacts.bytecode,
            ownerSigner
        );
        const Proxy = new ethers.ContractFactory(proxy_artifacts.abi, proxy_artifacts.bytecode, ownerSigner);
        let example = await Example.deploy();
        await example.deployed();
        let proxy = await Proxy.deploy(example.address, "0x");
        await proxy.deployed();

        // get the instance of the deployed contract
        exampleContract = new Contract(example.address, example_artifacts.abi, zkEVM_provider);
        proxyContract = new Contract(proxy.address, example_artifacts.abi, zkEVM_provider);
        writeAsProxy = exampleContract.attach(proxyContract.address);

        console.log("\nImplementation contract deployed at: ", exampleContract.address);
        console.log("Proxy contract deployed at: ", proxyContract.address);
        console.log("\n");
    });

    describe("proxy contract functionalities tests", async () => {
        it("...can read function", async () => {
            expect(await proxyContract.getUint()).to.equal(0);
        });

        it("...can write function", async () => {
            const tx = await writeAsProxy.connect(ownerSigner).setUint("10");
            await tx.wait(1);
            expect(await proxyContract.getUint()).to.equal("10");
        });
    });
});
