#!/bin/bash

Usage() {
	echo ""
	echo "Usage: ./createPeerAdminCard.sh [-h host] [-n]"
	echo ""
	echo "Options:"
	echo -e "\t-h or --host:\t\t(Optional) name of the host to specify in the connection profile"
	echo -e "\t-n or --noimport:\t(Optional) don't import into card store"
	echo ""
	echo "Example: ./createPeerAdminCard.sh"
	echo ""
	exit 1
}

Parse_Arguments() {
	while [ $# -gt 0 ]; do
		case $1 in
			--help)
				HELPINFO=true
				;;
			--host | -h)
                shift
				HOST="$1"
				;;
            --noimport | -n)
				NOIMPORT=true
				;;
		esac
		shift
	done
}

HOST=10.0.0.8
HOST1=10.0.0.9
HOST2=10.0.0.10
Parse_Arguments $@

if [ "${HELPINFO}" == "true" ]; then
    Usage
fi

# Grab the current directory
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

if [ -z "${HL_COMPOSER_CLI}" ]; then
  HL_COMPOSER_CLI=$(which composer)
fi

echo
# check that the composer command exists at a version >v0.16
COMPOSER_VERSION=$("${HL_COMPOSER_CLI}" --version 2>/dev/null)
COMPOSER_RC=$?

if [ $COMPOSER_RC -eq 0 ]; then
    AWKRET=$(echo $COMPOSER_VERSION | awk -F. '{if ($2<19) print "1"; else print "0";}')
    if [ $AWKRET -eq 1 ]; then
        echo Cannot use $COMPOSER_VERSION version of composer with fabric 1.1, v0.19 or higher is required
        exit 1
    else
        echo Using composer-cli at $COMPOSER_VERSION
    fi
else
    echo 'No version of composer-cli has been detected, you need to install composer-cli at v0.19 or higher'
    exit 1
fi

cat << EOF > DevServer_connection.json
{
    "name": "Tryme4u",
    "x-type": "hlfv1",
    "x-commitTimeout": 300,
    "version": "1.0.0",
    "client": {
        "organization": "Takeda",
        "connection": {
            "timeout": {
                "peer": {
                    "endorser": "300",
                    "eventHub": "300",
                    "eventReg": "300"
                },
                "orderer": "300"
            }
        }
    },
    "channels": {
        "composerchannel": {
            "orderers": [
                "orderer.tryme4u.com"
            ],
            "peers": {
                "peer0.takeda.tryme4u.com": {
                    "endorsingPeer": true,
                    "chaincodeQuery": true,
                    "ledgerQuery": true,
                    "eventSource": true
                },
                "peer1.takeda.tryme4u.com": {
                    "endorsingPeer": false,
                    "chaincodeQuery": true,
                    "ledgerQuery": true,
                    "eventSource": true
                },
                "peer2.takeda.tryme4u.com": {
                    "endorsingPeer": false,
                    "chaincodeQuery": true,
                    "ledgerQuery": true,
                    "eventSource": true
                }
            }
        }
    },
    "organizations": {
        "Takeda": {
            "mspid": "TakedaMSP",
            "peers": [
                "peer0.takeda.tryme4u.com",
		"peer1.takeda.tryme4u.com",
		"peer2.takeda.tryme4u.com"
            ],
            "certificateAuthorities": [
                "ca.takeda.tryme4u.com"
            ]
        }
    },
    "orderers": {
        "orderer.tryme4u.com": {
            "url": "grpc://${HOST}:7050"
        }
    },
    "peers": {
        "peer0.takeda.tryme4u.com": {
            "url": "grpc://${HOST}:7051",
            "eventUrl": "grpc://${HOST}:7053"
        },
	"peer1.takeda.tryme4u.com": {
            "url": "grpc://${HOST1}:8051",
            "eventUrl": "grpc://${HOST1}:8053"
        },
	"peer2.takeda.tryme4u.com": {
            "url": "grpc://${HOST2}:9051",
            "eventUrl": "grpc://${HOST2}:9053"
        }
    },
    "certificateAuthorities": {
        "ca.takeda.tryme4u.com": {
            "url": "http://${HOST}:7054",
            "caName": "ca.takeda.tryme4u.com"
        }
    }
}
EOF

PRIVATE_KEY="${DIR}"/composer/crypto-config/peerOrganizations/takeda.tryme4u.com/users/Admin@takeda.tryme4u.com/msp/keystore/0b337849b216f5586e584b182945602c91befe9a7f23f88810582649b29f7029_sk
CERT="${DIR}"/composer/crypto-config/peerOrganizations/takeda.tryme4u.com/users/Admin@takeda.tryme4u.com/msp/signcerts/Admin@takeda.tryme4u.com-cert.pem

if [ "${NOIMPORT}" != "true" ]; then
    CARDOUTPUT=/tmp/PeerAdmin@Tryme4u.card
else
    CARDOUTPUT=PeerAdmin@Tryme4u.card
fi

"${HL_COMPOSER_CLI}"  card create -p DevServer_connection.json -u PeerAdmin -c "${CERT}" -k "${PRIVATE_KEY}" -r PeerAdmin -r ChannelAdmin --file $CARDOUTPUT

if [ "${NOIMPORT}" != "true" ]; then
    if "${HL_COMPOSER_CLI}"  card list -c PeerAdmin@Tryme4u > /dev/null; then
        "${HL_COMPOSER_CLI}"  card delete -c PeerAdmin@Tryme4u
    fi

    "${HL_COMPOSER_CLI}"  card import --file /tmp/PeerAdmin@Tryme4u.card 
    "${HL_COMPOSER_CLI}"  card list
    echo "Hyperledger Composer PeerAdmin card has been imported, host of fabric specified as '${HOST}'"
    rm /tmp/PeerAdmin@Tryme4u.card
else
    echo "Hyperledger Composer PeerAdmin card has been created, host of fabric specified as '${HOST}'"
fi
