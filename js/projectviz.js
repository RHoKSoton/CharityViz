(function( $ ){

	var Project = Backbone.Model.extend({});

	// Templates
	var projectViewTemplate = Handlebars.compile($('#project-view-template').html());
	var projectPopoverTemplate = Handlebars.compile($('#project-popover-template').html());
	var projectRetrieveSparqlTemplate = Handlebars.compile($('#project-retrieve-sparql-template').html());

	var ProjectView = Backbone.View.extend({
		tagName: 'div',
		template: projectViewTemplate,

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
		template: projectPopoverTemplate,

		initialise: function() {
			this.model.on('change', this.render, this);
		},

		render: function() {
			var attributes = this.model.toJSON();
			console.log(attributes);
			this.$el.html(this.template(attributes));
			return this;
		},
	});

  $.fn.projectViz = function( url ) {  

		return this.each(function() {
			var $this = $(this);
			console.log($this.attr('data-iati'));

			var project = new Project();
			project.set({id:$this.attr('data-iati')});

			var sparql = new SPARQL.Service(url);
			sparql.setPrefix("foaf", "http://xmlns.com/foaf/0.1/");
			sparql.setPrefix("dct", "http://purl.org/dc/terms/");
			sparql.setPrefix("rdfs", 'http://www.w3.org/2000/01/rdf-schema#');
			sparql.setPrefix('owl', 'http://www.w3.org/2002/07/owl#');
			sparql.setPrefix('dc', 'http://purl.org/dc/elements/1.1/');
			sparql.setOutput('json');
			sparql.setMethod('POST');

			var query = sparql.createQuery();
			query.query(
					projectRetrieveSparqlTemplate({project_id:project.id}),
					{
						success: function(json) {

							// Set the new stuff on the project model
							project.set({
								description: json.results.bindings[0].description.value,
								title: json.results.bindings[0].title.value
							});

							// Setup the popover view
							var projectPopover = new ProjectPopover({
								model:project
							}).render();
							$this.popover({
								title: project.get('title'),
								content: projectPopover.el
							});

							// Setup the full project view
							var projectView = new ProjectView({
								model:project
							}).render();
							$('body').append(projectView.el);

							// Setup the modal 
							$this.attr('data-target', '#'+project.get('id'));
							$this.attr('data-toggle', 'modal');
							$('#'+project.get('id')).on('show', function() {
								$($this).popover('hide');
							});
						},

						failure: function() {
							console.log('Oops, something went wrong. <sadface.jpg>');
						}
					}
			);


  	});

  };
})( jQuery );
