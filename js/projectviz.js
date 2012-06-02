(function( $ ){

	var Project = Backbone.Model.extend({});
	var projectViewTemplate = $('#project-view-template').html();
	var projectPopoverTemplate = $('#project-popover-template').html();

	var ProjectView = Backbone.View.extend({
		tagName: 'div',
		template: _.template(projectViewTemplate),

		initialise: function() {
			this.model.on('change', this.render, this);
		},

		render: function() {
			var attributes = this.model.toJSON();
			this.$el.html(this.template(attributes));
			return this;
		},
	});

	var ProjectPopover = Backbone.View.extend({
		template: _.template(projectPopoverTemplate),

		initialise: function() {
			this.model.on('change', this.render, this);
		},

		render: function() {
			var attributes = this.model.toJSON();
			this.$el.html(this.template(attributes));
			return this;
		},
	});

  $.fn.projectViz = function( type ) {  

		return this.each(function() {
			var $this = $(this);
			console.log($this.attr('data-itai'));

			var project = new Project();
			project.set({id:$this.attr('data-itai')});

			// TODO: get more data from query

			var projectPopover = new ProjectPopover({
				model:project
			}).render();

			$this.popover({
				title:'Test',
				content: projectPopover.el
			});
  	});

  };
})( jQuery );
