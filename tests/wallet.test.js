import { web3, createUserAndLogin, getSomeETH, getSomePTI, getUserPTIAddressFromBrowser } from './helpers.js'
import { sendSomeETH } from '../imports/lib/ethereum/helpers.js'
import { assert } from 'chai'

describe('wallet ', function () {
  let userAccount

  beforeEach(function () {
    createUserAndLogin(browser)
    // TODO: refactor and get the address directly using browser.execute
    // browser.pause(2000)
    browser.url('http://localhost:3000/profile')
    // browser.waitForExist('#public_address')
    userAccount = getUserPTIAddressFromBrowser()
  })

  it('should show ETH balance', async function (done) {
    // sendSomeETH(userAccount, 3.1)
    browser.execute(getSomeETH, 3.1)
    browser.waitForClickable('#eth_amount')
    const amount = await browser.getHTML('#eth_amount', false)
    assert.equal(amount, 3.1)
    done()
  })

  it('should show PTI balance', async function (done) {
    sendSomeETH(userAccount, 1)
    browser.execute(getSomePTI, 321)
    browser.click('a[href="#pti"]')
    browser.waitForClickable('#pti_amount')
    const amount = await browser.getHTML('#pti_amount', false)
    assert.equal(amount, 321)
    done()
  })

  it('should be able to send some PTI, update the balance and transaction history', function (done) {
    sendSomeETH(userAccount, 1)
    let description = 'Here is some PTI for you'
    let toAddress = web3.eth.accounts[2]
    browser.execute(getSomePTI, 1412)
    // open the send PTI dialog
    browser.click('a[href="#pti"]')
    browser.waitForClickable('#send-pti')
    browser.click('#send-pti')
    browser.waitForClickable('[name="wallet_friend_number"]')
    browser.setValue('[name="wallet_friend_number"]', toAddress)
    browser.setValue('[name="wallet_amount"]', '5')
    browser.setValue('[name="tx_description"]', description)
    browser.setValue('[name="user_password"]', 'password')
    browser.click('#send_trans_btn')

    // now check if the amount is updated correctly
    browser.waitForExist('#pti_amount')
    // this is the result of 3 - 1.234 ETH - transaction costs
    const expectedAmount = '1407'
    browser.waitUntil(function () {
      return browser.getText('#pti_amount').substr(0, 4) === expectedAmount
    })

    // we should see our transaction description in the transaction history
    browser.click('#transaction-history')

    browser.waitForClickable('.transaction-to')
    browser.waitUntil(function () {
      return browser.getText('.transaction-to')[0] === toAddress
    })

    // TODO: do the PTI transactions via a custom contact that logs the description, so we can get the description from there
    // browser.waitForExist('.transaction-description', 5000)
    // assert.equal(browser.getText('.transaction-description'), description)

    done()
  })

  it('should be able to send some ETH, update the balance and transaction history', function (done) {
    let description = 'Here is some ETH for you'
    browser.waitForExist('#public_address')
    browser.execute(getSomeETH, 3)
    browser.waitForExist('#eth_amount')
    // open the send ETH dialog
    browser.waitForClickable('#send-eth')
    browser.click('#send-eth')
    browser.waitForClickable('[name="wallet_amount"]')
    browser.setValue('[name="wallet_friend_number"]', web3.eth.accounts[1])
    browser.setValue('[name="wallet_amount"]', '1.234')
    browser.setValue('[name="tx_description"]', description)
    browser.setValue('[name="user_password"]', 'password')
    browser.click('#send_trans_btn')

    // now check if the amount is updated correctly
    browser.waitForExist('#eth_amount')
    // this is the result of 3 - 1.234 ETH - transaction costs
    const expectedAmount = '1.76'
    browser.waitUntil(function () {
      return browser.getText('#eth_amount').substr(0, 4) === expectedAmount
    }, 10000)

    // we should see our transaction description in the transaction history
    browser.click('#transaction-history')
    browser.waitForExist('.transaction-description')
    assert.equal(browser.getText('.transaction-description'), description)

    done()
  })
})
