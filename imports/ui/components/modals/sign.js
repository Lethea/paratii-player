import './sign.html'

let $modal
let $email
let $password
let $username
let $buttonPassword
let isModalOpened = false
const animIn = 10
const animOut = 500

//

function emailValidation (address) {
  return /^[A-Z0-9'.1234z_%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(address)
}

function modalGetElements (type) {
  $modal = $('div.main-modal-sign')
  $email = $('[name=email]')
  $password = $('[name=password]')
  $buttonPassword = $('[name=password]')
  if (type === 'sign-up') {
    $username = $('[name=username]')
  }
}

function modalShowContent (type) {
  let timeAnimIn

  modalGetElements(type)

  timeAnimIn = animIn

  if (!isModalOpened) {
    isModalOpened = true
    timeAnimIn = animIn + 850
  }

  Meteor.setTimeout(() => $modal.addClass('show-content'), timeAnimIn)
}

function modalHideContent (template, type) {
  $modal.removeClass('show-content')
  Meteor.setTimeout(() => template.templateInstance().modalState.set('type', type), animOut)
}

function changePasswordType () {
  let inputType = $buttonPassword.attr('type')
  inputType = (inputType === 'text') ? 'password' : 'text'
  $buttonPassword.attr('type', inputType)
}

function sendForms (type) {
  let userData = {
    username: (type === 'sign-up') ? $username.val() : '',
    email: $email.val(),
    password: $password.val()
  }

  if (type === 'sign-up') $username.removeClass('error')
  $password.removeClass('error')
  $email.removeClass('error')

  if (type === 'sign-up' && userData.username.lenght < 2) {
    $username.addClass('error')
  } else if (!emailValidation(userData.email)) {
    $email.addClass('error')
  } else {
    if (type === 'sign-in') {
      Meteor.loginWithPassword(userData.email, userData.password, (err) => {
        if (err) {
          $email.addClass('error')
          $password.addClass('error')
        } else {
          Modal.hide('modal_sign')
        }
      })
    } else {
      Accounts.createUser(userData, (err) => {
        if (err) {
          if (err.reason === 'Need to set a username or email') {
            $email.addClass('error')
            $username.addClass('error')
            $password.removeClass('error')
          } else if (err.reason === 'Password may not be empty') {
            $email.removeClass('error')
            $username.removeClass('error')
            $password.addClass('error')
          } else if (err.reason === 'Email already exists') {
            $email.removeClass('error')
            $username.removeClass('error')
            $password.addClass('error')
          } else {
            $email.removeClass('error')
            $password.removeClass('error')
            $username.removeClass('error')
            console.log(err)
          }
        } else {
          Modal.hide('modal_sign')
        }
      })
    }
  }
}

// Sign

Template.modal_sign.helpers({
  isSignIn: (type) => type === 'sign_in',
  isSignUp: (type) => type === 'sign_up',
  isConfirm: (type) => type === 'confirm',
  modalType: () => Template.instance().modalState.get('type')
})

Template.modal_sign.onCreated(function () {
  isModalOpened = false
  this.modalState = new ReactiveDict()
  this.modalState.set('type', this.data.type)
})

// Sign in

Template.modal_sign_in.onRendered(() => modalShowContent('sign-in'))

Template.modal_sign_in.events({
  'click button.gotosignup' (event, instance) {
    modalHideContent(instance.view.parentView.parentView, 'sign_up')
  },
  'click button.password' (event, instance) {
    changePasswordType()
  },
  'submit form.main-modal-form' (event) {
    event.preventDefault()
    sendForms('sign-in')
  }
})

// Sign up

Template.modal_sign_up.onRendered(() => modalShowContent('sign-up'))

Template.modal_sign_up.events({
  'click button.gotosignin' (event, instance) {
    modalHideContent(instance.view.parentView.parentView, 'sign_in')
  },
  'click button.password' (event, instance) {
    changePasswordType()
  },
  'submit form.main-modal-form' (event) {
    event.preventDefault()
    sendForms('sign-up')
  }
})
