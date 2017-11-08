/* globals Modal */

import { getKeystore } from '/imports/lib/ethereum/wallet.js'
import { getUserPTIAddress } from '/imports/api/users.js'
import { Events } from '/imports/api/events.js'
import { web3 } from '/imports/lib/ethereum/web3.js'

import '/imports/ui/components/modals/editProfile.js'
import '/imports/ui/components/modals/doTransaction.js'
import '/imports/ui/components/modals/createNewWallet.js'
import '/imports/ui/components/modals/showSeed.js'
import '/imports/ui/components/modals/modals.js'
import '/imports/ui/components/buttons/fullScreenButton.js'
import '../../components/pageheader/pageheader.js'
import './editProfileButton.js'
import './profile.html'

Template.profile.helpers({
  editProfileButton () {
    return 'editProfileButton'
  },
  events () {
    // Perform a reactive database query against minimongo
    return Events.find()
  },
  userEmail () {
    return Meteor.user().emails[0].address
  },
  hasKeystore () {
    return (getKeystore() !== undefined) ? getKeystore() : false
  },
  userPTIAddress () {
    let address = getUserPTIAddress()
    if (address !== null) {
      return web3.toChecksumAddress(address)
    } else {
      return ''
    }
  },
  eth_balance () {
    const connected = Session.get('eth_isConnected')
    const balance = Session.get('eth_balance')
    if (!connected) {
      return 'Not connected to blockchain'
    }
    if (balance !== undefined) {
      if (balance > 0) {
        const amount = web3.fromWei(balance, 'ether')
        return `${amount} <span class="unit"> ETH</span>`
      } else {
        return 'You don\'t own Ether'
      }
    }
    return 'Connecting to blockchain...'
  },
  pti_balance () {
    const connected = Session.get('eth_isConnected')
    const balance = Session.get('pti_balance')
    if (!connected) {
      return 'Not connected to blockchain'
    }
    if (balance !== undefined) {
      if (balance > 0) {
        const amount = web3.fromWei(balance, 'ether')
        return `${amount} <span class="unit"> PTI</span>`
      } else {
        return 'You don\'t own Paratii'
      }
    }
    return 'Connecting to blockchain...'
  },
  wallet_is_generating () {
    return Session.get('wallet-state') === 'generating'
  }

})

Template.profile.events({
  'click #create-wallet' () {
    // Modal.show('showSeed', { type: 'create' })
    Modal.show('userModal', { setTemplate: 'createNewWallet' })
  },
  'click #send-eth' () {
    Modal.show('doTransaction', { type: 'Eth', label: 'Send Ether' })
  },
  'click #send-pti' () {
    Modal.show('doTransaction', { type: 'PTI', label: 'Send Paratii' })
  },
  'click #restore-keystore' () {
    Modal.show('restoreKeystore', {})
  },
  'click #show-seed' () {
    // Modal.show('showSeed', { type: 'show' })
    Modal.show('userModal', { setTemplate: 'showSeed' })
  },
  'click #edit-profile' () {
    Modal.show('editProfile', {})
  },
  'click .earn-button' (event) {
    Modal.show('main_modal', {
      modal: `modal_earn_${event.target.getAttribute('id') === 'earn-eth' ? 'pti' : 'pti'}`,
      data: {
        type: 'PTI'
      }
    })
  }
})

Template.transaction.helpers({
  sendCheck () {
    if (this.sender === getUserPTIAddress()) {
      return true
    }
    return false
  }
})
