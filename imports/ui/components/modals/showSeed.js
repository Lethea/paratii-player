/* eslint-env browser */
import { getSeed, createKeystore } from '/imports/lib/ethereum/wallet.js'
import './showSeed.html'

Template.showSeed.onCreated(function () {
  this.errorMessage = new ReactiveVar(null)
  Session.set('passwordType', 'password')
})

Template.showSeed.onRendered(() =>
  Meteor.setTimeout(
    () => $('div.main-modal-showseed').addClass('show-content'),
    1000
  )
)

Template.showSeed.helpers({
  seed () {
    const seed = Session.get('seed')
    return seed
  },
  errorMessage () {
    return Template.instance().errorMessage.get()
  },
  passwordType () {
    return Session.get('passwordType')
  }
})

Template.showSeed.onDestroyed(function () {
  Session.set('seed', null)
})

// TODO: remove this function!!1!!
const createNewSeed = password => {
  Session.set('wallet-state', 'generating')
  createKeystore(password, undefined, function (err, seed) {
    Session.set('wallet-state', '')
    // button.button('reset')
    if (err) {
      throw err
    }
    Session.set('seed', seed)
  })
}

Template.showSeed.events({
  'submit #form-show-seed' (event, instance) {
    event.preventDefault()
    const button = $('#btn-show-seed')
    button.button('loading')
    const password = event.target.user_password.value
    Meteor.call('checkPassword', password, (error, result) => {
      if (error) {
        throw error
      }
      if (result) {
        console.log('typeeee ', this)
        if (this.type === 'create') {
          // TODO: ?????????????????
          createNewSeed(password)
        } else {
          getSeed(password, () => {
            button.button('reset')
          })
        }
      } else {
        instance.errorMessage.set('Wrong password')
        button.button('reset')
      }
    })
  }
})
