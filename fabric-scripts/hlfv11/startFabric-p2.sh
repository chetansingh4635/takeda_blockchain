#!/bin/bash

# Exit on first error, print all commands.
set -e

Usage() {
	echo ""
	echo "Usage: ./startFabric.sh [-d || --dev]"
	echo ""
	echo "Options:"
	echo -e "\t-d or --dev: (Optional) enable fabric development mode"
	echo ""
	echo "Example: ./startFabric-p2.sh"
	echo ""
	exit 1
}

Parse_Arguments() {
	while [ $# -gt 0 ]; do
		case $1 in
			--help)
				HELPINFO=true
				;;
            --dev | -d)
				FABRIC_DEV_MODE=true
				;;
		esac
		shift
	done
}

Parse_Arguments $@

if [ "${HELPINFO}" == "true" ]; then
    Usage
fi

#Detect architecture
ARCH=`uname -m`

# Grab the current directory
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

if [ "${FABRIC_DEV_MODE}" == "true" ]; then
    DOCKER_FILE="${DIR}"/composer/docker-compose-dev.yml
else
    DOCKER_FILE="${DIR}"/composer/docker-compose-peer2.yml
fi

ARCH=$ARCH docker-compose -f "${DOCKER_FILE}" down
ARCH=$ARCH docker-compose -f "${DOCKER_FILE}" up -d

# wait for Hyperledger Fabric to start
# incase of errors when running later commands, issue export FABRIC_START_TIMEOUT=<larger number>
echo "sleeping for ${FABRIC_START_TIMEOUT} seconds to wait for fabric to complete start up"
sleep ${FABRIC_START_TIMEOUT}

# Create the channel
#docker exec peer0.takeda.tryme4u.com peer channel create -o orderer.tryme4u.com:7050 -c composerchannel -f /etc/hyperledger/configtx/composer-channel.tx

# Join peer0.takeda.tryme4u.com to the channel.
#docker exec -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@takeda.tryme4u.com/msp" peer0.takeda.tryme4u.com peer channel join -b composerchannel.block

# Join peer1 to channel
#docker exec -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@takeda.tryme4u.com/msp" peer1.takeda.tryme4u.com peer channel fetch config -o orderer.tryme4u.com:7050 -c composerchannel
#docker exec -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@takeda.tryme4u.com/msp" peer1.takeda.tryme4u.com peer channel join -b composerchannel_config.block

# Join peer2 to channel
docker exec -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@takeda.tryme4u.com/msp" peer2.takeda.tryme4u.com peer channel fetch config -o orderer.tryme4u.com:7050 -c composerchannel
docker exec -e "CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/msp/users/Admin@takeda.tryme4u.com/msp" peer2.takeda.tryme4u.com peer channel join -b composerchannel_config.block

if [ "${FABRIC_DEV_MODE}" == "true" ]; then
    echo "Fabric Network started in chaincode development mode"
fi
