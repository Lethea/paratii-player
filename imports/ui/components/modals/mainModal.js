import './mainModal.html'

Template.mainModal.onCreated(function () {
  // Set template
  Session.set('contentTemplate', this.data.contentTemplate)
  Session.set('wrapperClass', this.data.wrapperClass)
  Session.set('modalErrorMessage', this.data.errorMessage || null)
  Session.set('modelStateMessage', this.data.stateMessage || null)
  // Set options in a reactive var
  this.options = new ReactiveVar()
  this.options.set(this.data)
  console.log(this.data)
})

export let modalHelpers = {
  modalError () {
    return Session.get('modalErrorMessage')
  },
  modalState () {
    return Session.get('modalStateMessage')
  }
}

Template.mainModal.helpers(modalHelpers)
Template.mainModal.helpers({
  contentTemplate: () => Session.get('contentTemplate'),
  wrapperClass: () => Session.get('wrapperClass'),
  options: function () {
    return Template.instance().options.get()
  }
})
