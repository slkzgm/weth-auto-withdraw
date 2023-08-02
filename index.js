import * as dotenv from 'dotenv';
dotenv.config();

import {Contract, formatEther, JsonRpcProvider, parseEther, parseUnits, Wallet} from "ethers";

const ABI = [{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"balanceOf","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"wad","type":"uint256"}],"name":"withdraw","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"}];

const provider = new JsonRpcProvider(process.env.ETH_PROVIDER);
const wallet = new Wallet(process.env.PRIVATE_KEY, provider);
const wETHContract = new Contract('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', ABI, wallet);

const REFRESH_DELAY = 5; // REFRESH DELAY IN MINUTES
const BALANCE_MIN = parseEther('.1'); // MINIMUM BALANCE BEFORE WITHDRAW
const FEES_MAX = parseUnits('50', 'gwei'); // MAXIMUM NETWORK FEES TO WITHDRAW

async function check() {
    while (1) {
        const wETHBalance = await wETHContract.balanceOf(wallet.address);
        console.log(wETHBalance);
        if (wETHBalance >= BALANCE_MIN) {
            const baseFees = (await provider.getBlock()).baseFeePerGas;

            console.log(baseFees);
            if (baseFees >= FEES_MAX) {
                console.log('Network fees too high right now, waiting..');
            } else {
                console.log(`Withdrawing ${formatEther(wETHBalance)}..`);
                const tx = await wETHContract.withdraw(wETHBalance);
                console.log('waiting for the tx to be mined..');
                await tx.wait();
                console.log(`${formatEther(wETHBalance)} successfully withdrawn.`);
            }
        } else {
            console.log(`wETH balance under ${formatEther(BALANCE_MIN)}`);
        }
        await new Promise(resolve => setTimeout(resolve, REFRESH_DELAY * 60 * 1000));
    }
}

check();