import * as RLocalStorage from 'meteor/simply:reactive-local-storage'
import lightwallet from 'eth-lightwallet/dist/lightwallet.js'
import { Accounts } from 'meteor/accounts-base'
import { add0x } from '/imports/lib/utils.js'
import { getUserPTIAddress } from '/imports/api/users.js'
import { web3, GAS_PRICE, GAS_LIMIT } from './connection.js'
import { getContractAddress } from './contracts.js'
import ParatiiToken from './contracts/ParatiiToken.json'

// createKeystore will create a new keystore
// save it in the session object and in local storage
// generate an address, and save that in the sesssion too
function createKeystore (password, seedPhrase, cb) {
  // create a new seedPhrase if we have none

  Session.set('generating-keystore', true)
  if (seedPhrase == null) {
    seedPhrase = lightwallet.keystore.generateRandomSeed()
  }

  // create a new keystore with the given password and seedPhrase
  const opts = {
    password,
    seedPhrase
  }
  lightwallet.keystore.createVault(opts, function (err, keystore) {
    if (err) {
      cb(err)
      return
    }

    // while we are at it, also generate an address for our user
    keystore.keyFromPassword(password, function (error, pwDerivedKey) {
      if (error) {
        cb(error)
        return
      }
      // generate one new address/private key pairs
      // the corresponding private keys are also encrypted
      keystore.generateNewAddress(pwDerivedKey, 1)
      const address = keystore.getAddresses()[0]

      if (Accounts.userId() !== null) {
        // if there is a logged user, save as always
        saveKeystore(seedPhrase, keystore.serialize(), address)
      } else {
        // else, save in a temporary session variable
        Session.set('tempSeed', seedPhrase)
        Session.set('tempKeystore', keystore.serialize())
        Session.set('tempAddress', add0x(address))
      }
      Session.set('generating-keystore', false)
      if (cb) {
        cb(error, seedPhrase)
      }
    })
  })
}

// save the seed, keystore and address in the session
function saveKeystore (seedPhrase, keystore, address) {
  const userId = Accounts.userId()
  // If the user is not logged in
  // if (userId === null) {
  //   userId = 'anonymous'
  // }
  Session.set('seed', seedPhrase)
  RLocalStorage.setItem(`keystore-${userId}`, keystore)
  Session.set(`keystore-${userId}`, keystore)

  Session.set('userPTIAddress', add0x(address))
  // TODO: we do not seem to be using this anymore...
  Meteor.call('users.update', { 'profile.ptiAddress': add0x(address) })
}

function createAnonymousKeystore () {
  const keystores = keystoresCheck()
  // If there isn't anonyous keystore
  if (keystores.anonymous === 0) {
    createKeystore('password', undefined, function (err, seedPhrase) {
      if (err) {
        throw err
      }
      Session.set('wallet-state', '')
      // Need to save keystore
      const keystore = Session.get('tempKeystore')
      RLocalStorage.setItem(`keystore-anonymous`, keystore)
      Session.set(`keystore-anonymous`, keystore)
      Session.set('tempKeystore', null)
    })
  }
}

// getKeystore tries to load the keystore from the Session,
// or, if it is not found there, restore it from localstorage.
// If no keystore can be found, it returns undefined.
export function getKeystore (user = null) {
  let serializedKeystore
  let userId = Accounts.userId()
  // If the user is not logged in
  if (user === 'anonymous') {
    userId = 'anonymous'
  }
  serializedKeystore = Session.get(`keystore-${userId}`)
  if (serializedKeystore === undefined) {
    serializedKeystore = RLocalStorage.getItem(`keystore-${userId}`)
    if (serializedKeystore !== null) {
      Session.set(`keystore-${userId}`, serializedKeystore)
    }
  }
  // using lightwallet to deserialize the keystore
  if (serializedKeystore !== null) {
    const keystore = lightwallet.keystore.deserialize(serializedKeystore)
    // const address = keystore.getAddresses()[0]
    // Session.set('userPTIAddress', add0x(address))
    return keystore
  }
  return null
}

