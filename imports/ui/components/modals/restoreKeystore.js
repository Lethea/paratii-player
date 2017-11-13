import { Template } from 'meteor/templating'
import { restoreWallet } from '/imports/lib/ethereum/wallet.js'
import { hideModal, changePasswordType, showModalAlert } from '/imports/lib/utils.js'
import '/imports/api/users.js'
import './restoreKeystore.html'

Template.restoreKeystore.onCreated(function () {
  this.errors = new ReactiveDict()
  this.errors.set('password', null)
  this.errors.set('seed', null)

  Session.set('passwordType', 'password')
})

Template.doTransaction.onDestroyed(function () {
  Session.set('passwordType', null)
})

Template.restoreKeystore.helpers({
  getError (name) {
    return Template.instance().errors.get(name)
  },
  passwordType () {
    return Session.get('passwordType')
  }
})

Template.restoreKeystore.events({
  'click button.password' () {
    changePasswordType()
  },
  'submit #form-restore-keystore' (event, instance) {
    // Prevent default browser form submit
    event.preventDefault()
    const target = event.target
    const password = target['field-password'].value
    const seed = target['field-seed'].value
    Meteor.call('checkPassword', password, (error, result) => {
      if (error) { throw error }
      if (result) {
        restoreWallet(password, seed, function (err, seedPhrase) {
          if (err) {
            instance.errors.set('seed', 'Invalid seed!')
            showModalAlert('Invalid seed', 'error')
          } else {
            hideModal()
            Session.set('user-password', null)
          }
        })
      } else {
        instance.errors.set('password', 'Wrong password')
        showModalAlert('Wrong password', 'error')
      }
    })
  }
})
