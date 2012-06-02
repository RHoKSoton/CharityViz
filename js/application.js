$(window).load(function() {

	var projects = {};
	var Project = Backbone.Model.extend({});
	var projectViewTemplate = $('#project-view-template').html();

	var ProjectView = Backbone.View.extend({
		tagName: 'div',
		template: _.template(projectViewTemplate),

		initialise: function() {
			this.model.on('change', this.render, this);
		},

		render: function() {
			var attributes = this.model.toJSON();
			this.$el.html(this.template(attributes));
		},
	});

	// TODO: perform initial queries

	// var project = new Project();
	// var projectView = new ProjectView({
	// 	el: $('#modal-test'),
	// 	model: project
	// }).render();

});