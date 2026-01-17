"use client";

import { useEffect, useState } from "react";
import { usePublicClient } from "wagmi";
import deployedContracts from "~~/contracts/deployedContracts";
import scaffoldConfig from "~~/scaffold.config";

type ContractName = keyof (typeof deployedContracts)[31337];

export interface DeployedContractInfo {
  address: `0x${string}`;
  abi: readonly any[];
}

export function useDeployedContractInfo(contractName: string) {
  const [contractInfo, setContractInfo] = useState<DeployedContractInfo | null>(null);
  const publicClient = usePublicClient();

  useEffect(() => {
    const chainId = publicClient?.chain?.id;
    if (!chainId) return;

    const contracts = (deployedContracts as Record<number, Record<string, DeployedContractInfo>>)[chainId];
    if (!contracts) return;

    const contract = contracts[contractName];
    if (!contract) return;

    setContractInfo({
      address: contract.address,
      abi: contract.abi,
    });
  }, [contractName, publicClient?.chain?.id]);

  return { data: contractInfo };
}
