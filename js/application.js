$(window).load(function() {

	var Project = Backbone.Model.extend({});
	var projectViewTemplate = $('#project-view-template').html();

	var ProjectView = Backbone.View.extend({
		tagName: 'div',
		template: _.template(projectViewTemplate),

		initialise: function() {

		},

		render: function() {
			var attributes = this.model.toJSON();
			this.$el.html(this.template(attributes));
		},
	});

	var project = new Project();
	var projectView = new ProjectView({
		el: $('#modal-test'),
		model: project
	}).render();

});