export function keystoresCheck () {
  let keystores = {}
  keystores.users = 0
  keystores.anonymous = 0
  const storageList = Object.keys(window.localStorage)
  storageList.some(function (element) {
    if (element.indexOf('keystore') >= 0 && element.indexOf('keystore-anonymous') < 0) {
      keystores.users++
    }
    if (element.indexOf('keystore-anonymous') >= 0) {
      keystores.anonymous++
    }
  })
  return keystores
}

// returns the seed of the keystore
function getSeed (password, callback) {
  const keystore = getKeystore()
  if (keystore !== null) {
    keystore.keyFromPassword(password, function (err, pwDerivedKey) {
      if (err) {
        Session.set('errorMessage', 'Incorrect password')
        if (callback) {
          callback(err, null)
        }
        return
      }
      Session.set('errorMessage', null)
      const seed = keystore.getSeed(pwDerivedKey)
      Session.set('seed', seed)
      if (callback) {
        callback(err, seed)
      }
    })
  }
}

function restoreWallet (password, seedPhrase, cb) {
  return createKeystore(password, seedPhrase, cb)
}

function doTx (amount, recipient, password, type, description, extraInfo) {
  // send some ETH or PTI
  // the type argument can either be ETH or PTI
  const fromAddr = getUserPTIAddress()
  const nonce = web3.eth.getTransactionCount(fromAddr)
  const value = parseInt(web3.toWei(amount, 'ether'), 10)

  const keystore = getKeystore()
  keystore.keyFromPassword(password, function (error, pwDerivedKey) {
    if (error) {
      throw error
    }
    // sign the transaction
    const txOptions = {
      nonce: web3.toHex(nonce),
      gasPrice: web3.toHex(GAS_PRICE),
      gasLimit: web3.toHex(GAS_LIMIT)
    }

    let rawTx
    switch (type) {
      case 'Eth':
        txOptions.to = add0x(recipient)
        txOptions.value = web3.toHex(value)
        txOptions.currency = 'eth'
        rawTx = lightwallet.txutils.valueTx(txOptions)
        break
      case 'PTI':
        txOptions.to = getContractAddress('ParatiiToken')
        txOptions.currency = 'pti'
        rawTx = lightwallet.txutils.functionTx(ParatiiToken.abi, 'transfer', [recipient, value], txOptions)
        break
      default:
    }
    const tx = lightwallet.signing.signTx(keystore, pwDerivedKey, rawTx, fromAddr)
    web3.eth.sendRawTransaction(`0x${tx}`, function (err, hash) {
      if (err) {
        throw err
      }
      txOptions.from = fromAddr
      txOptions.description = description
      txOptions.value = value
      txOptions.transactionHash = hash
      Object.assign(txOptions, extraInfo) // If there are options they are merged in the transation object
      Meteor.call('addTXToCollection', txOptions)
    })
  })
}

function sendUnSignedTransaction (address, amount) {
  const toAddr = getUserPTIAddress()
  console.log('send unsigned transaction ')
  web3.eth.sendTransaction({ from: add0x(address), to: add0x(toAddr), value: web3.toWei(amount, 'ether'), gas: 21000, gasPrice: 20000000000 }, function (error, result) {
    console.log('result...')
    if (error) {
      console.log(error)
    }
    console.log(result)
  })
}

async function sendUnSignedContractTransaction (address, value) {
  const contractAddress = await getContractAddress('ParatiiToken')
  const toAddr = getUserPTIAddress()
  const contract = web3.eth.contract(ParatiiToken.abi).at(contractAddress)
  let result = await contract.transfer(toAddr, web3.toWei(value, 'ether'), { gas: 200000, from: address })
  return result
}

export { createKeystore, restoreWallet, doTx, getSeed, sendUnSignedTransaction, sendUnSignedContractTransaction, saveKeystore, createAnonymousKeystore }
