import { Template } from 'meteor/templating'
import { sendTransaction } from '/imports/lib/ethereum/wallet.js'
import { web3 } from '/imports/lib/ethereum/connection.js'
import { getContract } from '/imports/lib/ethereum/contracts.js'
import { checkPassword, getUserPTIAddress } from '/imports/api/users.js'
import '/imports/lib/validate.js'
import './unlockVideo.html'

var promisify = require('promisify-node')

Template.unlockVideo.onCreated(() => {
  Session.set('passwordType', 'password')
})

Template.unlockVideo.onRendered(function () {
  Meteor.setTimeout(() => $('div.main-modal-unlock').addClass('show-content'), 1000)
})

Template.unlockVideo.helpers({
  ima () {
    return Session.get('dataUrl')
  },
  userEmail () {
    return Meteor.user().emails[0].address
  },
  getErrors (name) {
    const check = Session.get('checkTransaction')
    // user_password, wallet_amount, wallet_amount
    return check[name]
  },
  passwordType () {
    return Session.get('passwordType')
  }
})

Template.unlockVideo.events({
  'click button.password' (event, instance) {
    let inputType = (Session.get('passwordType') === 'password') ? 'text' : 'password'
    Session.set('passwordType', inputType)
  },
  async 'submit #form-unlockVideo' (event) {
    event.preventDefault()
    let amount = event.target.wallet_amount.value
    let videoId = this.videoid // Video id whne you unlock a video
    const password = event.target.user_password.value
    const check = Session.get('checkTransaction')

    let balance
    balance = web3.fromWei(Session.get('pti_balance'), 'ether')

    if (parseFloat(amount) <= 0 || isNaN(parseFloat(amount)) === true) {
      check.wallet_amount = 'This value is not allowed'
    } else if (parseFloat(amount) > parseFloat(balance)) {
      check.wallet_amount = `You don't have enough PTI: your balance is ${balance}`
    } else {
      check.wallet_amount = null
    }

    let ethBalance = Session.get('eth_balance')

    if (ethBalance === 0) {
      check.wallet_amount = `You need some Ether for sending a transaction - but you have none`
    }
    const isvalid = await checkPassword(password)
    if (isvalid === true) {
      check.user_password = null
    } else {
      check.user_password = 'Wrong password'
    }
    const errors = _.find(check, function (value) {
      return value != null
    })
    Session.set('checkTransaction', check)
    if (errors === undefined) {
      // the transaction has two steps - we first approve that the paratiiavatar can move `price`, and then instruct the videoStore to buy the video
      // buyVideo(videoId)
      // check if the video is known and get the price
      let price = web3.toWei(14)
      let videoRegistry = await getContract('VideoRegistry')
      console.log('videoRegistry located at:', videoRegistry.address)
      let videoInfo = await videoRegistry.getVideoInfo(videoId)
      console.log('VideoInfo from registry:', videoInfo)
      if (videoInfo[0] === '0x0000000000000000000000000000000000000000') {
        // the video was not registered
        throw Error(`A video with id ${videoId} was not found in the registry`)
      }

      console.log(`price: ${Number(videoInfo[1])}`)
      console.log(`approve ${price}`, price)
      let paratiiAvatar = await getContract('ParatiiAvatar')
      console.log(`approve ${price}`, price)
      await promisify(sendTransaction)(password, 'ParatiiToken', 'approve', [paratiiAvatar.address, price], 0)

      let paratiiToken = await getContract('ParatiiToken')
      console.log('allowance:', Number(await paratiiToken.allowance(getUserPTIAddress(), paratiiAvatar.address)))

      console.log(`now calling buyVideo ${videoId}`)
      await promisify(sendTransaction)(password, 'VideoStore', 'buyVideo', [videoId], 0)
      Modal.hide('unlockVideo')
    }
  }
})
